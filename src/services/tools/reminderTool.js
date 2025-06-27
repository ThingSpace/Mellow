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
                                'How are you feeling right now? Use `/checkin` to let me know! You can adjust your reminder settings with `/preferences`.'
                        )
                        .setColor(this.client.colors.primary)
                        .setFooter({ text: this.client.footer, iconURL: this.client.logo })

                    // Send reminder based on user's preferred method
                    const reminderMethod = pref.reminderMethod || 'dm'

                    if (reminderMethod === 'dm') {
                        // Send DM reminder
                        await discordUser.send({ embeds: [embed] })
                    } else if (reminderMethod === 'channel') {
                        // Send to shared guild's check-in channel if available
                        let reminderSent = false

                        // Get all guilds the bot is in that have check-ins enabled
                        const enabledGuilds = await this.client.db.guilds.findMany({
                            where: {
                                enableCheckIns: true,
                                checkInChannelId: { not: null }
                            }
                        })

                        for (const guildData of enabledGuilds) {
                            try {
                                // Check if bot is still in the guild and user is a member
                                const guildInstance = await this.client.guilds.fetch(guildData.id.toString())
                                if (!guildInstance) continue

                                const member = await guildInstance.members.fetch(pref.id.toString()).catch(() => null)
                                if (!member) continue

                                const channel = await guildInstance.channels
                                    .fetch(guildData.checkInChannelId.toString())
                                    .catch(() => null)
                                if (!channel || !channel.isTextBased()) continue

                                // Send reminder to the channel
                                await channel.send({
                                    content: `<@${pref.id}>`,
                                    embeds: [embed]
                                })

                                reminderSent = true
                                break // Only send to the first available channel
                            } catch (err) {
                                console.error(`Failed to send channel reminder in guild ${guildData.id}:`, err)
                            }
                        }

                        // Fallback to DM if no channel reminder was sent
                        if (!reminderSent) {
                            try {
                                await discordUser.send({ embeds: [embed] })
                                console.log(`Fallback: Sent DM reminder to user ${pref.id} (channel method failed)`)
                            } catch (dmErr) {
                                console.error(`Failed to send fallback DM to user ${pref.id}:`, dmErr)
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
