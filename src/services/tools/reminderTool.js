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
            // Get all due reminders
            const dueReminders = await this.client.db.moodCheckIns.getDueReminders()

            for (const reminder of dueReminders) {
                try {
                    const user = await this.client.users.fetch(reminder.userId.toString())
                    if (!user) {
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

                    await user.send({ embeds: [embed] })

                    // Update next check-in time
                    const nextCheckIn = new Date()
                    nextCheckIn.setHours(nextCheckIn.getHours() + reminder.checkInInterval)

                    await this.client.db.prisma.userPreferences.update({
                        where: { userId: reminder.userId },
                        data: { nextCheckIn }
                    })
                } catch (err) {
                    console.error(`Failed to send reminder to user ${reminder.userId}:`, err)
                }
            }
        } catch (err) {
            console.error('Error checking reminders:', err)
        }
    }
}
