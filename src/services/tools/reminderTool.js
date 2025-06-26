import { EmbedBuilder } from 'discord.js'

export class ReminderTool {
    constructor(client) {
        this.client = client
        this.checkInterval = 5 * 60 * 1000 // Check every 5 minutes
        this.intervalId = null
    }

    start() {
        if (this.intervalId) {
            return
        }
        this.checkReminders()
        this.intervalId = setInterval(() => this.checkReminders(), this.checkInterval)
        console.log('Reminder service started')
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = null
            console.log('Reminder service stopped')
        }
    }

    async checkReminders() {
        try {
            const now = new Date()

            // Get all due reminders from UserPreferences
            const dueUsers = await this.client.db.userPreferences.findMany({
                where: {
                    nextCheckIn: {
                        lte: now
                    },
                    remindersEnabled: true
                },
                include: {
                    user: true
                }
            })

            for (const pref of dueUsers) {
                try {
                    // Check if user is banned
                    if (pref.user.isBanned) {
                        console.log(`Skipping reminder for banned user ${pref.id}`)
                        continue
                    }

                    // Check if user exists in Discord
                    const discordUser = await this.client.users.fetch(pref.id.toString())
                    if (!discordUser) {
                        console.log(`User ${pref.id} not found in Discord, skipping reminder`)
                        continue
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Time for a Mood Check-in!')
                        .setDescription(
                            "Hey there! 👋 It's time for your mood check-in.\n\n" +
                                'How are you feeling right now? Use `/checkin` to let me know!\n' +
                                'You can adjust your reminder settings with `/preferences`.'
                        )
                        .setColor(this.client.colors.primary)
                        .setFooter({ text: this.client.footer, iconURL: this.client.logo })

                    // Send reminder based on user's preferred method
                    const reminderMethod = pref.reminderMethod || 'dm'

                    if (reminderMethod === 'dm') {
                        // Send DM reminder
                        await discordUser.send({ embeds: [embed] })
                    } else if (reminderMethod === 'channel') {
                        // Send to guild's check-in channel if available
                        const guilds = await this.client.db.guilds.findMany({
                            where: {
                                enableCheckIns: true,
                                checkInChannelId: { not: null }
                            }
                        })

                        for (const guild of guilds) {
                            try {
                                const guildInstance = await this.client.guilds.fetch(guild.id.toString())
                                const member = await guildInstance.members.fetch(pref.id.toString())

                                if (member) {
                                    const channel = await guildInstance.channels.fetch(guild.checkInChannelId)
                                    if (channel && channel.isTextBased()) {
                                        await channel.send({
                                            content: `<@${pref.id}>`,
                                            embeds: [embed]
                                        })
                                        break
                                    }
                                }
                            } catch (err) {
                                console.error(`Failed to send channel reminder in guild ${guild.id}:`, err)
                            }
                        }
                    }

                    const nextCheckIn = new Date(Date.now() + (pref.checkInInterval ?? 720) * 60 * 1000)
                    await this.client.db.userPreferences.upsert(pref.id.toString(), {
                        nextCheckIn,
                        lastReminder: now
                    })

                    console.log(`Sent reminder to user ${pref.id} via ${reminderMethod}`)
                } catch (err) {
                    console.error(`Failed to send reminder to user ${pref.id}:`, err)
                }
            }
        } catch (err) {
            console.error('Error checking reminders:', err)
        }
    }
}
