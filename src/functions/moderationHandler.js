import {
    analyzeContent,
    trackUserBehavior,
    generateModerationReport,
    recordAction
} from '../services/tools/moderationTool.js'

/**
 * Check if user should be exempt from moderation
 * @param {Object} message - Discord message object
 * @param {Object} client - Discord client
 * @returns {Promise<boolean>} Whether user is exempt
 */
export async function isExemptFromModeration(message, client) {
    try {
        // Check database user role
        const dbUser = await client.db.users.findById(BigInt(message.author.id))
        if (dbUser && ['OWNER', 'ADMIN', 'MOD'].includes(dbUser.role)) {
            return true
        }

        // Check Discord permissions if in guild
        if (message.guild) {
            const member = await message.guild.members.fetch(message.author.id).catch(() => null)
            if (member && (member.permissions.has('ADMINISTRATOR') || member.permissions.has('MANAGE_MEMBERS'))) {
                return true
            }
        }

        return false
    } catch (error) {
        console.error('Error checking moderation exemption:', error)
        return false
    }
}

/**
 * Handle message moderation analysis and actions
 * @param {Object} message - Discord message object
 * @param {Object} client - Discord client
 * @returns {Promise<Object|null>} Moderation result
 */
export async function handleMessageModeration(message, client) {
    try {
        // Skip if user is exempt
        if (await isExemptFromModeration(message, client)) {
            return null
        }

        // Skip DMs (moderation is for guild messages only)
        if (!message.guild) {
            return null
        }

        // Analyze message content and user behavior
        const contentAnalysis = await analyzeContent(message.content)
        const behaviorAnalysis = trackUserBehavior(message.author.id, message.content, message.createdTimestamp)

        // Generate moderation report
        const report = generateModerationReport(contentAnalysis, behaviorAnalysis, message.author.id, message.id)

        // Take action if needed
        if (report.finalAction !== 'none') {
            await executeModerationAction(message, report, client)
            return report
        }

        return null
    } catch (error) {
        console.error('Error handling message moderation:', error)
        return null
    }
}

/**
 * Execute moderation action based on report
 * @param {Object} message - Discord message object
 * @param {Object} report - Moderation report
 * @param {Object} client - Discord client
 */
async function executeModerationAction(message, report, client) {
    try {
        // Record the action
        recordAction(message.author.id, report.finalAction)

        // Send mod alert
        await sendModerationAlert(message, report, client)

        // Execute the action
        switch (report.finalAction) {
            case 'ban':
                await message.member?.ban({ reason: 'Auto-moderation: Severe violation' })
                break
            case 'kick':
                await message.member?.kick({ reason: 'Auto-moderation: Serious violation' })
                break
            case 'mute':
                await applyMuteRole(message, client)
                break
            case 'warn':
                await sendWarning(message, client)
                break
        }

        // Delete the message
        await message.delete().catch(() => {}) // Silent fail if already deleted
    } catch (error) {
        console.error('Error executing moderation action:', error)
    }
}

/**
 * Send moderation alert to mod channel
 */
async function sendModerationAlert(message, report, client) {
    try {
        const modChannelId = await client.db.guilds.getModAlertChannel(message.guild.id)
        const modChannel = modChannelId ? message.guild.channels.cache.get(modChannelId) : null

        if (!modChannel) return

        const modEmbed = new client.Gateway.EmbedBuilder()
            .setTitle('🛡️ Auto-Moderation Action')
            .setDescription(
                `**User:** <@${message.author.id}>\n` +
                    `**Channel:** <#${message.channel.id}>\n` +
                    `**Action Taken:** ${report.finalAction.toUpperCase()}\n\n` +
                    `**Message Content:**\n${message.content.substring(0, 1000)}${message.content.length > 1000 ? '...' : ''}`
            )
            .setColor(getActionColor(report.finalAction, client))
            .setTimestamp()
            .setFooter({ text: client.footer, iconURL: client.logo })

        // Add flagged categories
        const flaggedCategories = Object.entries(report.content.categories)
            .filter(([_, flagged]) => flagged)
            .map(([category]) => `• ${category}`)
            .join('\n')

        if (flaggedCategories) {
            modEmbed.addFields({
                name: 'Flagged Categories',
                value: flaggedCategories,
                inline: false
            })
        }

        // Add behavior analysis if spam detected
        if (report.behavior.spamDetected) {
            modEmbed.addFields({
                name: 'Behavior Analysis',
                value:
                    `Messages/min: ${report.behavior.messageFrequency.toFixed(1)}\n` +
                    `Unique messages: ${(report.behavior.repetitionRatio * 100).toFixed(1)}%\n` +
                    `Recent warnings: ${report.behavior.recentInfractions.warnings}\n` +
                    `Recent mutes: ${report.behavior.recentInfractions.mutes}`,
                inline: false
            })
        }

        await modChannel.send({ embeds: [modEmbed] })
    } catch (error) {
        console.error('Error sending moderation alert:', error)
    }
}

/**
 * Apply mute role to user
 */
async function applyMuteRole(message, client) {
    try {
        const mutedRole = message.guild.roles.cache.find(r => r.name === 'Muted')
        if (mutedRole && message.member) {
            await message.member.roles.add(mutedRole)

            // Remove role after 1 hour
            setTimeout(async () => {
                try {
                    if (message.member) {
                        await message.member.roles.remove(mutedRole)
                    }
                } catch (error) {
                    console.error('Error removing muted role:', error)
                }
            }, 3600000)
        }
    } catch (error) {
        console.error('Error applying mute role:', error)
    }
}

/**
 * Send warning to user
 */
async function sendWarning(message, client) {
    try {
        const warnEmbed = new client.Gateway.EmbedBuilder()
            .setTitle('⚠️ Warning')
            .setDescription('Your message was flagged for inappropriate content. Please review our server rules.')
            .setColor(client.colors.warning)
            .setFooter({ text: client.footer, iconURL: client.logo })

        await message.reply({ embeds: [warnEmbed], allowedMentions: { repliedUser: true } })
    } catch (error) {
        console.error('Error sending warning:', error)
    }
}

/**
 * Get color for moderation action
 */
function getActionColor(action, client) {
    switch (action) {
        case 'ban':
            return client.colors.error
        case 'kick':
            return client.colors.warning
        case 'mute':
            return '#FFA500' // Orange
        default:
            return client.colors.primary
    }
}
