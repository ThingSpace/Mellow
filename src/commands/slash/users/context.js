import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'context',
        category: 'Users',
        description: 'Check how much of your conversation history the AI has access to',
        handlers: {
            cooldown: 10000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: []
    },
    run: async (client, interaction) => {
        try {
            const userId = interaction.user.id

            // Get conversation history stats
            const totalHistory = await client.db.conversationHistory.findMany({
                where: { userId: BigInt(userId) },
                select: { id: true, timestamp: true, isAiResponse: true, contextType: true }
            })

            const userMessages = totalHistory.filter(msg => !msg.isAiResponse).length
            const aiResponses = totalHistory.filter(msg => msg.isAiResponse).length
            const channelContext = totalHistory.filter(msg => msg.contextType === 'channel_context').length

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
                .setTitle('🧠 AI Context Information')
                .setDescription("Here's how much conversation history I can remember from our interactions:")
                .setColor(client.colors.primary)
                .addFields(
                    {
                        name: '📚 Total Conversation History',
                        value: [
                            `• Your messages to me: **${userMessages}**`,
                            `• My responses to you: **${aiResponses}**`,
                            `• Channel context messages: **${channelContext}**`,
                            `• Total conversation entries: **${totalHistory.length}**`
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
                        name: '� Context Analysis',
                        value: [
                            `• Conversation summary: ${hasSummary ? '✅ Generated' : '❌ Not yet available'}`,
                            `• Our conversation started: ${recentDate ? `<t:${Math.floor(recentDate.getTime() / 1000)}:R>` : 'No conversation history'}`,
                            `• Context logging: ${totalHistory.length > 0 ? '✅ Active' : '⚠️ Limited'}`
                        ].join('\n'),
                        inline: false
                    }
                )
                .setFooter({
                    text: 'This conversation memory helps me provide more personalized support • Use /preferences to manage context logging',
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
