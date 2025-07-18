import { PermissionFlagsBits } from 'discord.js'
import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'twittersettings',
        description: 'Manage Twitter/X posting and content (Owner/Admin only)',
        category: 'Admin',
        handlers: {
            requiredRoles: ['OWNER', 'ADMIN'],
            requiredPerms: [PermissionFlagsBits.Administrator],
            cooldown: 30000
        },
        options: [
            {
                name: 'post',
                type: cmdTypes.SUB_COMMAND,
                description: 'Post content to Twitter/X',
                options: [
                    {
                        name: 'type',
                        description: 'Type of content to post',
                        type: cmdTypes.STRING,
                        required: true,
                        choices: [
                            { name: 'Daily Tip', value: 'dailyTip' },
                            { name: 'Weekly Update', value: 'weeklyUpdate' },
                            { name: 'Awareness Post', value: 'awarenessPost' },
                            { name: 'Crisis Resources', value: 'crisisSupport' },
                            { name: 'Custom Content', value: 'custom' }
                        ]
                    },
                    {
                        name: 'content',
                        description: 'Custom content to post (for custom type only)',
                        type: cmdTypes.STRING,
                        required: false,
                        max_length: 240
                    },
                    {
                        name: 'topic',
                        description: 'Specific topic to focus on (for AI-generated content)',
                        type: cmdTypes.STRING,
                        required: false,
                        max_length: 100
                    }
                ]
            },
            {
                name: 'status',
                type: cmdTypes.SUB_COMMAND,
                description: 'Check Twitter service status and statistics',
                options: []
            },
            {
                name: 'schedule',
                type: cmdTypes.SUB_COMMAND,
                description: 'View or manage scheduled posting',
                options: [
                    {
                        name: 'action',
                        description: 'Schedule action to perform',
                        type: cmdTypes.STRING,
                        required: true,
                        choices: [
                            { name: 'View Current', value: 'view' },
                            { name: 'Start Scheduling', value: 'start' },
                            { name: 'Stop Scheduling', value: 'stop' }
                        ]
                    }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand()
        const userId = interaction.user.id

        // Check if user has required permissions
        const userRoles = await client.db.users.getUserRoles(userId)
        const isAuthorized = userRoles?.includes('OWNER') || userRoles?.includes('ADMIN')

        if (!isAuthorized) {
            return interaction.reply({
                content: '🔒 **Access Denied**\n\nThis command requires OWNER or ADMIN permissions.',
                ephemeral: true
            })
        }

        try {
            switch (subcommand) {
                case 'post': {
                    const type = interaction.options.getString('type')
                    const customContent = interaction.options.getString('content')
                    const topic = interaction.options.getString('topic')

                    // Check if Twitter service is available
                    if (!client.twitterService || !client.twitterService.initialized) {
                        return interaction.reply({
                            content:
                                '❌ **Twitter Service Unavailable**\n\nThe Twitter service is not initialized or configured. Please check the configuration and try again.',
                            ephemeral: true
                        })
                    }

                    await interaction.deferReply({ ephemeral: true })

                    let result

                    if (type === 'custom' && customContent) {
                        // Post custom content
                        result = await client.twitterService.postTweet(customContent, {
                            type: 'manual',
                            source: 'discord_command',
                            userId: userId
                        })
                    } else if (type === 'custom' && !customContent) {
                        return interaction.editReply({
                            content:
                                '❌ **Missing Content**\n\nCustom content is required when using the "custom" type.'
                        })
                    } else {
                        // Post AI-generated content
                        result = await client.twitterService.postAIContent(type, {
                            topic: topic,
                            source: 'discord_command',
                            userId: userId
                        })
                    }

                    if (result.success) {
                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('✅ Tweet Posted Successfully')
                            .setColor(client.colors.success)
                            .setDescription(`Your ${type} content has been posted to Twitter/X!`)
                            .addFields(
                                {
                                    name: '📝 Content',
                                    value: result.content || 'Content posted successfully',
                                    inline: false
                                },
                                {
                                    name: '📊 Post Details',
                                    value: [
                                        `**Type:** ${type}`,
                                        `**Length:** ${(result.content || '').length} characters`,
                                        `**Posted by:** ${interaction.user.username}`,
                                        `**Tweet ID:** \`${result.tweetId || 'Unknown'}\``
                                    ].join('\n'),
                                    inline: true
                                }
                            )
                            .setFooter({ text: client.footer, iconURL: client.logo })
                            .setTimestamp()

                        if (result.tweetUrl) {
                            embed.addFields({
                                name: '🔗 View Tweet',
                                value: `[Open on Twitter/X](${result.tweetUrl})`,
                                inline: true
                            })
                        }

                        return interaction.editReply({ embeds: [embed] })
                    } else {
                        return interaction.editReply({
                            content: `❌ **Failed to Post Tweet**\n\n**Error:** ${result.error}\n\nPlease check the Twitter service configuration and try again.`
                        })
                    }
                }

                case 'status': {
                    await interaction.deferReply({ ephemeral: true })

                    // Get Twitter service status
                    const isInitialized = client.twitterService?.initialized || false
                    const config = client.twitterService?.config

                    let connectionStatus = '❌ Not Connected'
                    let username = 'Unknown'
                    let diagnostics = []

                    if (isInitialized && client.twitterService) {
                        try {
                            const testResult = await client.twitterService.testConnection()
                            if (testResult.success) {
                                connectionStatus = '✅ Connected'
                                username = testResult.username
                                diagnostics.push('✅ API connection successful')
                            } else {
                                connectionStatus = `❌ Connection Failed: ${testResult.error}`

                                // Add specific diagnostics for common errors
                                if (testResult.statusCode === 403) {
                                    diagnostics.push('🔐 **403 Forbidden Error Detected**')
                                    diagnostics.push('• Check API credentials in environment variables')
                                    diagnostics.push('• Verify Twitter Developer Portal app permissions')
                                    diagnostics.push('• Ensure API v2 write access is enabled')
                                    diagnostics.push('• Check if account is suspended or restricted')
                                } else if (testResult.statusCode === 401) {
                                    diagnostics.push('🔑 **401 Authentication Error**')
                                    diagnostics.push('• Verify API key and secret are correct')
                                    diagnostics.push('• Check access tokens are valid')
                                    diagnostics.push('• Ensure all credentials are properly set')
                                } else if (testResult.statusCode === 429) {
                                    diagnostics.push('⏰ **429 Rate Limit Exceeded**')
                                    diagnostics.push('• Wait before retrying connection')
                                    diagnostics.push('• Check if too many requests were made')
                                } else {
                                    diagnostics.push(`❌ Error: ${testResult.error}`)
                                }
                            }
                        } catch (error) {
                            connectionStatus = `❌ Error: ${error.message}`
                            diagnostics.push(`❌ Connection test failed: ${error.message}`)
                        }
                    } else {
                        diagnostics.push('❌ Service not initialized')
                        diagnostics.push('• Check Twitter API credentials')
                        diagnostics.push('• Verify TWITTER_POSTING_ENABLED=true')
                        diagnostics.push('• Restart bot after configuration changes')
                    }

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle('🐦 Twitter Service Status')
                        .setColor(isInitialized ? client.colors.success : client.colors.error)
                        .addFields(
                            {
                                name: '🔌 Connection Status',
                                value: [
                                    `**Status:** ${connectionStatus}`,
                                    `**Username:** @${username}`,
                                    `**Service:** ${isInitialized ? 'Initialized' : 'Not Initialized'}`
                                ].join('\n'),
                                inline: true
                            },
                            {
                                name: '⚙️ Configuration',
                                value: config
                                    ? [
                                          `**Posting Enabled:** ${config.posting.enabled ? '✅' : '❌'}`,
                                          `**Daily Limit:** ${config.posting.dailyLimit}`,
                                          `**Cooldown:** ${config.posting.postCooldown} min`,
                                          `**Include Hashtags:** ${config.posting.includeHashtags ? '✅' : '❌'}`
                                      ].join('\n')
                                    : 'Not Available',
                                inline: true
                            },
                            {
                                name: '📅 Content Types',
                                value: config
                                    ? [
                                          `**Daily Tips:** ${config.contentTypes.dailyTips.enabled ? '✅' : '❌'}`,
                                          `**Weekly Updates:** ${config.contentTypes.weeklyUpdates.enabled ? '✅' : '❌'}`,
                                          `**Awareness Posts:** ${config.contentTypes.awarenessPost.enabled ? '✅' : '❌'}`,
                                          `**Bot Updates:** ${config.contentTypes.botUpdates.enabled ? '✅' : '❌'}`
                                      ].join('\n')
                                    : 'Not Available',
                                inline: false
                            }
                        )

                    // Add diagnostics if there are any issues
                    if (diagnostics.length > 0) {
                        embed.addFields({
                            name: '🔍 Diagnostics',
                            value: diagnostics.join('\n'),
                            inline: false
                        })
                    }

                    embed.setFooter({ text: client.footer, iconURL: client.logo }).setTimestamp()

                    // Add daily statistics if available
                    if (client.twitterService) {
                        const dailyCount = client.twitterService.dailyPostCount || 0
                        const lastReset = client.twitterService.lastResetDate || 'Unknown'

                        embed.addFields({
                            name: "📊 Today's Statistics",
                            value: [
                                `**Posts Today:** ${dailyCount}/${config?.posting.dailyLimit || 'N/A'}`,
                                `**Last Reset:** ${lastReset}`
                            ].join('\n'),
                            inline: true
                        })
                    }

                    return interaction.editReply({ embeds: [embed] })
                }

                case 'schedule': {
                    const action = interaction.options.getString('action')

                    if (!client.twitterService || !client.twitterService.initialized) {
                        return interaction.reply({
                            content:
                                '❌ **Twitter Service Unavailable**\n\nThe Twitter service is not initialized or configured.',
                            ephemeral: true
                        })
                    }

                    await interaction.deferReply({ ephemeral: true })

                    switch (action) {
                        case 'view':
                            const scheduledJobs = client.twitterService.scheduledIntervals.size
                            const config = client.twitterService.config

                            const embed = new client.Gateway.EmbedBuilder()
                                .setTitle('📅 Scheduled Twitter Posting')
                                .setColor(client.colors.primary)
                                .addFields(
                                    {
                                        name: '🔄 Active Schedules',
                                        value: `**Jobs Running:** ${scheduledJobs}`,
                                        inline: true
                                    },
                                    {
                                        name: '⏰ Daily Tips',
                                        value: config.contentTypes.dailyTips.enabled
                                            ? `✅ Enabled at ${config.contentTypes.dailyTips.schedule} UTC`
                                            : '❌ Disabled',
                                        inline: false
                                    },
                                    {
                                        name: '📊 Weekly Updates',
                                        value: config.contentTypes.weeklyUpdates.enabled
                                            ? `✅ Enabled ${config.contentTypes.weeklyUpdates.schedule} UTC`
                                            : '❌ Disabled',
                                        inline: false
                                    }
                                )
                                .setFooter({ text: client.footer, iconURL: client.logo })
                                .setTimestamp()

                            return interaction.editReply({ embeds: [embed] })

                        case 'start':
                            try {
                                client.twitterService.startScheduledPosting()
                                return interaction.editReply({
                                    content:
                                        '✅ **Scheduled Posting Started**\n\nAutomatic posting has been enabled according to your configuration.'
                                })
                            } catch (error) {
                                return interaction.editReply({
                                    content: `❌ **Failed to Start Scheduling**\n\n**Error:** ${error.message}`
                                })
                            }

                        case 'stop':
                            try {
                                client.twitterService.stopScheduledPosting()
                                return interaction.editReply({
                                    content:
                                        '⏹️ **Scheduled Posting Stopped**\n\nAll automatic posting has been disabled.'
                                })
                            } catch (error) {
                                return interaction.editReply({
                                    content: `❌ **Failed to Stop Scheduling**\n\n**Error:** ${error.message}`
                                })
                            }

                        default:
                            return interaction.editReply({
                                content: '❌ Unknown schedule action.'
                            })
                    }
                }

                default:
                    return interaction.reply({
                        content: '❌ Unknown subcommand.',
                        ephemeral: true
                    })
            }
        } catch (error) {
            console.error('Twitter command error:', error)

            const errorMessage = `❌ **Command Failed**\n\nError: \`${error.message}\`\n\nThis error has been logged for investigation.`

            if (interaction.deferred) {
                return interaction.editReply({ content: errorMessage })
            } else {
                return interaction.reply({ content: errorMessage, ephemeral: true })
            }
        }
    }
}
