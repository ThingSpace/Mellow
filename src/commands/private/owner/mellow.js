import { aiService } from '../../../services/ai.service.js'

export default {
    structure: {
        name: 'mellow',
        category: 'Owner',
        description: 'View and manage Mellow AI configuration (Owner only)',
        options: [
            {
                name: 'view',
                description: 'View current Mellow configuration',
                type: 1, // SUB_COMMAND
                options: []
            },
            {
                name: 'toggle',
                description: 'Toggle Mellow AI on/off',
                type: 1, // SUB_COMMAND
                options: []
            },
            {
                name: 'update',
                description: 'Update Mellow configuration',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'model',
                        description: 'AI model to use',
                        type: 3, // STRING
                        required: false,
                        choices: [
                            { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
                            { name: 'GPT-4', value: 'gpt-4' },
                            { name: 'GPT-4 Turbo Preview', value: 'gpt-4-turbo-preview' }
                        ]
                    },
                    {
                        name: 'temperature',
                        description: 'AI temperature (0.0 - 2.0)',
                        type: 4, // INTEGER
                        required: false,
                        min_value: 0,
                        max_value: 20
                    },
                    {
                        name: 'max_tokens',
                        description: 'Maximum tokens per response (1-4000)',
                        type: 4, // INTEGER
                        required: false,
                        min_value: 1,
                        max_value: 4000
                    },
                    {
                        name: 'presence_penalty',
                        description: 'Presence penalty (-2.0 - 2.0)',
                        type: 4, // INTEGER
                        required: false,
                        min_value: -20,
                        max_value: 20
                    },
                    {
                        name: 'frequency_penalty',
                        description: 'Frequency penalty (-2.0 - 2.0)',
                        type: 4, // INTEGER
                        required: false,
                        min_value: -20,
                        max_value: 20
                    }
                ]
            },
            {
                name: 'features',
                description: 'Toggle specific features',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'check_in_tools',
                        description: 'Toggle check-in tools',
                        type: 5, // BOOLEAN
                        required: false
                    },
                    {
                        name: 'coping_tools',
                        description: 'Toggle coping tools',
                        type: 5, // BOOLEAN
                        required: false
                    },
                    {
                        name: 'ghost_tools',
                        description: 'Toggle ghost letter tools',
                        type: 5, // BOOLEAN
                        required: false
                    }
                ]
            },
            {
                name: 'validate',
                description: 'Validate current configuration',
                type: 1, // SUB_COMMAND
                options: []
            },
            {
                name: 'reload',
                description: 'Reload configuration from database',
                type: 1, // SUB_COMMAND
                options: []
            },
            {
                name: 'channels',
                description: 'Configure system channels',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'feedback_channel',
                        description: 'Channel for feedback submissions',
                        type: 7, // CHANNEL
                        required: false
                    },
                    {
                        name: 'report_channel',
                        description: 'Channel for user reports',
                        type: 7, // CHANNEL
                        required: false
                    },
                    {
                        name: 'log_channel',
                        description: 'Main system log channel',
                        type: 7, // CHANNEL
                        required: false
                    }
                ]
            }
        ],
        handlers: {
            cooldown: 5000,
            requiredRoles: []
        }
    },

    run: async (client, interaction) => {
        await interaction.deferReply()

        try {
            const subcommand = interaction.options.getSubcommand()
            const userId = interaction.user.id

            // Check if user is an owner
            const isOwner = await client.db.mellow.isOwner(userId)
            if (!isOwner) {
                return interaction.editReply({
                    embeds: [
                        new client.Gateway.EmbedBuilder()
                            .setTitle('Access Denied')
                            .setDescription('You do not have permission to manage Mellow configuration.')
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

            switch (subcommand) {
                case 'view': {
                    const summary = await aiService.getConfigSummary()
                    const mellowConfig = await client.db.mellow.get()

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle('🤖 Mellow AI Configuration')
                        .setColor(client.colors.primary)
                        .setThumbnail(client.logo)
                        .setTimestamp()
                        .setFooter({
                            text: client.footer,
                            iconURL: client.logo
                        })
                        .addFields([
                            {
                                name: 'Status',
                                value: summary.status,
                                inline: true
                            },
                            {
                                name: 'Model',
                                value: summary.model,
                                inline: true
                            },
                            {
                                name: 'Temperature',
                                value: summary.temperature.toString(),
                                inline: true
                            },
                            {
                                name: 'Max Tokens',
                                value: summary.maxTokens.toString(),
                                inline: true
                            },
                            {
                                name: 'Presence Penalty',
                                value: summary.presencePenalty.toString(),
                                inline: true
                            },
                            {
                                name: 'Frequency Penalty',
                                value: summary.frequencyPenalty.toString(),
                                inline: true
                            },
                            {
                                name: 'Features',
                                value: Object.entries(summary.features)
                                    .map(([feature, status]) => `${feature}: ${status}`)
                                    .join('\n'),
                                inline: false
                            },
                            {
                                name: 'System Channels',
                                value: [
                                    `**Feedback:** ${mellowConfig.feedbackLogs ? `<#${mellowConfig.feedbackLogs}>` : 'Not set'}`,
                                    `**Reports:** ${mellowConfig.reportLogs ? `<#${mellowConfig.reportLogs}>` : 'Not set'}`,
                                    `**Logs:** ${mellowConfig.logId ? `<#${mellowConfig.logId}>` : 'Not set'}`
                                ].join('\n'),
                                inline: false
                            }
                        ])

                    await interaction.editReply({ embeds: [embed] })
                    break
                }

                case 'toggle': {
                    const newConfig = await client.db.mellow.toggle()
                    const status = newConfig.enabled ? '🟢 Enabled' : '🔴 Disabled'

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle('Mellow AI Toggled')
                        .setDescription(`Mellow AI is now **${status}**`)
                        .setColor(newConfig.enabled ? client.colors.success : client.colors.error)
                        .setThumbnail(client.logo)
                        .setTimestamp()
                        .setFooter({
                            text: client.footer,
                            iconURL: client.logo
                        })

                    await interaction.editReply({ embeds: [embed] })
                    break
                }

                case 'update': {
                    const updateData = {}

                    // Collect update data from options
                    const model = interaction.options.getString('model')
                    const temperature = interaction.options.getInteger('temperature')
                    const maxTokens = interaction.options.getInteger('max_tokens')
                    const presencePenalty = interaction.options.getInteger('presence_penalty')
                    const frequencyPenalty = interaction.options.getInteger('frequency_penalty')

                    if (model) updateData.model = model
                    if (temperature !== null) updateData.temperature = temperature / 10 // Convert from integer to float
                    if (maxTokens) updateData.maxTokens = maxTokens
                    if (presencePenalty !== null) updateData.presencePenalty = presencePenalty / 10
                    if (frequencyPenalty !== null) updateData.frequencyPenalty = frequencyPenalty / 10

                    if (Object.keys(updateData).length === 0) {
                        return interaction.editReply({
                            embeds: [
                                new client.Gateway.EmbedBuilder()
                                    .setTitle('No Updates')
                                    .setDescription('No configuration values were provided to update.')
                                    .setColor(client.colors.warning)
                                    .setThumbnail(client.logo)
                                    .setTimestamp()
                                    .setFooter({
                                        text: client.footer,
                                        iconURL: client.logo
                                    })
                            ]
                        })
                    }

                    await aiService.updateConfig(updateData)

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle('Configuration Updated')
                        .setDescription('Mellow AI configuration has been updated successfully!')
                        .setColor(client.colors.success)
                        .setThumbnail(client.logo)
                        .setTimestamp()
                        .setFooter({
                            text: client.footer,
                            iconURL: client.logo
                        })

                    await interaction.editReply({ embeds: [embed] })
                    break
                }

                case 'features': {
                    const updateData = {}

                    const checkInTools = interaction.options.getBoolean('check_in_tools')
                    const copingTools = interaction.options.getBoolean('coping_tools')
                    const ghostTools = interaction.options.getBoolean('ghost_tools')

                    if (checkInTools !== null) updateData.checkInTools = checkInTools
                    if (copingTools !== null) updateData.copingTools = copingTools
                    if (ghostTools !== null) updateData.ghostTools = ghostTools

                    if (Object.keys(updateData).length === 0) {
                        return interaction.editReply({
                            embeds: [
                                new client.Gateway.EmbedBuilder()
                                    .setTitle('No Updates')
                                    .setDescription('No feature toggles were provided.')
                                    .setColor(client.colors.warning)
                                    .setThumbnail(client.logo)
                                    .setTimestamp()
                                    .setFooter({
                                        text: client.footer,
                                        iconURL: client.logo
                                    })
                            ]
                        })
                    }

                    await client.db.mellow.update(updateData)

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle('Features Updated')
                        .setDescription('Mellow AI features have been updated successfully!')
                        .setColor(client.colors.success)
                        .setThumbnail(client.logo)
                        .setTimestamp()
                        .setFooter({
                            text: client.footer,
                            iconURL: client.logo
                        })

                    await interaction.editReply({ embeds: [embed] })
                    break
                }

                case 'validate': {
                    const validation = await aiService.validateConfig()

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle('Configuration Validation')
                        .setColor(validation.isValid ? client.colors.success : client.colors.error)
                        .setThumbnail(client.logo)
                        .setTimestamp()
                        .setFooter({
                            text: client.footer,
                            iconURL: client.logo
                        })

                    if (validation.isValid) {
                        embed.setDescription('✅ Configuration is valid!')
                    } else {
                        embed.setDescription('❌ Configuration issues found:').addFields(
                            validation.issues.map(issue => ({
                                name: 'Issue',
                                value: issue,
                                inline: false
                            }))
                        )
                    }

                    await interaction.editReply({ embeds: [embed] })
                    break
                }

                case 'reload': {
                    await aiService.reloadConfig()

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle('Configuration Reloaded')
                        .setDescription('Mellow AI configuration has been reloaded from the database!')
                        .setColor(client.colors.success)
                        .setThumbnail(client.logo)
                        .setTimestamp()
                        .setFooter({
                            text: client.footer,
                            iconURL: client.logo
                        })

                    await interaction.editReply({ embeds: [embed] })
                    break
                }

                case 'channels': {
                    const feedbackChannel = interaction.options.getChannel('feedback_channel')
                    const reportChannel = interaction.options.getChannel('report_channel')
                    const logChannel = interaction.options.getChannel('log_channel')

                    const updates = {}
                    let changes = []

                    if (feedbackChannel) {
                        updates.feedbackLogs = BigInt(feedbackChannel.id)
                        changes.push(`**Feedback Channel:** <#${feedbackChannel.id}>`)
                    }

                    if (reportChannel) {
                        updates.reportLogs = BigInt(reportChannel.id)
                        changes.push(`**Report Channel:** <#${reportChannel.id}>`)
                    }

                    if (logChannel) {
                        updates.logId = BigInt(logChannel.id)
                        changes.push(`**Log Channel:** <#${logChannel.id}>`)
                    }

                    if (changes.length === 0) {
                        return interaction.editReply({
                            embeds: [
                                new client.Gateway.EmbedBuilder()
                                    .setTitle('No Updates')
                                    .setDescription('No channel settings provided to update.')
                                    .setColor(client.colors.warning)
                                    .setThumbnail(client.logo)
                                    .setTimestamp()
                                    .setFooter({
                                        text: client.footer,
                                        iconURL: client.logo
                                    })
                            ]
                        })
                    }

                    await client.db.mellow.update(updates)

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle('Channel Settings Updated')
                        .setDescription(`System channels have been updated:\n\n${changes.join('\n')}`)
                        .setColor(client.colors.success)
                        .setThumbnail(client.logo)
                        .setTimestamp()
                        .setFooter({
                            text: client.footer,
                            iconURL: client.logo
                        })

                    await interaction.editReply({ embeds: [embed] })
                    break
                }
            }
        } catch (error) {
            console.error('Error in mellow command:', error)
            await interaction.editReply({
                embeds: [
                    new client.Gateway.EmbedBuilder()
                        .setTitle('Error')
                        .setDescription('An error occurred while managing Mellow configuration.')
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
