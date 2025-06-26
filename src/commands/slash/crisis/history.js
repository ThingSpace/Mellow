import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import { getRecentCrisisEvents } from '../../../services/tools/crisisTool.js'

export default {
    structure: {
        name: 'history',
        category: 'Crisis',
        description: 'View recent crisis events for a user.',
        handlers: {
            cooldown: 15000,
            requiredPerms: ['ManageMessages'],
            requiredRoles: []
        },
        options: [
            {
                name: 'user',
                description: 'The user to check crisis history for',
                required: true,
                type: cmdTypes.USER
            },
            {
                name: 'limit',
                description: 'Number of events to show (max 10)',
                required: false,
                type: cmdTypes.INTEGER,
                min_value: 1,
                max_value: 10
            }
        ]
    },
    run: async (client, interaction) => {
        const user = interaction.options.getUser('user')
        const limit = interaction.options.getInteger('limit') || 5

        await interaction.deferReply({ ephemeral: true })

        try {
            const events = await getRecentCrisisEvents(user.id, client.db, limit)

            if (events.length === 0) {
                return interaction.editReply({
                    content: `✅ **${user.username}** has no recent crisis events.`,
                    ephemeral: true
                })
            }

            const embed = {
                title: '📋 Recent Crisis Events',
                description: `History for **${user.username}**`,
                color: 0x0099ff,
                fields: [],
                timestamp: new Date().toISOString(),
                footer: {
                    text: `Showing ${events.length} most recent events`
                }
            }

            for (let i = 0; i < Math.min(events.length, 10); i++) {
                const event = events[i]
                const details = event.details ? JSON.parse(event.details) : {}

                embed.fields.push({
                    name: `Event ${i + 1} - ${event.escalated ? '🚨 ESCALATED' : '📝 Normal'}`,
                    value: [
                        `**Severity:** ${details.severity || 'Unknown'}`,
                        `**Support Level:** ${details.supportLevel || 'Unknown'}`,
                        `**Time:** <t:${Math.floor(new Date(event.detectedAt).getTime() / 1000)}:R>`,
                        details.messagePreview ? `**Preview:** ${details.messagePreview}` : ''
                    ]
                        .filter(Boolean)
                        .join('\n'),
                    inline: false
                })
            }

            return interaction.editReply({ embeds: [embed] })
        } catch (error) {
            console.error('Error getting crisis history:', error)
            return interaction.editReply({
                content: '❌ Failed to retrieve crisis history.',
                ephemeral: true
            })
        }
    }
}
