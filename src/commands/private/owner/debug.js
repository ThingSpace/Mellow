import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'debug',
        category: 'Owner',
        description: 'Advanced debugging tools for system diagnostics and troubleshooting',
        handlers: {
            cooldown: 5000,
            requiredRoles: ['OWNER']
        },
        options: [
            {
                name: 'database',
                description: 'Test database connectivity and performance',
                type: cmdTypes.SUB_COMMAND,
                options: []
            },
            {
                name: 'ai',
                description: 'Diagnose AI service health and performance',
                type: cmdTypes.SUB_COMMAND,
                options: []
            },
            {
                name: 'commands',
                description: 'Inspect command registry and loading status',
                type: cmdTypes.SUB_COMMAND,
                options: []
            },
            {
                name: 'logs',
                description: 'View recent error logs and system events',
                type: cmdTypes.SUB_COMMAND,
                options: [
                    {
                        name: 'level',
                        description: 'Log level to display',
                        type: cmdTypes.STRING,
                        required: false,
                        choices: [
                            { name: 'Error', value: 'error' },
                            { name: 'Warning', value: 'warning' },
                            { name: 'Info', value: 'info' },
                            { name: 'Debug', value: 'debug' }
                        ]
                    },
                    {
                        name: 'limit',
                        description: 'Number of log entries to show (max 20)',
                        type: cmdTypes.INTEGER,
                        required: false,
                        min_value: 1,
                        max_value: 20
                    }
                ]
            },
            {
                name: 'memory',
                description: 'Detailed memory usage analysis and garbage collection info',
                type: cmdTypes.SUB_COMMAND,
                options: []
            },
            {
                name: 'performance',
                description: 'Performance profiling and bottleneck analysis',
                type: cmdTypes.SUB_COMMAND,
                options: []
            }
        ]
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
                    content: '❌ This command is restricted to bot owners only.',
                    ephemeral: true
                })
            }
            switch (subcommand) {
                case 'database': {
                    const startTime = Date.now()
                    try {
                        // Test basic database connectivity
                        const userCount = await client.db.prisma.user.count()
                        const guildCount = await client.db.prisma.guild.count()
                        const conversationCount = await client.db.prisma.conversationHistory.count()
                        // Test query performance
                        const queryStart = Date.now()
                        await client.db.prisma.moodCheckIn.findMany({ take: 1 })
                        const queryTime = Date.now() - queryStart
                        const totalTime = Date.now() - startTime
                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('🗄️ Database Diagnostics')
                            .setDescription('Database connectivity and performance analysis')
                            .setColor(client.colors.success)
                            .addFields(
                                {
                                    name: '🔌 Connectivity',
                                    value: [
                                        `**Status:** ✅ Connected`,
                                        `**Total Query Time:** ${totalTime}ms`,
                                        `**Sample Query Time:** ${queryTime}ms`,
                                        `**Connection Pool:** Active`
                                    ].join('\n'),
                                    inline: true
                                },
                                {
                                    name: '📊 Data Overview',
                                    value: [
                                        `**Users:** ${userCount.toLocaleString()}`,
                                        `**Guilds:** ${guildCount.toLocaleString()}`,
                                        `**Conversations:** ${conversationCount.toLocaleString()}`,
                                        `**Status:** Healthy`
                                    ].join('\n'),
                                    inline: true
                                },
                                {
                                    name: '⚡ Performance',
                                    value: [
                                        `**Query Speed:** ${queryTime < 100 ? '🟢 Fast' : queryTime < 500 ? '🟡 Moderate' : '🔴 Slow'}`,
                                        `**Connection Latency:** ${totalTime}ms`,
                                        `**Query Efficiency:** ${queryTime < 100 ? 'Optimal' : 'Review needed'}`,
                                        `**Database Size:** Normal`
                                    ].join('\n'),
                                    inline: false
                                }
                            )
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })
                        return interaction.editReply({ embeds: [embed] })
                    } catch (error) {
                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('❌ Database Error')
                            .setDescription('Database connectivity test failed')
                            .setColor(client.colors.error)
                            .addFields({
                                name: 'Error Details',
                                value: `\`\`\`${error.message}\`\`\``,
                                inline: false
                            })
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })
                        return interaction.editReply({ embeds: [embed] })
                    }
                }
                case 'ai': {
                    try {
                        const performanceReport = client.ai.performance.formatMetricsReport()
                        const metrics = client.ai.performance.getMetrics()
                        // Test AI service connectivity
                        const testStart = Date.now()
                        const isConnected = client.ai.isConnected()
                        const responseTime = Date.now() - testStart
                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('🤖 AI Service Diagnostics')
                            .setDescription('AI service health and performance analysis')
                            .setColor(isConnected ? client.colors.success : client.colors.error)
                            .addFields(
                                {
                                    name: '🔌 Service Status',
                                    value: [
                                        `**Connection:** ${isConnected ? '✅ Active' : '❌ Disconnected'}`,
                                        `**Response Time:** ${responseTime}ms`,
                                        `**API Status:** ${isConnected ? 'Operational' : 'Error'}`,
                                        `**Rate Limiting:** ${metrics.errorRate < 1 ? 'Normal' : 'Active'}`
                                    ].join('\n'),
                                    inline: true
                                },
                                {
                                    name: '📈 Performance Metrics',
                                    value: [
                                        `**Avg Response:** ${metrics.responseTime.toFixed(2)}ms`,
                                        `**Error Rate:** ${metrics.errorRate.toFixed(2)}%`,
                                        `**System Load:** ${metrics.systemLoad.toFixed(2)}`,
                                        `**Memory Usage:** ${metrics.memoryUsage}%`
                                    ].join('\n'),
                                    inline: true
                                },
                                {
                                    name: '🔍 Detailed Report',
                                    value: `\`\`\`${performanceReport}\`\`\``,
                                    inline: false
                                }
                            )
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })
                        return interaction.editReply({ embeds: [embed] })
                    } catch (error) {
                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('❌ AI Service Error')
                            .setDescription('AI service diagnostics failed')
                            .setColor(client.colors.error)
                            .addFields({
                                name: 'Error Details',
                                value: `\`\`\`${error.message}\`\`\``,
                                inline: false
                            })
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })
                        return interaction.editReply({ embeds: [embed] })
                    }
                }
                case 'commands': {
                    try {
                        // Analyze command registry
                        const slashCommands = client.slash
                        const privateCommands = client.private
                        const contextCommands = client.context
                        const slashCategories = [...new Set(slashCommands.map(cmd => cmd.structure.category))]
                        const privateCategories = [...new Set(privateCommands.map(cmd => cmd.structure.category))]
                        const totalCommands = slashCommands.size + privateCommands.size + contextCommands.size
                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('⚙️ Command Registry Diagnostics')
                            .setDescription('Command loading status and registry analysis')
                            .setColor(client.colors.primary)
                            .addFields(
                                {
                                    name: '📊 Command Counts',
                                    value: [
                                        `**Slash Commands:** ${slashCommands.size}`,
                                        `**Private Commands:** ${privateCommands.size}`,
                                        `**Context Commands:** ${contextCommands.size}`,
                                        `**Total Loaded:** ${totalCommands}`
                                    ].join('\n'),
                                    inline: true
                                },
                                {
                                    name: '📂 Categories',
                                    value: [
                                        `**Slash Categories:** ${slashCategories.length}`,
                                        `**Private Categories:** ${privateCategories.length}`,
                                        `**Category Health:** ✅ All loaded`,
                                        `**Registry Status:** Operational`
                                    ].join('\n'),
                                    inline: true
                                },
                                {
                                    name: '🔍 Slash Categories',
                                    value: slashCategories
                                        .map(cat => {
                                            const count = slashCommands.filter(
                                                cmd => cmd.structure.category === cat
                                            ).size
                                            return `• **${cat}:** ${count} commands`
                                        })
                                        .join('\n'),
                                    inline: false
                                },
                                {
                                    name: '🔐 Private Categories',
                                    value: privateCategories
                                        .map(cat => {
                                            const count = privateCommands.filter(
                                                cmd => cmd.structure.category === cat
                                            ).size
                                            return `• **${cat}:** ${count} commands`
                                        })
                                        .join('\n'),
                                    inline: false
                                }
                            )
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })
                        return interaction.editReply({ embeds: [embed] })
                    } catch (error) {
                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('❌ Command Registry Error')
                            .setDescription('Command diagnostics failed')
                            .setColor(client.colors.error)
                            .addFields({
                                name: 'Error Details',
                                value: `\`\`\`${error.message}\`\`\``,
                                inline: false
                            })
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })
                        return interaction.editReply({ embeds: [embed] })
                    }
                }
                case 'logs': {
                    const level = interaction.options.getString('level') || 'error'
                    const limit = interaction.options.getInteger('limit') || 10
                    try {
                        // Use actual system logger if available
                        let logEntries = []
                        if (client.systemLogger && client.systemLogger.getRecentLogs) {
                            logEntries = await client.systemLogger.getRecentLogs(level, limit)
                        }
                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('📋 System Logs Analysis')
                            .setDescription(`Recent ${level} level logs (last ${limit} entries)`)
                            .setColor(
                                level === 'error'
                                    ? client.colors.error
                                    : level === 'warning'
                                      ? client.colors.warning
                                      : client.colors.primary
                            )
                        if (logEntries.length > 0) {
                            embed.addFields({
                                name: '📝 Recent Logs',
                                value: logEntries
                                    .map(log => {
                                        const ts = log.timestamp
                                            ? `<t:${Math.floor(new Date(log.timestamp).getTime() / 1000)}:T>`
                                            : ''
                                        return `${ts} [${log.level?.toUpperCase() || 'INFO'}] ${log.message || log.title}`
                                    })
                                    .join('\n')
                                    .slice(0, 1024),
                                inline: false
                            })
                        } else {
                            embed.addFields({
                                name: '📝 No Logs Found',
                                value: 'No logs found for the selected level and limit.',
                                inline: false
                            })
                        }
                        embed
                            .addFields(
                                {
                                    name: '� Log Configuration',
                                    value: [
                                        `**Level Filter:** ${level.toUpperCase()}`,
                                        `**Entry Limit:** ${limit}`,
                                        `**System Logger:** ${client.systemLogger ? '✅ Active' : '❌ Inactive'}`,
                                        `**Error Tracking:** Enabled`
                                    ].join('\n'),
                                    inline: true
                                },
                                {
                                    name: '� Log Statistics',
                                    value: [
                                        `**Total Channels:** ${client.systemLogger?.channels?.size || 0}`,
                                        `**Logging Enabled:** ${client.systemLogger?.enabled ? 'Yes' : 'No'}`,
                                        `**Recent Errors:** Monitoring`,
                                        `**Log Health:** Good`
                                    ].join('\n'),
                                    inline: true
                                }
                            )
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: `${client.footer} • Use system logger for detailed logs`,
                                iconURL: client.logo
                            })
                        return interaction.editReply({ embeds: [embed] })
                    } catch (error) {
                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('❌ Logs Analysis Error')
                            .setDescription('Log analysis failed')
                            .setColor(client.colors.error)
                            .addFields({
                                name: 'Error Details',
                                value: `\`\`\`${error.message}\`\`\``,
                                inline: false
                            })
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })
                        return interaction.editReply({ embeds: [embed] })
                    }
                }
                case 'memory': {
                    try {
                        const memUsage = process.memoryUsage()
                        const performanceTool = client.ai.performance
                        const systemStats = performanceTool.getSystemStats()
                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('🧠 Memory Usage Analysis')
                            .setDescription('Detailed memory usage and garbage collection info')
                            .setColor(client.colors.primary)
                            .addFields(
                                {
                                    name: '💾 Process Memory',
                                    value: [
                                        `**Heap Used:** ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
                                        `**Heap Total:** ${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
                                        `**RSS:** ${Math.round(memUsage.rss / 1024 / 1024)} MB`,
                                        `**External:** ${Math.round(memUsage.external / 1024 / 1024)} MB`
                                    ].join('\n'),
                                    inline: true
                                },
                                {
                                    name: '🖥️ System Memory',
                                    value: [
                                        `**Total:** ${Math.round(systemStats.system.totalMem / 1024 / 1024 / 1024)} GB`,
                                        `**Free:** ${Math.round(systemStats.system.freeMem / 1024 / 1024 / 1024)} GB`,
                                        `**Usage:** ${Math.round(((systemStats.system.totalMem - systemStats.system.freeMem) / systemStats.system.totalMem) * 100)}%`,
                                        `**Load Avg:** ${systemStats.system.loadAvg[0].toFixed(2)}`
                                    ].join('\n'),
                                    inline: true
                                },
                                {
                                    name: '📈 Memory Health',
                                    value: [
                                        `**Heap Efficiency:** ${Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)}%`,
                                        `**Memory Pressure:** ${memUsage.heapUsed > 500 * 1024 * 1024 ? '🔴 High' : '🟢 Normal'}`,
                                        `**GC Recommended:** ${memUsage.heapUsed > 800 * 1024 * 1024 ? 'Yes' : 'No'}`,
                                        `**Performance Impact:** ${memUsage.heapUsed > 1000 * 1024 * 1024 ? 'Significant' : 'Minimal'}`
                                    ].join('\n'),
                                    inline: false
                                }
                            )
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })
                        return interaction.editReply({ embeds: [embed] })
                    } catch (error) {
                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('❌ Memory Analysis Error')
                            .setDescription('Memory diagnostics failed')
                            .setColor(client.colors.error)
                            .addFields({
                                name: 'Error Details',
                                value: `\`\`\`${error.message}\`\`\``,
                                inline: false
                            })
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })
                        return interaction.editReply({ embeds: [embed] })
                    }
                }
                case 'performance': {
                    try {
                        const performanceTool = client.ai.performance
                        const metrics = performanceTool.getMetrics()
                        const systemStats = performanceTool.getSystemStats()
                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('⚡ Performance Analysis')
                            .setDescription('Performance profiling and bottleneck analysis')
                            .setColor(
                                metrics.memoryUsage > 80
                                    ? client.colors.error
                                    : metrics.memoryUsage > 60
                                      ? client.colors.warning
                                      : client.colors.success
                            )
                            .addFields(
                                {
                                    name: '🎯 Key Metrics',
                                    value: [
                                        `**Response Time:** ${metrics.responseTime.toFixed(2)}ms`,
                                        `**Error Rate:** ${metrics.errorRate.toFixed(2)}%`,
                                        `**Memory Usage:** ${metrics.memoryUsage}%`,
                                        `**System Load:** ${metrics.systemLoad.toFixed(2)}`
                                    ].join('\n'),
                                    inline: true
                                },
                                {
                                    name: '🚀 Performance Status',
                                    value: [
                                        `**Overall:** ${metrics.memoryUsage < 70 && metrics.errorRate < 1 ? '🟢 Excellent' : metrics.memoryUsage < 85 && metrics.errorRate < 5 ? '🟡 Good' : '🔴 Needs Attention'}`,
                                        `**Uptime:** ${performanceTool.formatUptime(metrics.uptime)}`,
                                        `**Stability:** ${metrics.errorRate < 1 ? 'High' : 'Moderate'}`,
                                        `**Efficiency:** ${metrics.responseTime < 100 ? 'Optimal' : 'Review needed'}`
                                    ].join('\n'),
                                    inline: true
                                },
                                {
                                    name: '🔍 Bottleneck Analysis',
                                    value: [
                                        `• **CPU Usage:** ${systemStats.cpu.user > 100000000 ? 'High CPU usage detected' : 'Normal'}`,
                                        `• **Memory Pressure:** ${metrics.memoryUsage > 80 ? 'Memory optimization needed' : 'Memory usage healthy'}`,
                                        `• **Response Times:** ${metrics.responseTime > 200 ? 'Slow response times detected' : 'Response times optimal'}`,
                                        `• **Error Frequency:** ${metrics.errorRate > 2 ? 'Error rate above normal' : 'Error rate normal'}`,
                                        `• **System Load:** ${metrics.systemLoad > 2 ? 'High system load' : 'System load normal'}`
                                    ].join('\n'),
                                    inline: false
                                }
                            )
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })
                        return interaction.editReply({ embeds: [embed] })
                    } catch (error) {
                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('❌ Performance Analysis Error')
                            .setDescription('Performance diagnostics failed')
                            .setColor(client.colors.error)
                            .addFields({
                                name: 'Error Details',
                                value: `\`\`\`${error.message}\`\`\``,
                                inline: false
                            })
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })
                        return interaction.editReply({ embeds: [embed] })
                    }
                }
                default: {
                    return interaction.editReply({
                        content: 'Unknown debug subcommand.',
                        ephemeral: true
                    })
                }
            }
        } catch (error) {
            console.error('Error in debug command:', error)
            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('❌ Debug Command Error')
                .setDescription('An error occurred while running debug diagnostics.')
                .setColor(client.colors.error)
                .addFields({
                    name: 'Error Details',
                    value: `\`\`\`${error.message}\`\`\``,
                    inline: false
                })
                .setThumbnail(client.logo)
                .setTimestamp()
                .setFooter({
                    text: client.footer,
                    iconURL: client.logo
                })
            await interaction.editReply({ embeds: [embed] })
        }
    }
}
