import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import {
    contextTypes,
    contextTypeDescriptions,
    getAllContextTypes,
    futureContextTypes
} from '../../../configs/contextTypes.config.js'

export default {
    structure: {
        name: 'context',
        category: 'Users',
        description: 'View your AI conversation context and useful information',
        handlers: {
            cooldown: 10000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: [
            {
                name: 'details',
                description: 'Show detailed information about context types and how they work',
                type: cmdTypes.BOOLEAN,
                required: false
            }
        ]
    },
    run: async (client, interaction) => {
        try {
            const userId = interaction.user.id
            const showDetails = interaction.options.getBoolean('details') || false

            // Get conversation history stats
            const totalHistory = await client.db.conversationHistory.findMany({
                where: { userId: BigInt(userId) },
                select: { id: true, timestamp: true, isAiResponse: true, contextType: true }
            })

            const userMessages = totalHistory.filter(msg => !msg.isAiResponse).length
            const aiResponses = totalHistory.filter(msg => msg.isAiResponse).length
            const conversationContext = totalHistory.filter(msg => msg.contextType === contextTypes.CONVERSATION).length
            const channelContext = totalHistory.filter(msg => msg.contextType === contextTypes.CHANNEL_CONTEXT).length
            const systemContext = totalHistory.filter(msg => msg.contextType === contextTypes.SYSTEM).length

            // Calculate additional context stats
            const crisisContext = totalHistory.filter(msg => msg.contextType === 'crisis').length
            const therapeuticContext = totalHistory.filter(msg => msg.contextType === 'therapeutic').length
            const moderationContext = totalHistory.filter(msg => msg.contextType === 'moderation').length

            // Get recent context that would be used (count only)
            const recentContext = await client.ai.messageHistory.getEnhancedContext(
                userId,
                interaction.channel?.id,
                100,
                20
            )

            // Get conversation summary info (just existence check)
            const summary = await client.ai.messageHistory.getConversationSummary(userId, 7)
            const hasSummary = summary && summary.length > 50

            // Calculate time range for recent history
            const recentDate =
                totalHistory.length > 0 ? new Date(Math.min(...totalHistory.map(h => new Date(h.timestamp)))) : null

            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('🧠 AI Context & Memory Information')
                .setDescription(
                    showDetails
                        ? "Here's a detailed breakdown of how your conversation history helps me provide personalized support and how conversation summaries work:"
                        : "Here's what conversation history I can remember from our interactions and how it improves our conversations:"
                )
                .setColor(client.colors.primary)

            if (showDetails) {
                // Show detailed information about context types
                embed.addFields(
                    {
                        name: '💬 Context Types & How They Work',
                        value: [
                            `**📞 Conversation Context (${conversationContext}):** ${contextTypeDescriptions[contextTypes.CONVERSATION].description}`,
                            `   • Purpose: ${contextTypeDescriptions[contextTypes.CONVERSATION].purpose}`,
                            `   • Retention: ${contextTypeDescriptions[contextTypes.CONVERSATION].retention}`,
                            '',
                            `**🌐 Channel Context (${channelContext}):** ${contextTypeDescriptions[contextTypes.CHANNEL_CONTEXT].description}`,
                            `   • Purpose: ${contextTypeDescriptions[contextTypes.CHANNEL_CONTEXT].purpose}`,
                            `   • Retention: ${contextTypeDescriptions[contextTypes.CHANNEL_CONTEXT].retention}`,
                            '',
                            `**⚙️ System Context (${systemContext}):** ${contextTypeDescriptions[contextTypes.SYSTEM].description}`,
                            `   • Purpose: ${contextTypeDescriptions[contextTypes.SYSTEM].purpose}`,
                            `   • Retention: ${contextTypeDescriptions[contextTypes.SYSTEM].retention}`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🧠 How Conversation Summaries Work',
                        value: [
                            '• **Smart Compression:** Long conversations are intelligently summarized to preserve key information',
                            '• **Pattern Recognition:** I identify important themes, mood patterns, and coping strategies',
                            '• **Context Preservation:** Summaries maintain emotional context and ongoing situations',
                            '• **Memory Efficiency:** Allows me to remember more of our history without overwhelming detail',
                            `• **Your Summary Status:** ${hasSummary ? '✅ Active - I have a summary of our conversations' : '❌ Not yet generated - we need more conversation history'}`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🔄 Context Processing & AI Memory',
                        value: [
                            '• **Recent Memory:** I actively remember our last 30-100 messages for ongoing conversations',
                            '• **Context Blending:** I combine your history with recent channel activity for better understanding',
                            '• **Adaptive Learning:** I learn your communication style and preferred coping strategies',
                            '• **Crisis Pattern Detection:** I watch for concerning patterns across our conversations',
                            "• **Privacy Filtering:** Only includes messages you've consented to share via `/preferences`"
                        ].join('\n'),
                        inline: false
                    }
                )

                // Add information about future context types if any data exists
                const hasAdditionalContext = crisisContext + therapeuticContext + moderationContext > 0
                if (hasAdditionalContext) {
                    embed.addFields({
                        name: '🚀 Advanced Context Features',
                        value: [
                            crisisContext > 0
                                ? `• **Crisis Context (${crisisContext}):** Safety intervention and support patterns`
                                : '',
                            therapeuticContext > 0
                                ? `• **Therapeutic Context (${therapeuticContext}):** Coping tool usage and therapeutic insights`
                                : '',
                            moderationContext > 0
                                ? `• **Moderation Context (${moderationContext}):** Administrative interactions and warnings`
                                : '',
                            '',
                            '*These advanced features help provide more specialized support.*'
                        ]
                            .filter(line => line)
                            .join('\n'),
                        inline: false
                    })
                }

                embed.addFields({
                    name: '🔒 Privacy & Data Control',
                    value: [
                        '• **Your Choice:** Enable/disable context logging anytime with `/preferences update context_logging:false`',
                        '• **Data Retention:** Conversation history automatically expires after 90 days',
                        '• **Server Settings:** Server admins can control guild-wide context logging',
                        '• **Transparency:** Use `/context` anytime to see exactly what I remember',
                        '• **Data Deletion:** Use `/preferences reset` to clear all stored conversation history',
                        '• **Privacy First:** Context logging is disabled by default - you choose to enable it'
                    ].join('\n'),
                    inline: false
                })
            } else {
                // Show standard context statistics
                embed.addFields(
                    {
                        name: '📚 Total Conversation History',
                        value: [
                            `• Your messages to me: **${userMessages}**`,
                            `• My responses to you: **${aiResponses}**`,
                            `• Total conversation entries: **${totalHistory.length}**`,
                            `• Data storage: ${totalHistory.length > 0 ? '✅ Active' : '⚠️ No history stored'}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🔄 Active Context Memory',
                        value: [
                            `• Messages I currently remember: **${recentContext.length}**`,
                            `• Your recent messages: **${recentContext.filter(m => m.role === 'user').length}**`,
                            `• My recent responses: **${recentContext.filter(m => m.role === 'assistant').length}**`,
                            `• Recent channel context: **${recentContext.filter(m => m.role === 'system').length}**`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '�️ Context Types Breakdown',
                        value: [
                            `• **Conversation:** ${conversationContext} (direct messages)`,
                            `• **Channel Context:** ${channelContext} (server discussions)`,
                            `• **System Notes:** ${systemContext} (preferences & patterns)`,
                            ...(crisisContext > 0
                                ? [`• **Crisis Support:** ${crisisContext} (safety interventions)`]
                                : []),
                            ...(therapeuticContext > 0
                                ? [`• **Therapeutic:** ${therapeuticContext} (coping tools & insights)`]
                                : []),
                            ...(moderationContext > 0
                                ? [`• **Moderation:** ${moderationContext} (admin interactions)`]
                                : [])
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '�🔍 Context Analysis & Summary',
                        value: [
                            `• **Conversation summary:** ${hasSummary ? '✅ Generated - I have a comprehensive understanding of our conversations' : '❌ Not yet available - we need more conversation history to generate a summary'}`,
                            `• **Our conversations started:** ${recentDate ? `<t:${Math.floor(recentDate.getTime() / 1000)}:R>` : 'No conversation history'}`,
                            `• **Context logging status:** ${totalHistory.length > 0 ? '✅ Active and collecting context' : '⚠️ Limited - consider enabling in /preferences'}`,
                            `• **Memory effectiveness:** ${recentContext.length > 10 ? '🎯 High - Rich context for personalized responses' : recentContext.length > 0 ? '📝 Moderate - Some context available' : '⚡ Minimal - Limited personalization'}`
                        ].join('\n'),
                        inline: false
                    }
                )

                // Add a note about enabling more context types
                if (totalHistory.length > 0) {
                    embed.addFields({
                        name: '💡 Tip: Get More Detailed Information',
                        value: [
                            '• Use `/context details:true` to see how context types work',
                            '• Use `/preferences view` to check your privacy settings',
                            '• Use `/preferences update context_logging:true` to enable context logging',
                            '• Context logging improves my ability to provide personalized support'
                        ].join('\n'),
                        inline: false
                    })
                }
            }

            embed
                .setFooter({
                    text: showDetails
                        ? 'Use /context for statistics • Use /preferences to manage context logging • Context improves personalized support'
                        : 'Use /context details:true for detailed explanations • Use /preferences to manage privacy settings',
                    iconURL: client.logo
                })
                .setTimestamp()

            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            console.error('Error in context command:', error)
            await interaction.reply({
                content: 'Sorry, I had trouble retrieving your context information.',
                ephemeral: true
            })
        }
    }
}
