export default {
    structure: {
        name: 'health',
        category: 'Info',
        description: 'Quick system health check - verify all core services and components are operational',
        handlers: {
            cooldown: 30000,
            requiredRoles: []
        }
    },

    run: async (client, interaction) => {
        try {
            const healthChecks = []
            let overallStatus = 'healthy'
            let statusColor = client.colors.success

            // 1. Discord Connection Health
            const discordHealth = {
                name: '🔗 Discord Connection',
                status: 'checking'
            }

            try {
                const ping = client.ws.ping
                const isReady = client.ws.status === 0

                if (isReady && ping < 300) {
                    discordHealth.status = 'healthy'
                    discordHealth.details = `Latency: ${ping}ms • Status: Ready`
                } else if (isReady) {
                    discordHealth.status = 'degraded'
                    discordHealth.details = `Latency: ${ping}ms • Status: High latency`
                    overallStatus = 'degraded'
                } else {
                    discordHealth.status = 'unhealthy'
                    discordHealth.details = 'Connection not ready'
                    overallStatus = 'unhealthy'
                }
            } catch (error) {
                discordHealth.status = 'error'
                discordHealth.details = `Error: ${error.message}`
                overallStatus = 'unhealthy'
            }
            healthChecks.push(discordHealth)

            // 2. Database Health
            const dbHealth = {
                name: '🗄️ Database',
                status: 'checking'
            }

            try {
                const start = Date.now()
                await client.db.prisma.user.count()
                const queryTime = Date.now() - start

                if (queryTime < 200) {
                    dbHealth.status = 'healthy'
                    dbHealth.details = `Query time: ${queryTime}ms • Connected`
                } else if (queryTime < 1000) {
                    dbHealth.status = 'degraded'
                    dbHealth.details = `Query time: ${queryTime}ms • Slow response`
                    if (overallStatus === 'healthy') overallStatus = 'degraded'
                } else {
                    dbHealth.status = 'unhealthy'
                    dbHealth.details = `Query time: ${queryTime}ms • Very slow`
                    overallStatus = 'unhealthy'
                }
            } catch (error) {
                dbHealth.status = 'error'
                dbHealth.details = `Connection failed: ${error.message}`
                overallStatus = 'unhealthy'
            }
            healthChecks.push(dbHealth)

            // 3. AI Service Health
            const aiHealth = {
                name: '🤖 AI Service',
                status: 'checking'
            }

            try {
                const { aiService } = await import('../../../services/ai.service.js')
                const isConnected = aiService.isConnected()
                const metrics = aiService.performance.getMetrics()

                if (isConnected && metrics.errorRate < 5) {
                    aiHealth.status = 'healthy'
                    aiHealth.details = `Connected • Error rate: ${metrics.errorRate.toFixed(2)}%`
                } else if (isConnected) {
                    aiHealth.status = 'degraded'
                    aiHealth.details = `Connected • High error rate: ${metrics.errorRate.toFixed(2)}%`
                    if (overallStatus === 'healthy') overallStatus = 'degraded'
                } else {
                    aiHealth.status = 'unhealthy'
                    aiHealth.details = 'Service unavailable'
                    overallStatus = 'unhealthy'
                }
            } catch (error) {
                aiHealth.status = 'error'
                aiHealth.details = `Service error: ${error.message}`
                overallStatus = 'unhealthy'
            }
            healthChecks.push(aiHealth)

            // 4. Memory Health
            const memoryHealth = {
                name: '🧠 Memory Usage',
                status: 'checking'
            }

            try {
                const memUsage = process.memoryUsage()
                const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024)
                const memPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)

                if (memUsageMB < 500) {
                    memoryHealth.status = 'healthy'
                    memoryHealth.details = `${memUsageMB}MB (${memPercent}%) • Optimal`
                } else if (memUsageMB < 800) {
                    memoryHealth.status = 'degraded'
                    memoryHealth.details = `${memUsageMB}MB (${memPercent}%) • Moderate usage`
                    if (overallStatus === 'healthy') overallStatus = 'degraded'
                } else {
                    memoryHealth.status = 'unhealthy'
                    memoryHealth.details = `${memUsageMB}MB (${memPercent}%) • High usage`
                    overallStatus = 'unhealthy'
                }
            } catch (error) {
                memoryHealth.status = 'error'
                memoryHealth.details = `Memory check failed: ${error.message}`
                overallStatus = 'unhealthy'
            }
            healthChecks.push(memoryHealth)

            // 5. System Logger Health
            const loggerHealth = {
                name: '📝 System Logger',
                status: 'checking'
            }

            try {
                if (client.systemLogger && client.systemLogger.enabled) {
                    const channelCount = client.systemLogger.channels?.size || 0
                    loggerHealth.status = 'healthy'
                    loggerHealth.details = `Active • ${channelCount} channels configured`
                } else {
                    loggerHealth.status = 'degraded'
                    loggerHealth.details = 'Disabled or not configured'
                    if (overallStatus === 'healthy') overallStatus = 'degraded'
                }
            } catch (error) {
                loggerHealth.status = 'error'
                loggerHealth.details = `Logger error: ${error.message}`
                if (overallStatus === 'healthy') overallStatus = 'degraded'
            }
            healthChecks.push(loggerHealth)

            // 6. Commands Health
            const commandsHealth = {
                name: '⚙️ Commands',
                status: 'checking'
            }

            try {
                const totalCommands = client.slash.size + client.private.size + client.context.size

                if (totalCommands > 50) {
                    commandsHealth.status = 'healthy'
                    commandsHealth.details = `${totalCommands} commands loaded • Registry healthy`
                } else if (totalCommands > 20) {
                    commandsHealth.status = 'degraded'
                    commandsHealth.details = `${totalCommands} commands loaded • Some missing`
                    if (overallStatus === 'healthy') overallStatus = 'degraded'
                } else {
                    commandsHealth.status = 'unhealthy'
                    commandsHealth.details = `${totalCommands} commands loaded • Registry incomplete`
                    overallStatus = 'unhealthy'
                }
            } catch (error) {
                commandsHealth.status = 'error'
                commandsHealth.details = `Command check failed: ${error.message}`
                overallStatus = 'unhealthy'
            }
            healthChecks.push(commandsHealth)

            // Set status color based on overall health
            statusColor =
                overallStatus === 'healthy'
                    ? client.colors.success
                    : overallStatus === 'degraded'
                      ? client.colors.warning
                      : client.colors.error

            // Create status emoji
            const statusEmoji = overallStatus === 'healthy' ? '🟢' : overallStatus === 'degraded' ? '🟡' : '🔴'

            // Build embed
            const embed = new client.Gateway.EmbedBuilder()
                .setTitle(`${statusEmoji} System Health Check`)
                .setDescription(`Overall Status: **${overallStatus.toUpperCase()}** • All core components checked`)
                .setColor(statusColor)
                .setThumbnail(client.logo)

            // Add health check results
            const healthResults = healthChecks
                .map(check => {
                    const emoji =
                        check.status === 'healthy'
                            ? '✅'
                            : check.status === 'degraded'
                              ? '⚠️'
                              : check.status === 'unhealthy'
                                ? '❌'
                                : '🔄'
                    return `${emoji} **${check.name}**: ${check.details || check.status}`
                })
                .join('\n')

            embed.addFields({
                name: '🏥 Component Health Status',
                value: healthResults,
                inline: false
            })

            // Add summary statistics
            const healthyCount = healthChecks.filter(c => c.status === 'healthy').length
            const degradedCount = healthChecks.filter(c => c.status === 'degraded').length
            const unhealthyCount = healthChecks.filter(c => c.status === 'unhealthy' || c.status === 'error').length

            embed.addFields({
                name: '📊 Health Summary',
                value: [
                    `**Healthy Components:** ${healthyCount}/${healthChecks.length}`,
                    `**Degraded Components:** ${degradedCount}`,
                    `**Unhealthy Components:** ${unhealthyCount}`,
                    `**System Availability:** ${overallStatus === 'healthy' ? '100%' : overallStatus === 'degraded' ? '75%' : '50%'}`
                ].join('\n'),
                inline: true
            })

            // Add quick actions
            embed.addFields({
                name: '🔧 Quick Actions',
                value: [
                    '• Use `/status` for detailed performance metrics',
                    '• Use `/metrics` for comprehensive analytics',
                    '• Check `/context` for AI memory status',
                    '• Use `/support` if issues persist'
                ].join('\n'),
                inline: true
            })

            // Add recommendations if needed
            if (overallStatus !== 'healthy') {
                const recommendations = []

                if (degradedCount > 0) {
                    recommendations.push('• Monitor degraded components closely')
                }
                if (unhealthyCount > 0) {
                    recommendations.push('• Investigate unhealthy components immediately')
                }
                if (overallStatus === 'unhealthy') {
                    recommendations.push('• Consider system restart if issues persist')
                }

                if (recommendations.length > 0) {
                    embed.addFields({
                        name: '💡 Recommendations',
                        value: recommendations.join('\n'),
                        inline: false
                    })
                }
            }

            embed
                .setFooter({
                    text: `${client.footer} • Health check completed`,
                    iconURL: client.logo
                })
                .setTimestamp()

            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            console.error('Error in health check:', error)

            // Emergency fallback response
            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('🚨 Health Check Error')
                .setDescription('Unable to complete health check, but basic systems appear operational')
                .setColor(client.colors.error)
                .addFields(
                    {
                        name: '⚠️ Check Status',
                        value: `Health check failed: ${error.message}`,
                        inline: false
                    },
                    {
                        name: '✅ Known Working',
                        value: [
                            '• Discord connection (you received this response)',
                            '• Command processing (command executed)',
                            '• Basic bot functionality',
                            '• Error handling systems'
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🔧 Next Steps',
                        value: [
                            '• Try `/status` for basic system status',
                            '• Use `/metrics` for performance data',
                            '• Use `/support` if issues persist'
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

            await interaction.reply({ embeds: [embed] })
        }
    }
}
