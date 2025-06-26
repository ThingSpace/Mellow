import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import { getCrisisStats, getRecentCrisisEvents } from '../../../services/tools/crisisTool.js'

export default {
    structure: {
        name: 'resources',
        category: 'Crisis',
        description: 'Get AI-powered crisis support resources and recommendations.',
        handlers: {
            cooldown: 30000,
            requiredPerms: [],
            requiredRoles: []
        },
        options: [
            {
                name: 'situation',
                description: 'Describe your current situation or what you need help with',
                required: true,
                type: cmdTypes.STRING
            },
            {
                name: 'private',
                description: 'Should this be private? (default: yes)',
                required: false,
                type: cmdTypes.BOOLEAN
            }
        ]
    },
    run: async (client, interaction) => {
        const situation = interaction.options.getString('situation')
        const isPrivate = interaction.options.getBoolean('private') ?? true
        const userId = interaction.user.id

        await interaction.deferReply({ ephemeral: isPrivate })

        try {
            // Get user's crisis history for context
            const stats = await getCrisisStats(userId, client.db)
            const recentEvents = await getRecentCrisisEvents(userId, client.db, 3)

            // Create context for AI
            const context = {
                situation,
                hasRecentCrisis: stats.recentEvents > 0,
                crisisTrend: stats.trend,
                recentEvents: recentEvents.length,
                escalatedEvents: stats.recentEscalated
            }

            // Get AI-powered resources
            const resources = await client.ai.getCrisisResources(context)

            const embed = {
                title: '🆘 Crisis Support Resources',
                description: 'Here are some resources that might help you right now:',
                color: 0x0099ff,
                fields: [],
                timestamp: new Date().toISOString(),
                footer: {
                    text: "Remember: You are not alone, and it's okay to ask for help"
                }
            }

            // Add AI-generated resources
            if (resources.immediate) {
                embed.fields.push({
                    name: '🚨 Immediate Support',
                    value: resources.immediate,
                    inline: false
                })
            }

            if (resources.hotlines) {
                embed.fields.push({
                    name: '📞 Crisis Hotlines',
                    value: resources.hotlines,
                    inline: false
                })
            }

            if (resources.coping) {
                embed.fields.push({
                    name: '🧘 Coping Strategies',
                    value: resources.coping,
                    inline: false
                })
            }

            if (resources.longTerm) {
                embed.fields.push({
                    name: '🌱 Long-term Support',
                    value: resources.longTerm,
                    inline: false
                })
            }

            // Add personalized note if they have recent crisis events
            if (context.hasRecentCrisis) {
                embed.fields.push({
                    name: '💙 Personal Note',
                    value: "I've noticed you've been going through some difficult times recently. Please know that it's completely okay to reach out for help, and there are people who care about you and want to support you.",
                    inline: false
                })
            }

            return interaction.editReply({ embeds: [embed] })
        } catch (error) {
            console.error('Error getting crisis resources:', error)

            // Fallback to basic resources if AI fails
            const fallbackEmbed = {
                title: '🆘 Crisis Support Resources',
                description: 'Here are some resources that might help you right now:',
                color: 0x0099ff,
                fields: [
                    {
                        name: '🚨 Immediate Support',
                        value: '**988** - National Suicide Prevention Lifeline (24/7)\n**Text HOME to 741741** - Crisis Text Line\n**911** - Emergency Services',
                        inline: false
                    },
                    {
                        name: '📞 Additional Hotlines',
                        value: '**1-800-273-8255** - National Suicide Prevention Lifeline\n**1-800-799-7233** - National Domestic Violence Hotline\n**1-800-656-4673** - RAINN Sexual Assault Hotline',
                        inline: false
                    },
                    {
                        name: '🌱 Long-term Support',
                        value: '• Talk to a trusted friend, family member, or mental health professional\n• Consider therapy or counseling\n• Join support groups (online or in-person)\n• Practice self-care and coping strategies',
                        inline: false
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'You are not alone, and your feelings matter'
                }
            }

            return interaction.editReply({ embeds: [fallbackEmbed] })
        }
    }
}
