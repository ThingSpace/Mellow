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
            // Get all due reminders from UserPreferences
            const now = new Date()
            const dueUsers = await this.client.db.prisma.userPreferences.findMany({
                where: {
                    nextCheckIn: {
                        lte: now
                    }
                },
                include: {
                    user: true
                }
            })

            for (const pref of dueUsers) {
                try {
                    const user = await this.client.users.fetch(pref.id.toString())
                    if (!user) continue

                    const embed = new EmbedBuilder()
                        .setTitle('Time for a Mood Check-in!')
                        .setDescription(
                            "Hey there! 👋 It's time for your mood check-in.\n\n" +
                                'How are you feeling right now? Use `/checkin` to let me know!\n' +
                                'You can adjust your reminder settings with `/preferences`.'
                        )
                        .setColor(this.client.colors.primary)
                        .setFooter({ text: this.client.footer, iconURL: this.client.logo })

                    await user.send({ embeds: [embed] })

                    // Update nextCheckIn to now + checkInInterval (in minutes)
                    const nextCheckIn = new Date(Date.now() + (pref.checkInInterval ?? 720) * 60 * 1000)
                    await this.client.db.prisma.userPreferences.update({
                        where: { id: pref.id },
                        data: { nextCheckIn }
                    })
                } catch (err) {
                    console.error(`Failed to send reminder to user ${pref.id}:`, err)
                }
            }
        } catch (err) {
            console.error('Error checking reminders:', err)
        }
    }
}
