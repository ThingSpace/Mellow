import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    name: 'context',
    description: 'Check how much conversation history the AI has access to',
    type: cmdTypes.SLASH_COMMAND,
    options: [],
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

            // Get recent context that would be used
            const recentContext = await client.ai.messageHistory.getEnhancedContext(
                userId,
                interaction.channel?.id,
                100,
                20
            )

            // Get conversation summary
            const summary = await client.ai.messageHistory.getConversationSummary(userId, 7)

            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('🧠 AI Context Information')
                .setDescription("Here's what I remember about our conversations:")
                .setColor(client.colors.primary)
                .addFields(
                    {
                        name: '📚 Total Conversation History',
                        value: `• Your messages: ${userMessages}\n• My responses: ${aiResponses}\n• Channel context: ${channelContext}`,
                        inline: true
                    },
                    {
                        name: '🔄 Recent Context (Used in AI)',
                        value: `• Messages in current context: ${recentContext.length}\n• User messages: ${recentContext.filter(m => m.role === 'user').length}\n• AI responses: ${recentContext.filter(m => m.role === 'assistant').length}\n• Channel context: ${recentContext.filter(m => m.role === 'system').length}`,
                        inline: true
                    },
                    {
                        name: '🗓️ Recent Themes',
                        value: summary || 'No specific themes detected in recent conversations',
                        inline: false
                    }
                )
                .setFooter({
                    text: 'This helps me provide better, more personalized support',
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
