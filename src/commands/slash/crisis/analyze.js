import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import { handleCrisis } from '../../../services/tools/crisisTool.js'

export default {
    structure: {
        name: 'analyze',
        category: 'Crisis',
        description: 'Analyze a message for crisis indicators and provide support.',
        handlers: {
            cooldown: 30000,
            requiredPerms: ['ManageMessages'],
            requiredRoles: []
        },
        options: [
            {
                name: 'user',
                description: 'The user who sent the message',
                required: true,
                type: cmdTypes.USER
            },
            {
                name: 'message_id',
                description: 'ID of the message to analyze (fetches content automatically)',
                required: true,
                type: cmdTypes.STRING
            }
        ]
    },
    run: async (client, interaction) => {
        // Only use message_id
        const messageId = interaction.options.getString('message_id')
        const user = interaction.options.getUser('user')
        const guildId = interaction.guildId

        await interaction.deferReply()

        if (!messageId) {
            return interaction.editReply({
                content: '❌ You must provide a message ID to analyze.',
                ephemeral: true
            })
        }

        // Fetch the message from the current channel
        let message
        try {
            const channel = interaction.channel
            const fetchedMsg = await channel.messages.fetch(messageId)
            if (fetchedMsg) {
                message = fetchedMsg.content
            } else {
                return interaction.editReply({
                    content: '❌ Could not find a message with that ID in this channel.',
                    ephemeral: true
                })
            }
        } catch (err) {
            return interaction.editReply({
                content:
                    '❌ Failed to fetch the message. Make sure the ID is correct and the message is in this channel.',
                ephemeral: true
            })
        }

        console.log(message)

        try {
            const result = await handleCrisis(user.id, guildId, message, client, client.db)

            const embed = {
                title: '🔍 Crisis Analysis Results',
                description: `Analysis for **${user.username}**`,
                color:
                    result.analysis.crisisLevel === 'critical'
                        ? 0xff0000
                        : result.analysis.crisisLevel === 'high'
                          ? 0xffa500
                          : 0x0099ff,
                fields: [
                    {
                        name: 'Severity Level',
                        value: result.analysis.crisisLevel.toUpperCase(),
                        inline: true
                    },
                    {
                        name: 'Support Level',
                        value: result.analysis.supportLevel.toUpperCase(),
                        inline: true
                    },
                    {
                        name: 'Requires Immediate Action',
                        value: result.actions.requiresImmediate ? '⚠️ YES' : '✅ No',
                        inline: true
                    },
                    {
                        name: 'Actions Taken',
                        value: [
                            `📝 Logged: ${result.actions.logged ? '✅' : '❌'}`,
                            `🚨 Mod Alert: ${result.actions.modAlertSent ? '✅' : '❌'}`,
                            `💬 DM Sent: ${result.actions.dmSent ? '✅' : '❌'}`
                        ].join('\n'),
                        inline: false
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Crisis Management System'
                }
            }

            if (result.analysis.concernAreas && result.analysis.concernAreas.length > 0) {
                const concerns = result.analysis.concernAreas.map(area => `${area.area} (${area.level})`).join(', ')
                embed.fields.push({
                    name: 'Areas of Concern',
                    value: concerns,
                    inline: false
                })
            }

            if (result.stats.recentEvents > 0) {
                embed.fields.push({
                    name: 'User Crisis History',
                    value: `${result.stats.recentEvents} events in last 30 days\nTrend: ${result.stats.trend}`,
                    inline: true
                })
            }

            return interaction.editReply({ embeds: [embed] })
        } catch (error) {
            console.error('Error analyzing crisis:', error)
            return interaction.editReply({
                content: '❌ Failed to analyze the message for crisis indicators.',
                ephemeral: true
            })
        }
    }
}
