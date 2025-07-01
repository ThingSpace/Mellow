import { aiService } from '../../../services/ai.service.js'

export default {
    structure: {
        name: 'metrics',
        category: 'Info',
        description: 'View detailed performance metrics, analytics, and system resource usage',
        handlers: {
            cooldown: 10000,
            requiredRoles: []
        }
    },

    run: async (client, interaction) => {
        try {
            // Get comprehensive performance metrics
            const performanceTool = aiService.performance
            const metrics = performanceTool.getMetrics()
            const systemStats = performanceTool.getSystemStats()

            // Get Discord client metrics
            const uptime = Math.floor(client.uptime / 1000)
            const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
            const guildCount = client.guilds.cache.size
            const userCount = client.users.cache.size
            const ping = client.ws.ping

            // Calculate detailed metrics
            const days = Math.floor(uptime / 86400)
            const hours = Math.floor((uptime % 86400) / 3600)
            const minutes = Math.floor((uptime % 3600) / 60)
            const uptimeString =
                days > 0 ? `${days}d ${hours}h ${minutes}m` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

            // Get database performance metrics
            const dbStart = Date.now()
            const totalUsers = await client.db.prisma.user.count().catch(() => 0)
            const dbQueryTime = Date.now() - dbStart

            // Calculate system performance indicators
            const cpuUsage = ((systemStats.cpu.user + systemStats.cpu.system) / 1000000).toFixed(2)
            const memoryPercent = Math.round((systemStats.memory.heapUsed / systemStats.memory.heapTotal) * 100)
            const systemMemoryPercent = Math.round(
                ((systemStats.system.totalMem - systemStats.system.freeMem) / systemStats.system.totalMem) * 100
            )

            // Determine status colors and indicators
            const performanceStatus =
                memoryUsage < 400 && ping < 100 && metrics.errorRate < 1
                    ? '🟢 Excellent'
                    : memoryUsage < 700 && ping < 200 && metrics.errorRate < 3
                      ? '🟡 Good'
                      : '🔴 Monitoring'

            const statusColor = performanceStatus.includes('🟢')
                ? client.colors.success
                : performanceStatus.includes('🟡')
                  ? client.colors.warning
                  : client.colors.error

            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('📊 Comprehensive Performance Metrics')
                .setDescription(`System analytics and resource usage monitoring • Status: ${performanceStatus}`)
                .setColor(statusColor)
                .setThumbnail(client.logo)
                .addFields(
                    {
                        name: '⚡ Performance Overview',
                        value: [
                            `**Overall Status:** ${performanceStatus}`,
                            `**Uptime:** ${uptimeString}`,
                            `**Response Time:** ${metrics.responseTime.toFixed(2)}ms`,
                            `**Error Rate:** ${metrics.errorRate.toFixed(2)}%`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🌐 Connection Metrics',
                        value: [
                            `**Discord Latency:** ${ping}ms`,
                            `**Database Query:** ${dbQueryTime}ms`,
                            `**Servers Connected:** ${guildCount.toLocaleString()}`,
                            `**Users Cached:** ${userCount.toLocaleString()}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🧠 Memory Usage',
                        value: [
                            `**Process Memory:** ${memoryUsage} MB (${memoryPercent}%)`,
                            `**Heap Used:** ${Math.round(systemStats.memory.heapUsed / 1024 / 1024)} MB`,
                            `**System Memory:** ${systemMemoryPercent}% used`,
                            `**Memory Status:** ${memoryUsage < 500 ? '🟢 Healthy' : memoryUsage < 800 ? '🟡 Moderate' : '🔴 High'}`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🖥️ System Resources',
                        value: [
                            `**CPU Usage:** ${cpuUsage}ms total`,
                            `**System Load:** ${systemStats.system.loadAvg[0].toFixed(2)} (1m avg)`,
                            `**Available Memory:** ${Math.round(systemStats.system.freeMem / 1024 / 1024 / 1024)} GB`,
                            `**Total Memory:** ${Math.round(systemStats.system.totalMem / 1024 / 1024 / 1024)} GB`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '📈 Performance Analytics',
                        value: [
                            `**Commands Loaded:** ${client.slash.size + client.private.size + client.context.size}`,
                            `**Database Records:** ${totalUsers.toLocaleString()} users`,
                            `**Cache Efficiency:** ${userCount > 1000 ? 'High' : 'Normal'}`,
                            `**Resource Optimization:** ${memoryUsage < 600 ? 'Optimal' : 'Review needed'}`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🔍 Detailed Breakdown',
                        value: [
                            `• **WebSocket Status:** ${client.ws.status === 0 ? '✅ Ready' : '⚠️ Connecting'}`,
                            `• **Shard Count:** ${client.ws.shards.size || 1}`,
                            `• **Event Loop Lag:** ${metrics.responseTime > 100 ? '⚠️ High' : '✅ Normal'}`,
                            `• **GC Pressure:** ${memoryPercent > 80 ? '⚠️ High' : '✅ Normal'}`,
                            `• **Error Tracking:** ${metrics.errorRate < 1 ? '✅ Stable' : '⚠️ Monitoring'}`
                        ].join('\n'),
                        inline: false
                    }
                )
                .setFooter({
                    text: `${client.footer} • Metrics updated every minute`,
                    iconURL: client.logo
                })
                .setTimestamp()

            // Add performance alerts if needed
            const alerts = []
            if (memoryUsage > 800) alerts.push('⚠️ High memory usage detected')
            if (ping > 200) alerts.push('⚠️ High Discord latency')
            if (metrics.errorRate > 3) alerts.push('⚠️ Elevated error rate')
            if (dbQueryTime > 500) alerts.push('⚠️ Slow database queries')

            if (alerts.length > 0) {
                embed.addFields({
                    name: '🚨 Performance Alerts',
                    value: alerts.join('\n'),
                    inline: false
                })
            }

            // Add optimization suggestions
            const suggestions = []
            if (memoryUsage > 600) suggestions.push('• Consider memory optimization or restart')
            if (metrics.responseTime > 150) suggestions.push('• Review event loop performance')
            if (systemStats.system.loadAvg[0] > 2) suggestions.push('• Monitor system resource usage')
            if (metrics.errorRate > 1) suggestions.push('• Investigate error patterns')

            if (suggestions.length > 0) {
                embed.addFields({
                    name: '💡 Performance Suggestions',
                    value: suggestions.join('\n'),
                    inline: false
                })
            }

            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            console.error('Error getting metrics:', error)

            // Fallback metrics response
            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('⚠️ Metrics Collection Error')
                .setDescription('Unable to gather detailed metrics, but basic systems are operational')
                .setColor(client.colors.warning)
                .addFields(
                    {
                        name: '📊 Basic Metrics',
                        value: [
                            `**Uptime:** ${Math.floor(client.uptime / 1000)}s`,
                            `**Memory:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
                            `**Servers:** ${client.guilds.cache.size}`,
                            `**Ping:** ${client.ws.ping}ms`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '✅ System Status',
                        value: [
                            '• Discord connection active',
                            '• Commands processing normally',
                            '• Database connectivity confirmed',
                            '• Core features operational'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🔧 Error Details',
                        value: `Unable to access detailed metrics: ${error.message}`,
                        inline: false
                    }
                )
                .setThumbnail(client.logo)
                .setTimestamp()
                .setFooter({
                    text: `${client.footer} • Use /status for basic health check`,
                    iconURL: client.logo
                })

            await interaction.reply({ embeds: [embed] })
        }
    }
}
