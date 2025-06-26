import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import { getCrisisStats } from '../../../services/tools/crisisTool.js'

export default {
    structure: {
        name: 'stats',
        category: 'Crisis',
        description: 'View crisis statistics for a user.',
        handlers: {
            cooldown: 15000,
            requiredPerms: ['ManageMessages'],
            requiredRoles: []
        },
        options: [
            {
                name: 'user',
                description: 'The user to check crisis statistics for',
                required: true,
                type: cmdTypes.USER
            }
        ]
    },
    run: async (client, interaction) => {
        const user = interaction.options.getUser('user')

        await interaction.deferReply({ ephemeral: true })

        try {
            const stats = await getCrisisStats(user.id, client.db)

            const embed = {
                title: '📊 Crisis Statistics',
                description: `Statistics for **${user.username}**`,
                color: stats.recentEvents > 5 ? 0xff0000 : stats.recentEvents > 2 ? 0xffa500 : 0x0099ff,
                fields: [
                    {
                        name: 'Total Crisis Events',
                        value: stats.totalEvents.toString(),
                        inline: true
                    },
                    {
                        name: 'Recent Events (30 days)',
                        value: stats.recentEvents.toString(),
                        inline: true
                    },
                    {
                        name: 'Escalated Events',
                        value: stats.escalatedEvents.toString(),
                        inline: true
                    },
                    {
                        name: 'Recent Escalated',
                        value: stats.recentEscalated.toString(),
                        inline: true
                    },
                    {
                        name: 'Trend',
                        value: stats.trend.charAt(0).toUpperCase() + stats.trend.slice(1),
                        inline: true
                    },
                    {
                        name: 'Last Event',
                        value: stats.lastEvent
                            ? `<t:${Math.floor(new Date(stats.lastEvent).getTime() / 1000)}:R>`
                            : 'Never',
                        inline: true
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Crisis Management System'
                }
            }

            return interaction.editReply({ embeds: [embed] })
        } catch (error) {
            console.error('Error getting crisis stats:', error)
            return interaction.editReply({
                content: '❌ Failed to retrieve crisis statistics.',
                ephemeral: true
            })
        }
    }
}
