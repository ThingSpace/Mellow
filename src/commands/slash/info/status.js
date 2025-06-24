import { aiService } from '../../../services/ai.service.js'

export default {
    structure: {
        name: 'status',
        category: 'Info',
        description: "Get Mellow's current performance metrics and system status",
        handlers: {
            cooldown: 15000,
            requiredRoles: []
        }
    },

    run: async (client, interaction) => {
        await interaction.deferReply()

        try {
            const report = aiService.performance.formatMetricsReport()
            await interaction.editReply({ content: report })
        } catch (error) {
            console.error('Error getting performance metrics:', error)
            await interaction.editReply({
                embeds: [
                    new client.Gateway.EmbedBuilder()
                        .setTitle('Error')
                        .setDescription('Sorry, I encountered an error while getting my status report. 😔')
                        .setColor(client.colors.error)
                        .setThumbnail(client.logo)
                        .setTimestamp()
                        .setFooter({
                            text: client.footer,
                            iconURL: client.logo
                        })
                ]
            })
        }
    }
}
