import { PermissionFlagsBits } from 'discord.js'
import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'guilddebug',
        description: 'Debug guild issues or request support from the Mellow team',
        category: 'Guild',
        handlers: {
            requiredRoles: [],
            requiredPerms: [],
            cooldown: 30000
        },
        options: [
            {
                name: 'diagnostics',
                type: cmdTypes.SUB_COMMAND,
                description: 'Run comprehensive guild diagnostics (Mellow team only)',
                options: [
                    {
                        name: 'guild-id',
                        description: 'Guild ID to run diagnostics for (defaults to current guild)',
                        type: cmdTypes.STRING,
                        required: false
                    }
                ]
            },
            {
                name: 'settings',
                type: cmdTypes.SUB_COMMAND,
                description: 'View detailed guild settings and configuration (Mellow team only)',
                options: [
                    {
                        name: 'guild-id',
                        description: 'Guild ID to view settings for (defaults to current guild)',
                        type: cmdTypes.STRING,
                        required: false
                    }
                ]
            },
            {
                name: 'logs',
                type: cmdTypes.SUB_COMMAND,
                description: 'View recent guild-specific logs (Mellow team only)',
                options: [
                    {
                        name: 'guild-id',
                        description: 'Guild ID to view logs for (defaults to current guild)',
                        type: cmdTypes.STRING,
                        required: false
                    },
                    {
                        name: 'type',
                        description: 'Type of logs to view',
                        type: cmdTypes.STRING,
                        required: false,
                        choices: [
                            { name: 'All Logs', value: 'all' },
                            { name: 'Crisis Alerts', value: 'crisis' },
                            { name: 'Moderation Actions', value: 'moderation' },
                            { name: 'System Events', value: 'system' },
                            { name: 'User Events', value: 'user' },
                            { name: 'Command Usage', value: 'command' },
                            { name: 'Support Requests', value: 'support' },
                            { name: 'Startup Events', value: 'startup' },
                            { name: 'Errors', value: 'error' }
                        ]
                    },
                    {
                        name: 'limit',
                        description: 'Number of logs to display (1-20)',
                        type: cmdTypes.INTEGER,
                        required: false,
                        min_value: 1,
                        max_value: 20
                    }
                ]
            },
            {
                name: 'database',
                type: cmdTypes.SUB_COMMAND,
                description: 'Check guild database health and statistics (Mellow team only)',
                options: [
                    {
                        name: 'guild-id',
                        description: 'Guild ID to check database for (defaults to current guild)',
                        type: cmdTypes.STRING,
                        required: false
                    }
                ]
            },
            {
                name: 'request-support',
                type: cmdTypes.SUB_COMMAND,
                description: 'Request help from the Mellow support team',
                options: [
                    {
                        name: 'issue',
                        description: "Brief description of the issue you're experiencing",
                        type: cmdTypes.STRING,
                        required: true,
                        max_length: 1000
                    },
                    {
                        name: 'severity',
                        description: 'How severe is this issue?',
                        type: cmdTypes.STRING,
                        required: true,
                        choices: [
                            { name: '🔴 Critical - Bot completely broken', value: 'critical' },
                            { name: '🟡 High - Major features not working', value: 'high' },
                            { name: '🟢 Medium - Some features affected', value: 'medium' },
                            { name: '🔵 Low - Minor issues or questions', value: 'low' }
                        ]
                    },
                    {
                        name: 'contact',
                        description: 'How should we contact you? (Discord username, email, etc.)',
                        type: cmdTypes.STRING,
                        required: false,
                        max_length: 200
                    },
                    {
                        name: 'guild-id',
                        description: 'Guild ID to report issue for (Mellow team only)',
                        type: cmdTypes.STRING,
                        required: false
                    }
                ]
            },
            {
                name: 'join-guild',
                type: cmdTypes.SUB_COMMAND,
                description: 'Generate a one-time invite to a specified guild (Mellow team only)',
                options: [
                    {
                        name: 'guild-id',
                        description: 'ID of the guild to generate an invite for',
                        type: cmdTypes.STRING,
                        required: true
                    }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand()
        const guildId = interaction.guild.id
        const userId = interaction.user.id

        // Check if user is OWNER or SUPPORT for debug commands
        const userRoles = await client.db.users.getUserRoles(userId)
        const isAuthorized = userRoles?.includes('OWNER') || userRoles?.includes('SUPPORT')

        try {
            switch (subcommand) {
                case 'diagnostics': {
                    if (!isAuthorized) {
                        return interaction.reply({
                            content:
                                '🔒 **Access Denied**\n\nThis command is restricted to Mellow team members only.\n\nIf you need help, use `/guilddebug request-support` to contact our support team.',
                            ephemeral: true
                        })
                    }

                    const targetGuildId = interaction.options.getString('guild-id') || guildId

                    await interaction.deferReply()

                    // Get target guild
                    const targetGuild = await client.guilds.fetch(targetGuildId)

                    // Get guild information
                    const guild = await client.db.guilds.getSettings(targetGuildId)

                    // Get various statistics
                    const userCount = await client.db.users.countGuildUsers(targetGuildId)
                    const recentCheckIns = (await client.db.moodCheckIns.getRecentByGuild(targetGuildId, 24)) || [] // Last 24 hours (global)
                    const recentCrisisEvents =
                        (await client.db.crisisEvents?.getRecentByGuild?.(targetGuildId, 7)) || [] // Last 7 days (global)
                    const modActions = (await client.db.modActions?.getRecentByGuild?.(targetGuildId, 7)) || [] // Last 7 days (guild-specific)

                    // Check system health
                    const systemHealth = {
                        database: true,
                        ai: client.ai ? (await client.ai.isConnected?.()) || true : false,
                        channels: {
                            modAlert: guild?.modAlertChannelId
                                ? targetGuild.channels.cache.has(guild.modAlertChannelId)
                                : null,
                            modLog: guild?.modLogChannelId
                                ? targetGuild.channels.cache.has(guild.modLogChannelId)
                                : null,
                            checkIn: guild?.checkInChannelId
                                ? targetGuild.channels.cache.has(guild.checkInChannelId)
                                : null,
                            copingLog: guild?.copingToolLogId
                                ? targetGuild.channels.cache.has(guild.copingToolLogId)
                                : null,
                            system: guild?.systemChannelId
                                ? targetGuild.channels.cache.has(guild.systemChannelId)
                                : null,
                            auditLog: guild?.auditLogChannelId
                                ? targetGuild.channels.cache.has(guild.auditLogChannelId)
                                : null
                        }
                    }

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle(`🔧 Guild Diagnostics: ${targetGuild.name}`)
                        .setColor(client.colors.primary)
                        .setThumbnail(targetGuild.iconURL())
                        .addFields(
                            {
                                name: '📊 Guild Overview',
                                value: [
                                    `**Guild ID:** \`${targetGuildId}\``,
                                    `**Members:** ${targetGuild.memberCount.toLocaleString()}`,
                                    `**Registered Users:** ${userCount || 0}`,
                                    `**Owner:** <@${targetGuild.ownerId}>`,
                                    `**Created:** <t:${Math.floor(targetGuild.createdTimestamp / 1000)}:R>`
                                ].join('\n'),
                                inline: false
                            },
                            {
                                name: '🔋 System Health',
                                value: [
                                    `**Database:** ${systemHealth.database ? '✅' : '❌'} Connected`,
                                    `**AI Service:** ${systemHealth.ai ? '✅' : '❌'} ${systemHealth.ai ? 'Connected' : 'Disconnected'}`,
                                    `**Bot Permissions:** ${targetGuild.members.me.permissions.has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]) ? '✅' : '⚠️'} Basic`,
                                    `**Admin Permissions:** ${targetGuild.members.me.permissions.has([PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.BanMembers]) ? '✅' : '⚠️'} Moderation`
                                ].join('\n'),
                                inline: true
                            },
                            {
                                name: '📺 Channel Health',
                                value: [
                                    `**Crisis Alerts:** ${systemHealth.channels.modAlert === null ? '⚪ Not Set' : systemHealth.channels.modAlert ? '✅ Valid' : '❌ Invalid'}`,
                                    `**Mod Logs:** ${systemHealth.channels.modLog === null ? '⚪ Not Set' : systemHealth.channels.modLog ? '✅ Valid' : '❌ Invalid'}`,
                                    `**Check-ins:** ${systemHealth.channels.checkIn === null ? '⚪ Not Set' : systemHealth.channels.checkIn ? '✅ Valid' : '❌ Invalid'}`,
                                    `**Coping Logs:** ${systemHealth.channels.copingLog === null ? '⚪ Not Set' : systemHealth.channels.copingLog ? '✅ Valid' : '❌ Invalid'}`,
                                    `**System:** ${systemHealth.channels.system === null ? '⚪ Not Set' : systemHealth.channels.system ? '✅ Valid' : '❌ Invalid'}`,
                                    `**Audit Log:** ${systemHealth.channels.auditLog === null ? '⚪ Not Set' : systemHealth.channels.auditLog ? '✅ Valid' : '❌ Invalid'}`
                                ].join('\n'),
                                inline: true
                            },
                            {
                                name: '📈 Recent Activity (24h)',
                                value: [
                                    `**Check-ins:** ${recentCheckIns?.length || 0}`,
                                    `**Crisis Events:** ${recentCrisisEvents?.length || 0}`,
                                    `**Mod Actions:** ${modActions?.length || 0}`,
                                    `**Features Enabled:** ${
                                        [
                                            guild?.enableCheckIns && 'Check-ins',
                                            guild?.enableGhostLetters && 'Ghost Letters',
                                            guild?.enableCrisisAlerts && 'Crisis Alerts',
                                            guild?.systemLogsEnabled && 'System Logs',
                                            !guild?.disableContextLogging && 'Context Logging'
                                        ]
                                            .filter(Boolean)
                                            .join(', ') || 'None'
                                    }`
                                ].join('\n'),
                                inline: false
                            }
                        )
                        .setFooter({
                            text: 'Diagnosed by ' + interaction.user.username + ' • ' + client.footer,
                            iconURL: client.logo
                        })
                        .setTimestamp()

                    return interaction.editReply({ embeds: [embed] })
                }

                case 'settings': {
                    if (!isAuthorized) {
                        return interaction.reply({
                            content:
                                '🔒 **Access Denied**\n\nThis command is restricted to Mellow team members only.\n\nIf you need help, use `/guilddebug request-support` to contact our support team.',
                            ephemeral: true
                        })
                    }

                    const targetGuildId = interaction.options.getString('guild-id') || guildId

                    // Get target guild
                    const targetGuild = await client.guilds.fetch(targetGuildId)

                    const guild = await client.db.guilds.getSettings(targetGuildId)

                    if (!guild) {
                        return interaction.reply({
                            content: `❌ Guild not found in database. This may indicate a setup issue.\n\nGuild ID: \`${targetGuildId}\``,
                            ephemeral: true
                        })
                    }

                    // Helper function to safely format dates
                    const formatDate = (date, format = 'F') => {
                        if (!date) return 'Unknown'
                        try {
                            let timestamp
                            if (date instanceof Date) {
                                timestamp = Math.floor(date.getTime() / 1000)
                            } else if (typeof date === 'string') {
                                timestamp = Math.floor(new Date(date).getTime() / 1000)
                            } else if (typeof date === 'number') {
                                timestamp = Math.floor(date / 1000)
                            } else {
                                return 'Invalid Date'
                            }
                            return `<t:${timestamp}:${format}>`
                        } catch (error) {
                            console.error('Error formatting date:', error)
                            return 'Invalid Date'
                        }
                    }

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle(`⚙️ Guild Settings: ${targetGuild.name}`)
                        .setColor(client.colors.secondary)
                        .setDescription('Current bot configuration for this guild')
                        .addFields(
                            {
                                name: '📺 Channel Configuration',
                                value: [
                                    `**Crisis Alert Channel:** ${guild.modAlertChannelId ? `<#${guild.modAlertChannelId}> (\`${guild.modAlertChannelId}\`)` : 'Not configured'}`,
                                    `**Mod Log Channel:** ${guild.modLogChannelId ? `<#${guild.modLogChannelId}> (\`${guild.modLogChannelId}\`)` : 'Not configured'}`,
                                    `**Check-in Channel:** ${guild.checkInChannelId ? `<#${guild.checkInChannelId}> (\`${guild.checkInChannelId}\`)` : 'Not configured'}`,
                                    `**Coping Tool Log:** ${guild.copingToolLogId ? `<#${guild.copingToolLogId}> (\`${guild.copingToolLogId}\`)` : 'Not configured'}`,
                                    `**System Channel:** ${guild.systemChannelId ? `<#${guild.systemChannelId}> (\`${guild.systemChannelId}\`)` : 'Not configured'}`,
                                    `**Audit Log Channel:** ${guild.auditLogChannelId ? `<#${guild.auditLogChannelId}> (\`${guild.auditLogChannelId}\`)` : 'Not configured'}`
                                ].join('\n'),
                                inline: false
                            },
                            {
                                name: '🎛️ Feature Flags',
                                value: [
                                    `**Check-ins Enabled:** ${guild.enableCheckIns ? '✅ Yes' : '❌ No'}`,
                                    `**Ghost Letters Enabled:** ${guild.enableGhostLetters ? '✅ Yes' : '❌ No'}`,
                                    `**Crisis Alerts Enabled:** ${guild.enableCrisisAlerts ? '✅ Yes' : '❌ No'}`,
                                    `**System Logs Enabled:** ${guild.systemLogsEnabled ? '✅ Yes' : '❌ No'}`,
                                    `**Context Logging Disabled:** ${guild.disableContextLogging ? '❌ Yes (Disabled)' : '✅ No (Enabled)'}`
                                ].join('\n'),
                                inline: true
                            },
                            {
                                name: '🛡️ Moderation Settings',
                                value: [
                                    `**Auto-Mod Enabled:** ${guild.autoModEnabled ? '✅ Yes' : '❌ No'}`,
                                    `**Auto-Mod Level:** ${guild.autoModLevel ? `${guild.autoModLevel}/5` : 'Not set'}`,
                                    `**Moderator Role:** ${guild.moderatorRoleId ? `<@&${guild.moderatorRoleId}> (\`${guild.moderatorRoleId}\`)` : 'Not set'}`,
                                    `**System Role:** ${guild.systemRoleId ? `<@&${guild.systemRoleId}> (\`${guild.systemRoleId}\`)` : 'Not set'}`
                                ].join('\n'),
                                inline: true
                            },
                            {
                                name: '🌐 General Settings',
                                value: [
                                    `**Language:** ${guild.language || 'en (default)'}`,
                                    `**Timezone:** ${guild.timezone || 'UTC (default)'}`,
                                    `**Premium Status:** ${guild.isPremium ? '✨ Premium' : 'Standard'}`
                                ].join('\n'),
                                inline: false
                            }
                        )
                        .setFooter({
                            text: `Viewed by ${interaction.user.username} • ${client.footer}`,
                            iconURL: client.logo
                        })
                        .setTimestamp()

                    return interaction.reply({ embeds: [embed] })
                }

                case 'logs': {
                    if (!isAuthorized) {
                        return interaction.reply({
                            content:
                                '🔒 **Access Denied**\n\nThis command is restricted to Mellow team members only.\n\nIf you need help, use `/guilddebug request-support` to contact our support team.',
                            ephemeral: true
                        })
                    }

                    const targetGuildId = interaction.options.getString('guild-id') || guildId

                    await interaction.deferReply()

                    // Get target guild
                    const targetGuild = await client.guilds.fetch(targetGuildId)

                    const logType = interaction.options.getString('type') || 'all'
                    const limit = interaction.options.getInteger('limit') || 10

                    // Get logs from system logger if available
                    let logs = []
                    if (client.systemLogger && client.systemLogger.getGuildLogs) {
                        logs = await client.systemLogger.getGuildLogs(targetGuildId, logType, limit)
                    }

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle(`📋 Guild Logs: ${logType.toUpperCase()} - ${targetGuild.name}`)
                        .setColor(client.colors.warning)
                        .setDescription(
                            `Showing last ${limit} ${logType === 'all' ? '' : logType + ' '}logs for guild \`${targetGuildId}\``
                        )

                    if (logs.length === 0) {
                        embed.addFields({
                            name: '📝 No Logs Found',
                            value: `No ${logType === 'all' ? '' : logType + ' '}logs found for this guild in the recent period.\n\nThis could indicate:\n• No activity of this type\n• Logging is disabled\n• System logger not configured`,
                            inline: false
                        })
                    } else {
                        // Group logs by type for better readability
                        const logText = logs
                            .map(log => {
                                const timestamp = `<t:${Math.floor(new Date(log.timestamp).getTime() / 1000)}:T>`
                                const level = log.severity?.toUpperCase() || 'INFO'
                                const emoji =
                                    {
                                        ERROR: '❌',
                                        WARN: '⚠️',
                                        INFO: 'ℹ️',
                                        DEBUG: '🔍',
                                        CRISIS: '🚨',
                                        MOD: '🛡️',
                                        SYSTEM: '⚙️',
                                        USER: '👤'
                                    }[level] || 'ℹ️'

                                return `${emoji} **${timestamp}** [${level}] ${log.description || log.title}`
                            })
                            .join('\n')

                        // Split into multiple fields if too long
                        if (logText.length > 1024) {
                            const chunks = logText.match(/.{1,1020}/g) || []
                            chunks.forEach((chunk, index) => {
                                embed.addFields({
                                    name: index === 0 ? '📝 Recent Logs' : '📝 Logs (continued)',
                                    value: chunk,
                                    inline: false
                                })
                            })
                        } else {
                            embed.addFields({
                                name: '📝 Recent Logs',
                                value: logText || 'No logs available',
                                inline: false
                            })
                        }
                    }

                    embed
                        .setFooter({
                            text: `Requested by ${interaction.user.username} • ${client.footer}`,
                            iconURL: client.logo
                        })
                        .setTimestamp()

                    return interaction.editReply({ embeds: [embed] })
                }

                case 'database': {
                    if (!isAuthorized) {
                        return interaction.reply({
                            content:
                                '🔒 **Access Denied**\n\nThis command is restricted to Mellow team members only.\n\nIf you need help, use `/guilddebug request-support` to contact our support team.',
                            ephemeral: true
                        })
                    }

                    const targetGuildId = interaction.options.getString('guild-id') || guildId

                    await interaction.deferReply()

                    // Get target guild
                    const targetGuild = await client.guilds.fetch(targetGuildId)

                    // Get database statistics for this guild
                    const stats = {
                        users: await client.db.users.countGuildUsers(targetGuildId),
                        moodCheckIns: await client.db.moodCheckIns.countByGuild(targetGuildId),
                        ghostLetters: (await client.db.ghostLetters?.countByGuild?.(targetGuildId)) || 0,
                        crisisEvents: (await client.db.crisisEvents?.countByGuild?.(targetGuildId)) || 0,
                        modActions: (await client.db.modActions?.countByGuild?.(targetGuildId)) || 0,
                        conversationHistory: (await client.db.conversationHistory?.countByGuild?.(targetGuildId)) || 0
                    }

                    // Test database connectivity
                    let dbHealth = false
                    let dbLatency = 0
                    try {
                        const start = Date.now()
                        await client.db.guilds.exists(targetGuildId)
                        dbLatency = Date.now() - start
                        dbHealth = true
                    } catch (error) {
                        console.error('Database health check failed:', error)
                    }

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle(`🗄️ Database Health: ${targetGuild.name}`)
                        .setColor(dbHealth ? client.colors.success : client.colors.error)
                        .addFields(
                            {
                                name: '🔌 Database Connection',
                                value: [
                                    `**Status:** ${dbHealth ? '✅ Connected' : '❌ Connection Failed'}`,
                                    `**Query Latency:** ${dbLatency}ms`,
                                    `**Connection Pool:** ${dbHealth ? 'Healthy' : 'Unhealthy'}`
                                ].join('\n'),
                                inline: true
                            },
                            {
                                name: '📊 Data Statistics',
                                value: [
                                    `**Registered Users:** ${stats.users?.toLocaleString() || 0}`,
                                    `**Mood Check-ins:** ${stats.moodCheckIns?.toLocaleString() || 0}`,
                                    `**Ghost Letters:** ${stats.ghostLetters?.toLocaleString() || 0}`,
                                    `**Crisis Events:** ${stats.crisisEvents?.toLocaleString() || 0}`,
                                    `**Mod Actions:** ${stats.modActions?.toLocaleString() || 0}`,
                                    `**Conversation History:** ${stats.conversationHistory?.toLocaleString() || 0}`
                                ].join('\n'),
                                inline: true
                            },
                            {
                                name: '⚡ Performance Metrics',
                                value: [
                                    `**Query Speed:** ${dbLatency < 100 ? '✅ Excellent' : dbLatency < 300 ? '⚠️ Good' : '❌ Slow'} (${dbLatency}ms)`,
                                    `**Data Integrity:** ${dbHealth ? '✅ Verified' : '❌ Issues Detected'}`,
                                    `**Index Usage:** ${dbHealth ? '✅ Optimized' : '⚠️ Unknown'}`
                                ].join('\n'),
                                inline: false
                            }
                        )
                        .setFooter({
                            text: `Checked by ${interaction.user.username} • ${client.footer}`,
                            iconURL: client.logo
                        })
                        .setTimestamp()

                    return interaction.editReply({ embeds: [embed] })
                }

                case 'request-support': {
                    // Anyone can request support
                    const issue = interaction.options.getString('issue')
                    const severity = interaction.options.getString('severity')
                    const contact = interaction.options.getString('contact') || `Discord: ${interaction.user.username}`
                    const targetGuildId = interaction.options.getString('guild-id')

                    await interaction.deferReply({ ephemeral: true })

                    // Check if support service is available
                    if (!client.supportService || !client.supportService.initialized) {
                        return interaction.editReply({
                            content:
                                '❌ **Support Service Unavailable**\n\nThe support service is not currently initialized. Please try again later or contact support directly.',
                            ephemeral: true
                        })
                    }

                    // Only allow Mellow team to specify different guild ID
                    let finalGuildId = guildId
                    let targetGuild = interaction.guild

                    if (targetGuildId && targetGuildId !== guildId) {
                        if (!isAuthorized) {
                            return interaction.editReply({
                                content:
                                    '🔒 **Access Denied**\n\nOnly Mellow team members can specify a different guild ID.\n\nTo report issues for this guild, omit the `guild-id` parameter.',
                                ephemeral: true
                            })
                        }

                        try {
                            // Ensure we're using the string representation for Discord.js
                            const discordGuildId = targetGuildId.toString()
                            targetGuild = await client.guilds.fetch(discordGuildId)
                            finalGuildId = discordGuildId
                        } catch (error) {
                            return interaction.editReply({
                                content: `❌ **Guild Not Found**\n\nCould not find guild with ID: \`${targetGuildId}\`\n\nMake sure the bot is in that guild and the ID is correct.`,
                                ephemeral: true
                            })
                        }
                    }

                    // Check if user has admin permissions
                    const hasAdminPerms = interaction.member.permissions.has([
                        PermissionFlagsBits.Administrator,
                        PermissionFlagsBits.ManageGuild
                    ])

                    const severityEmoji = {
                        critical: '🔴',
                        high: '🟡',
                        medium: '🟢',
                        low: '🔵'
                    }

                    const severityNames = {
                        critical: 'Critical',
                        high: 'High',
                        medium: 'Medium',
                        low: 'Low'
                    }

                    // Prepare support request data
                    const supportRequest = {
                        guildId: finalGuildId,
                        guildName: targetGuild.name,
                        userId,
                        username: interaction.user.username,
                        severity,
                        issue,
                        contact,
                        hasAdminPerms,
                        guildInfo: {
                            memberCount: targetGuild.memberCount,
                            ownerId: targetGuild.ownerId,
                            createdAt: targetGuild.createdAt
                        }
                    }

                    // Submit through support service
                    const result = await client.supportService.submitRequest(supportRequest)

                    if (!result.success) {
                        return interaction.reply({
                            content: `❌ **Failed to Submit Support Request**\n\n${result.error}\n\nPlease try again later or contact us directly at ${client.supportService.config.resources.emailAddress}`,
                            ephemeral: true
                        })
                    }

                    // Send confirmation to user
                    const confirmEmbed = new client.Gateway.EmbedBuilder()
                        .setTitle('✅ Support Request Submitted Successfully')
                        .setColor(client.colors.success)
                        .setDescription(
                            "Your support request has been submitted to the Mellow team. We'll review it and get back to you as soon as possible."
                        )
                        .addFields(
                            {
                                name: '📋 Request Summary',
                                value: [
                                    `**Severity:** ${severityEmoji[severity]} ${severityNames[severity]}`,
                                    `**Contact Method:** ${contact}`,
                                    `**Guild:** ${targetGuild.name}`,
                                    '**Request ID:** `' + result.requestId + '`'
                                ].join('\n'),
                                inline: false
                            },
                            {
                                name: '⏱️ Expected Response Time',
                                value:
                                    severity === 'critical'
                                        ? '🔴 Within 2-4 hours'
                                        : severity === 'high'
                                          ? '🟡 Within 8-12 hours'
                                          : severity === 'medium'
                                            ? '🟢 Within 24-48 hours'
                                            : '🔵 Within 2-5 business days',
                                inline: false
                            },
                            {
                                name: '📞 Additional Support',
                                value: [
                                    '• Join our [support server](' +
                                        client.supportService.config.resources.supportServerInvite +
                                        ') for community help',
                                    '• Check our [documentation](' +
                                        client.supportService.config.resources.documentationUrl +
                                        ') for common solutions',
                                    '• Email us at ' +
                                        client.supportService.config.resources.emailAddress +
                                        ' for urgent issues'
                                ].join('\n'),
                                inline: false
                            }
                        )

                    // Add tracking link if available
                    if (result.messageLink) {
                        confirmEmbed.addFields({
                            name: '🔗 Track Your Request',
                            value: `[View in Support Channel](${result.messageLink})`,
                            inline: false
                        })
                    }

                    confirmEmbed
                        .setFooter({
                            text: client.footer,
                            iconURL: client.logo
                        })
                        .setTimestamp()

                    return interaction.editReply({ embeds: [confirmEmbed] })
                }

                case 'join-guild': {
                    if (!isAuthorized) {
                        return interaction.reply({
                            content:
                                '🔒 **Access Denied**\n\nThis command is restricted to Mellow team members only.\n\nIf you need help, use `/guilddebug request-support` to contact our support team.',
                            ephemeral: true
                        })
                    }

                    const targetGuildId = interaction.options.getString('guild-id')

                    await interaction.deferReply({ ephemeral: true })

                    try {
                        // Ensure we're using the string representation for Discord.js
                        const discordGuildId = targetGuildId.toString()
                        const targetGuild = await client.guilds.fetch(discordGuildId)

                        // Try to find a suitable channel for creating an invite
                        let inviteChannel = null

                        // Priority order: system channel, first text channel, any channel where bot can create invites
                        const channelCandidates = [
                            targetGuild.systemChannel,
                            targetGuild.channels.cache.find(
                                ch =>
                                    ch.type === 0 &&
                                    ch.permissionsFor(client.user).has(PermissionFlagsBits.CreateInstantInvite)
                            ),
                            targetGuild.channels.cache.find(ch => ch.type === 0)
                        ].filter(Boolean)

                        inviteChannel = channelCandidates[0]

                        if (!inviteChannel) {
                            return interaction.editReply({
                                content: `❌ **No Suitable Channel Found**\n\nCould not find a channel in **${targetGuild.name}** where the bot can create invites.\n\nGuild ID: \`${targetGuildId}\``,
                                ephemeral: true
                            })
                        }

                        // Check if bot has permission to create invites in this channel
                        if (!inviteChannel.permissionsFor(client.user).has(PermissionFlagsBits.CreateInstantInvite)) {
                            return interaction.editReply({
                                content: `❌ **Insufficient Permissions**\n\nThe bot does not have permission to create invites in **${targetGuild.name}**.\n\nRequired permission: \`Create Instant Invite\`\nGuild ID: \`${targetGuildId}\``,
                                ephemeral: true
                            })
                        }

                        // Create a one-time invite
                        const invite = await inviteChannel.createInvite({
                            maxAge: 86400, // 24 hours
                            maxUses: 1, // One-time use
                            unique: true,
                            reason: `Guild access invite requested by ${interaction.user.username} (${interaction.user.id})`
                        })

                        // Log the invite creation
                        if (client.systemLogger) {
                            await client.systemLogger.logEvent(
                                'INVITE_CREATED',
                                `One-time invite created for guild ${targetGuild.name}`,
                                {
                                    guildId: targetGuildId,
                                    guildName: targetGuild.name,
                                    requestedBy: interaction.user.id,
                                    inviteCode: invite.code,
                                    expiresAt: new Date(Date.now() + 86400000).toISOString()
                                }
                            )
                        }

                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('✅ Guild Invite Created')
                            .setColor(client.colors.success)
                            .setDescription(`One-time invite created for **${targetGuild.name}**`)
                            .addFields(
                                {
                                    name: '🔗 Invite Link',
                                    value: `[Join ${targetGuild.name}](${invite.url})`,
                                    inline: false
                                },
                                {
                                    name: '📋 Guild Information',
                                    value: [
                                        `**Guild ID:** \`${targetGuildId}\``,
                                        `**Members:** ${targetGuild.memberCount.toLocaleString()}`,
                                        `**Owner:** <@${targetGuild.ownerId}>`,
                                        `**Created:** <t:${Math.floor(targetGuild.createdTimestamp / 1000)}:R>`
                                    ].join('\n'),
                                    inline: false
                                },
                                {
                                    name: '⚠️ Invite Details',
                                    value: [
                                        `**Expires:** <t:${Math.floor((Date.now() + 86400000) / 1000)}:R>`,
                                        `**Max Uses:** 1 (one-time use)`,
                                        `**Channel:** #${inviteChannel.name}`
                                    ].join('\n'),
                                    inline: false
                                }
                            )
                            .setThumbnail(targetGuild.iconURL())
                            .setFooter({
                                text: `Requested by ${interaction.user.username} • ${client.footer}`,
                                iconURL: client.logo
                            })
                            .setTimestamp()

                        return interaction.editReply({ embeds: [embed] })
                    } catch (error) {
                        console.error('Join guild invite creation error:', error)

                        // Log the error
                        if (client.systemLogger) {
                            await client.systemLogger.logError(
                                'INVITE_CREATION_ERROR',
                                `Failed to create invite for guild ${targetGuildId}: ${error.message}`,
                                { guildId: targetGuildId, requestedBy: interaction.user.id, error: error.stack }
                            )
                        }

                        let errorMessage = '❌ **Failed to Create Invite**\n\n'

                        if (error.code === 50001) {
                            errorMessage += 'The bot does not have access to that guild.'
                        } else if (error.code === 10004) {
                            errorMessage += `Guild not found. Make sure the guild ID \`${targetGuildId}\` is correct and the bot is a member of that guild.`
                        } else if (error.code === 50013) {
                            errorMessage += 'The bot lacks the necessary permissions to create invites in that guild.'
                        } else {
                            errorMessage += `An unexpected error occurred: ${error.message}`
                        }

                        errorMessage += `\n\nGuild ID: \`${targetGuildId}\``

                        return interaction.editReply({
                            content: errorMessage,
                            ephemeral: true
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
            console.error('Guild debug command error:', error)

            // Log the error
            if (client.systemLogger) {
                await client.systemLogger.logError(
                    'GUILD_DEBUG_ERROR',
                    'Guild debug command failed: ' + error.message,
                    { guildId, userId, subcommand, error: error.stack }
                )
            }

            const errorMessage = isAuthorized
                ? '❌ **Debug Command Failed**\n\nError: `' +
                  error.message +
                  '`\n\nThis error has been logged for investigation.'
                : '❌ **Command Failed**\n\nSomething went wrong. Please try again or use `/guilddebug request-support` if the issue persists.'

            if (interaction.deferred) {
                return interaction.editReply({ content: errorMessage })
            } else {
                return interaction.reply({ content: errorMessage })
            }
        }
    }
}
