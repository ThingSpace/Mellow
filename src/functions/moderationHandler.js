import {
    analyzeContent,
    trackUserBehavior,
    generateModerationReport,
    recordAction
} from '../services/tools/moderationTool.js'
import { PermissionFlagsBits } from 'discord.js'

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
            if (member) {
                // Check Discord permissions
                if (
                    member.permissions.has(PermissionFlagsBits.Administrator) ||
                    member.permissions.has(PermissionFlagsBits.ManageMessages)
                ) {
                    return true
                }

                // Check guild-specific moderator role
                const guildSettings = await client.db.guilds.findById(message.guild.id)
                if (guildSettings?.moderatorRoleId && member.roles.cache.has(guildSettings.moderatorRoleId)) {
                    return true
                }
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

        // Check if auto-moderation is enabled for this guild
        const guildSettings = await client.db.guilds.findById(message.guild.id)
        if (!guildSettings?.autoModEnabled) {
            return null
        }

        // Analyze message content and user behavior
        const contentAnalysis = await analyzeContent(message.content)
        const behaviorAnalysis = trackUserBehavior(message.author.id, message.content, message.createdTimestamp)

        // Apply guild-specific auto-mod level (1-5 scale)
        const autoModLevel = guildSettings.autoModLevel || 3
        const shouldTakeAction = shouldModerate(contentAnalysis, behaviorAnalysis, autoModLevel)

        if (!shouldTakeAction) {
            return null
        }

        // Generate moderation report
        const report = generateModerationReport(contentAnalysis, behaviorAnalysis, message.author.id, message.id)

        // Take action if needed
        if (report.finalAction !== 'none') {
            await executeModerationAction(message, report, client, guildSettings)
            return report
        }

        return null
    } catch (error) {
        console.error('Error handling message moderation:', error)
        return null
    }
}

/**
 * Determine if moderation action should be taken based on guild settings
 * @param {Object} contentAnalysis - Content analysis result
 * @param {Object} behaviorAnalysis - Behavior analysis result
 * @param {number} autoModLevel - Guild auto-mod level (1-5)
 * @returns {boolean} Whether to take moderation action
 */
function shouldModerate(contentAnalysis, behaviorAnalysis, autoModLevel) {
    // Adjust thresholds based on auto-mod level
    const thresholds = {
        1: { content: 0.9, behavior: 0.9 }, // Very lenient
        2: { content: 0.8, behavior: 0.8 }, // Lenient
        3: { content: 0.6, behavior: 0.6 }, // Moderate (default)
        4: { content: 0.4, behavior: 0.4 }, // Strict
        5: { content: 0.2, behavior: 0.2 } // Very strict
    }

    const threshold = thresholds[autoModLevel] || thresholds[3]

    // Check if content exceeds threshold
    if (contentAnalysis.flagged) {
        const maxScore = Math.max(...Object.values(contentAnalysis.scores))
        if (maxScore > threshold.content) {
            return true
        }
    }

    // Check if behavior exceeds threshold
    if (behaviorAnalysis.isSpamming && behaviorAnalysis.messageFrequency > 15 - autoModLevel * 2) {
        return true
    }

    return false
}

/**
 * Execute moderation action based on report and guild settings
 * @param {Object} message - Discord message object
 * @param {Object} report - Moderation report
 * @param {Object} client - Discord client
 * @param {Object} guildSettings - Guild settings
 */
async function executeModerationAction(message, report, client, guildSettings) {
    try {
        // Record the action
        recordAction(message.author.id, report.finalAction)

        // Send mod alert to configured channel
        await sendModerationAlert(message, report, client, guildSettings)

        // Execute the action
        switch (report.finalAction) {
            case 'ban':
                await message.member?.ban({ reason: 'Auto-moderation: Severe violation' })
                break
            case 'kick':
                await message.member?.kick({ reason: 'Auto-moderation: Serious violation' })
                break
            case 'mute':
                await applyMuteRole(message, client, guildSettings)
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
 * Send moderation alert to configured mod channel
 */
async function sendModerationAlert(message, report, client, guildSettings) {
    try {
        // Use modLogChannelId for auto-moderation logs, auditLogChannelId for audit logs, fallback to modAlertChannelId for urgent cases
        const modChannelId =
            guildSettings?.modLogChannelId || guildSettings?.auditLogChannelId || guildSettings?.modAlertChannelId
        if (!modChannelId) {
            console.log(`No moderation log channel configured for guild ${message.guild.id}`)
            return
        }

        const modChannel = await message.guild.channels.fetch(modChannelId).catch(() => null)
        if (!modChannel || !modChannel.isTextBased()) {
            console.error(`Moderation channel not found or not text-based: ${modChannelId}`)
            return
        }

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
 * Apply mute role respecting guild moderator role settings
 */
async function applyMuteRole(message, client, guildSettings) {
    try {
        // Try to use configured moderator role or fall back to "Muted" role
        let mutedRole = null

        if (guildSettings?.moderatorRoleId) {
            // Don't use moderator role for muting, that would be backwards
            // Instead, look for a dedicated mute role
        }

        mutedRole = message.guild.roles.cache.find(r => r.name === 'Muted' || r.name === 'Timeout')

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
