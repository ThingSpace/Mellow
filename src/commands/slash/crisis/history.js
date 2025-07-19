import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import { getRecentCrisisEvents, getCrisisStats } from '../../../services/tools/crisisTool.js'
import { PermissionFlagsBits } from 'discord.js'

export default {
    structure: {
        name: 'history',
        category: 'Crisis',
        description: 'View recent crisis events for a user.',
        handlers: {
            cooldown: 15000,
            requiredPerms: [
                PermissionFlagsBits.Administrator,
                PermissionFlagsBits.ManageGuild,
                PermissionFlagsBits.ManageMessages
            ],
            requiredRoles: []
        },
        options: [
            {
                name: 'view',
                description: 'View recent crisis events for a user',
                type: cmdTypes.SUB_COMMAND,
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
                    },
                    {
                        name: 'private',
                        description: 'Keep the response private',
                        type: cmdTypes.BOOLEAN,
                        required: false
                    }
                ]
            },
            {
                name: 'stats',
                description: 'View crisis statistics for a user',
                type: cmdTypes.SUB_COMMAND,
                options: [
                    {
                        name: 'user',
                        description: 'The user to check crisis statistics for',
                        type: cmdTypes.USER,
                        required: true
                    },
                    {
                        name: 'private',
                        description: 'Keep the response private',
                        type: cmdTypes.BOOLEAN,
                        required: false
                    }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const user = interaction.options.getUser('user')
        const limit = interaction.options.getInteger('limit') || 5
        const isPrivate = interaction.options.getBoolean('private') ?? true

        switch (interaction.options.getSubcommand()) {
            case 'view': {
                try {
                    const events = await getRecentCrisisEvents(user.id, client.db, limit)

                    if (events.length === 0)
                        return interaction.reply({
                            content: `No recent crisis events found for ${user.username}.`,
                            ephemeral: isPrivate
                        })

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

                        // Handle details properly whether it's already decoded or still a string
                        let details = {}
                        if (event.details) {
                            if (typeof event.details === 'string') {
                                try {
                                    details = JSON.parse(event.details)
                                } catch (e) {
                                    details = { message: event.details }
                                }
                            } else if (typeof event.details === 'object') {
                                details = event.details
                            }
                        }

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

                    return interaction.reply({
                        embeds: [embed],
                        ephemeral: isPrivate
                    })
                } catch (error) {
                    console.error('Error fetching crisis events:', error)
                    return interaction.reply({
                        content: '❌ Failed to retrieve crisis history. Please try again later.',
                        ephemeral: isPrivate
                    })
                }
            }

            case 'stats': {
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

                    return interaction.reply({
                        embeds: [embed],
                        ephemeral: isPrivate
                    })
                } catch (error) {
                    console.error('Error fetching crisis stats:', error)
                    return interaction.reply({
                        content: '❌ Failed to retrieve crisis statistics. Please try again later.',
                        ephemeral: isPrivate
                    })
                }
            }

            case 'default': {
                return interaction.reply({
                    content: 'Invalid subcommand. Use `/crisis history view` or `/crisis history stats`.',
                    ephemeral: true
                })
            }
        }
    }
}
