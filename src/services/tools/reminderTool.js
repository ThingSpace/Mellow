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
                        try {
                            await discordUser.send({ embeds: [embed] })
                        } catch (dmError) {
                            // Handle cases where user has DMs disabled
                            if (dmError.code === 50007) {
                                console.log(`User ${pref.id} has DMs disabled, disabling reminders`)

                                // Disable reminders for this user
                                await this.client.db.userPreferences.upsert(pref.id.toString(), {
                                    remindersEnabled: false,
                                    reminderFailureReason: 'DMs disabled'
                                })

                                // Log this event
                                if (this.client.systemLogger) {
                                    await this.client.systemLogger.logUserEvent(
                                        pref.id.toString(),
                                        pref.user?.username || 'Unknown',
                                        'reminder_disabled_dm_blocked',
                                        { reason: 'User has DMs disabled', errorCode: 50007 }
                                    )
                                }

                                // Try to notify user in a shared guild if possible
                                await this.tryNotifyUserInGuild(pref.id.toString(), embed)
                                continue // Skip to next user - don't update nextCheckIn since reminders are disabled
                            } else {
                                // For other DM errors, just log and continue
                                console.error(`Failed to send DM reminder to user ${pref.id}:`, dmError)
                                continue // Skip to next user for other errors too
                            }
                        }
                    } else if (reminderMethod === 'channel') {
                        // Send to shared guild's check-in channel if available
                        let reminderSent = false

                        // Get all guilds where the user is a member and check-ins are enabled
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
                                if (dmErr.code === 50007) {
                                    console.log(`User ${pref.id} has DMs disabled, disabling reminders`)

                                    // Disable reminders for this user
                                    await this.client.db.userPreferences.upsert(pref.id.toString(), {
                                        remindersEnabled: false,
                                        reminderFailureReason: 'DMs disabled'
                                    })

                                    // Log this event
                                    if (this.client.systemLogger) {
                                        await this.client.systemLogger.logUserEvent(
                                            pref.id.toString(),
                                            pref.user?.username || 'Unknown',
                                            'reminder_disabled_dm_blocked',
                                            { reason: 'User has DMs disabled (fallback)', errorCode: 50007 }
                                        )
                                    }
                                } else {
                                    console.error(`Failed to send fallback DM to user ${pref.id}:`, dmErr)
                                }
                                continue // Skip to next user if DM failed
                            }
                        }
                    }

                    // Only update nextCheckIn if reminder was sent successfully
                    const nextCheckIn = new Date(Date.now() + (pref.checkInInterval ?? 720) * 60 * 1000)
                    await this.client.db.userPreferences.upsert(pref.id.toString(), {
                        nextCheckIn,
                        lastReminder: now
                    })

                    console.log(`Sent reminder to user ${pref.id} via ${reminderMethod}`)
                } catch (err) {
                    // Handle any other errors gracefully
                    if (err.code === 50007) {
                        console.log(`User ${pref.id} has DMs disabled, disabling reminders`)

                        // Disable reminders for this user
                        await this.client.db.userPreferences.upsert(pref.id.toString(), {
                            remindersEnabled: false,
                            reminderFailureReason: 'DMs disabled'
                        })

                        // Log this event
                        if (this.client.systemLogger) {
                            await this.client.systemLogger.logUserEvent(
                                pref.id.toString(),
                                pref.user?.username || 'Unknown',
                                'reminder_disabled_dm_blocked',
                                { reason: 'User has DMs disabled (catch-all)', errorCode: 50007 }
                            )
                        }
                    } else {
                        console.error(`Failed to send reminder to user ${pref.id}:`, err)
                    }
                }
            }
        } catch (err) {
            console.error('Error checking reminders:', err)
        }
    }

    /**
     * Try to notify a user in a shared guild when DM fails
     * @param {string} userId - Discord user ID
     * @param {EmbedBuilder} originalEmbed - The original reminder embed
     */
    async tryNotifyUserInGuild(userId, originalEmbed) {
        try {
            // Get guilds where the user is a member and the bot can send messages
            const enabledGuilds = await this.client.db.guilds.findMany({
                where: {
                    enableCheckIns: true,
                    checkInChannelId: { not: null }
                }
            })

            for (const guildData of enabledGuilds) {
                try {
                    const guildInstance = await this.client.guilds.fetch(guildData.id.toString())
                    if (!guildInstance) continue

                    const member = await guildInstance.members.fetch(userId).catch(() => null)
                    if (!member) continue

                    const channel = await guildInstance.channels
                        .fetch(guildData.checkInChannelId.toString())
                        .catch(() => null)
                    if (!channel || !channel.isTextBased()) continue

                    // Create a modified embed explaining the DM issue
                    const notificationEmbed = new this.client.Gateway.EmbedBuilder()
                        .setTitle('⚠️ Reminder Settings Update Needed')
                        .setDescription(
                            `Hey <@${userId}>! 👋\n\n` +
                                `I tried to send you a check-in reminder via DM, but it looks like you have DMs disabled. ` +
                                `I've automatically disabled your reminders for now.\n\n` +
                                `If you'd like to continue receiving reminders, you can:\n` +
                                `• Enable DMs from server members in your Discord privacy settings\n` +
                                `• Use \`/preferences\` to set reminders to be sent in this channel instead\n` +
                                `• Re-enable reminders with \`/preferences\` once you've updated your settings`
                        )
                        .setColor(this.client.colors.warning)
                        .setFooter({ text: this.client.footer, iconURL: this.client.logo })

                    await channel.send({ embeds: [notificationEmbed] })
                    console.log(`Notified user ${userId} about DM issue in guild ${guildData.id}`)
                    return true // Successfully notified, don't try other guilds
                } catch (err) {
                    // Silently continue to next guild
                    continue
                }
            }
        } catch (err) {
            // Log but don't throw - this is a best-effort notification
            console.error(`Failed to notify user ${userId} in guild:`, err)
        }
        return false
    }
}
