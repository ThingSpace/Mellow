import { Events, ChannelType } from 'discord.js'

import {
    analyzeMessageContent,
    requiresImmediateIntervention as needsImmediateSupport,
    generateCrisisResponse as generateSupportResponse,
    checkCrisisKeywords as analyzeSupportKeywords
} from '../../services/tools/crisisTool.js'

import {
    analyzeContent,
    trackUserBehavior,
    generateModerationReport,
    recordAction
} from '../../services/tools/moderationTool.js'

const COMMANDS = {
    help: ['help', 'h'],
    about: ['about', 'info']
}

export default {
    event: Events.MessageCreate,
    run: async (client, message) => {
        if (message.author.bot) {
            return
        }

        // Handle DMs - Focus on crisis support
        if (message.channel.type === ChannelType.DM) {
            console.log('DM received:', message.content)

            try {
                // Analyze message for crisis indicators
                const analysis = await analyzeMessageContent(message.content)
                const keywordCheck = analyzeSupportKeywords(message.content)

                // Check if immediate support is needed
                if (needsImmediateSupport(analysis) || keywordCheck.hasKeywords) {
                    const response = generateSupportResponse(analysis, client)

                    // Send support message
                    await message.reply({
                        content: response.message,
                        embeds: response.resources
                            ? [
                                  new client.Gateway.EmbedBuilder()
                                      .setTitle('Support Resources')
                                      .setDescription(response.resources.join('\n'))
                                      .setColor(response.color)
                                      .setFooter({ text: client.footer, iconURL: client.logo })
                              ]
                            : [],
                        allowedMentions: { repliedUser: true }
                    })

                    // Alert mods if needed
                    if (response.modAlert) {
                        // Get mod channel from settings
                        const modChannelId = await client.db.guilds.getModAlertChannel(message.guild?.id)
                        const modChannel = modChannelId ? client.channels.cache.get(modChannelId) : null

                        if (modChannel) {
                            const alertEmbed = new client.Gateway.EmbedBuilder()
                                .setTitle('🚨 Support Alert')
                                .setDescription(
                                    `**User:** <@${message.author.id}>\n` +
                                        `**Message:** ${message.content}\n\n` +
                                        `**Analysis:**\n${Object.entries(analysis.flaggedCategories)
                                            .map(([category, score]) => `• ${category}: ${(score * 100).toFixed(1)}%`)
                                            .join('\n')}`
                                )
                                .setColor(response.color)
                                .setTimestamp()
                                .setFooter({ text: client.footer, iconURL: client.logo })

                            await modChannel.send({ embeds: [alertEmbed] })
                        }
                    }
                }

                // Process AI response for DMs
                try {
                    const aiResponse = await client.ai.generateResponse(message.content, message.author.id)
                    await message.reply({
                        content: aiResponse,
                        allowedMentions: { repliedUser: true }
                    })
                } catch (error) {
                    console.error('Error generating AI response:', error)
                    await message.reply(
                        "I apologize, but I'm having trouble processing your message right now. Please try again later."
                    )
                }
            } catch (error) {
                console.error('Error processing DM:', error)
            }
            return
        }

        // Handle guild messages - Focus on moderation
        const mention = new RegExp(`^<@!?${client.user.id}> ?`)
        const args = message.content.split(' ')
        const req = args[1]?.trim()?.toLowerCase()
        const bot = args[0]

        // Auto-moderation for guild messages
        try {
            // Analyze message content and user behavior
            const contentAnalysis = await analyzeContent(message.content)
            const behaviorAnalysis = trackUserBehavior(message.author.id, message.content, message.createdTimestamp)

            // Generate moderation report
            const report = generateModerationReport(contentAnalysis, behaviorAnalysis, message.author.id, message.id)

            // Take action based on moderation report
            if (report.finalAction !== 'none') {
                // Record the action
                recordAction(message.author.id, report.finalAction)

                // Get mod channel for logging
                const modChannelId = await client.db.guilds.getModAlertChannel(message.guild.id)
                const modChannel = modChannelId ? message.guild.channels.cache.get(modChannelId) : null

                // Create moderation embed
                const modEmbed = new client.Gateway.EmbedBuilder()
                    .setTitle('🛡️ Auto-Moderation Action')
                    .setDescription(
                        `**User:** <@${message.author.id}>\n` +
                            `**Channel:** <#${message.channel.id}>\n` +
                            `**Action Taken:** ${report.finalAction.toUpperCase()}\n\n` +
                            `**Message Content:**\n${message.content}\n\n` +
                            `**Reason:**\n${Object.entries(report.content.categories)
                                .filter(([_, flagged]) => flagged)
                                .map(([category]) => `• ${category}`)
                                .join('\n')}`
                    )
                    .setColor(
                        report.finalAction === 'ban'
                            ? client.colors.error
                            : report.finalAction === 'kick'
                              ? client.colors.warning
                              : report.finalAction === 'mute'
                                ? client.colors.yellow
                                : client.colors.primary
                    )
                    .setTimestamp()
                    .setFooter({ text: client.footer, iconURL: client.logo })

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

                // Send mod alert
                if (modChannel) {
                    await modChannel.send({ embeds: [modEmbed] })
                }

                // Take moderation action
                try {
                    switch (report.finalAction) {
                        case 'ban':
                            await message.member.ban({ reason: 'Auto-moderation: Severe violation' })
                            break
                        case 'kick':
                            await message.member.kick({ reason: 'Auto-moderation: Serious violation' })
                            break
                        case 'mute':
                            // Assuming you have a muted role
                            const mutedRole = message.guild.roles.cache.find(r => r.name === 'Muted')
                            if (mutedRole) {
                                await message.member.roles.add(mutedRole)
                                // Set timeout to remove role after 1 hour
                                setTimeout(async () => {
                                    try {
                                        await message.member.roles.remove(mutedRole)
                                    } catch (error) {
                                        console.error('Error removing muted role:', error)
                                    }
                                }, 3600000)
                            }
                            break
                        case 'warn':
                            const warnEmbed = new client.Gateway.EmbedBuilder()
                                .setTitle('⚠️ Warning')
                                .setDescription(
                                    'Your message was flagged for inappropriate content. Please review our server rules.'
                                )
                                .setColor(client.colors.warning)
                                .setFooter({ text: client.footer, iconURL: client.logo })
                            await message.reply({ embeds: [warnEmbed], allowedMentions: { repliedUser: true } })
                            break
                    }

                    // Delete message if action was taken
                    await message.delete()
                } catch (actionError) {
                    console.error('Error taking moderation action:', actionError)
                }
            }
        } catch (moderationError) {
            console.error('Error in auto-moderation:', moderationError)
        }

        // Check if message is a reply to the bot or starts with bot mention
        if (message.reference?.messageId) {
            const repliedTo = await message.channel.messages.fetch(message.reference.messageId)
            if (repliedTo.author.id !== client.user.id) {
                return
            }
        } else if (!mention.test(message.content)) {
            return
        }

        // Handle bot commands and AI responses
        if (COMMANDS[req]) {
            await COMMANDS[req](message, client, args.slice(2))
        } else {
            try {
                const aiResponse = await client.ai.generateResponse(message.content, message.author.id)
                await message.reply({
                    content: aiResponse,
                    allowedMentions: { repliedUser: true }
                })
            } catch (error) {
                console.error('Error generating AI response:', error)
                await message.reply(
                    "I apologize, but I'm having trouble processing your message right now. Please try again later."
                )
            }
        }
    }
}
