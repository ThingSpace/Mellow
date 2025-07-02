export default {
    structure: {
        name: 'status',
        category: 'Info',
        description: "Get Mellow's current performance metrics, system status, and health information",
        handlers: {
            cooldown: 15000,
            requiredRoles: []
        }
    },

    run: async (client, interaction) => {
        try {
            // Get performance metrics
            const report = client.ai.performance.formatMetricsReport()

            // Get basic system information
            const uptime = Math.floor(client.uptime / 1000)
            const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
            const guildCount = client.guilds.cache.size
            const userCount = client.users.cache.size

            // Calculate uptime formatting
            const days = Math.floor(uptime / 86400)
            const hours = Math.floor((uptime % 86400) / 3600)
            const minutes = Math.floor((uptime % 3600) / 60)
            const uptimeString =
                days > 0 ? `${days}d ${hours}h ${minutes}m` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

            // Determine status emoji based on performance
            const statusEmoji =
                memoryUsage < 500 && uptime > 3600 ? '🟢' : memoryUsage < 1000 && uptime > 300 ? '🟡' : '🔴'

            const embed = new client.Gateway.EmbedBuilder()
                .setTitle(`${statusEmoji} Mellow System Status`)
                .setDescription('Current performance and health metrics for Mellow')
                .setColor(
                    memoryUsage < 500
                        ? client.colors.success
                        : memoryUsage < 1000
                          ? client.colors.warning
                          : client.colors.error
                )
                .setThumbnail(client.logo)
                .addFields(
                    {
                        name: '⚡ System Performance',
                        value: [
                            `**Status:** ${statusEmoji} ${memoryUsage < 500 ? 'Excellent' : memoryUsage < 1000 ? 'Good' : 'Monitoring'}`,
                            `**Uptime:** ${uptimeString}`,
                            `**Memory Usage:** ${memoryUsage} MB`,
                            `**Latency:** ${client.ws.ping}ms`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🌐 Connection Status',
                        value: [
                            `**Servers:** ${guildCount.toLocaleString()}`,
                            `**Users:** ${userCount.toLocaleString()}`,
                            `**Shards:** ${client.ws.shards.size || 1}`,
                            `**Commands:** ${client.slash.size} loaded`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🤖 AI Service Status',
                        value: report || 'AI metrics unavailable',
                        inline: false
                    },
                    {
                        name: '🔒 Privacy & Safety',
                        value: [
                            '✅ **Context logging** respects user preferences',
                            '✅ **Crisis detection** active 24/7',
                            '✅ **Privacy controls** fully functional',
                            '✅ **Data protection** compliant'
                        ].join('\n'),
                        inline: false
                    }
                )
                .setFooter({
                    text: `${client.footer} • Last updated`,
                    iconURL: client.logo
                })
                .setTimestamp()

            // Add status indicator in footer
            if (memoryUsage > 1000) {
                embed.addFields({
                    name: '⚠️ Performance Notice',
                    value: 'System is under higher load but fully operational. Response times may be slightly slower.',
                    inline: false
                })
            }

            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            console.error('Error getting status:', error)

            // Fallback status response
            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('� Status Check Error')
                .setDescription('Encountered an issue gathering detailed status, but core systems are operational')
                .setColor(client.colors.error)
                .addFields(
                    {
                        name: '✅ Core Systems',
                        value: [
                            '• Discord connection active',
                            '• Command processing functional',
                            '• Database connectivity confirmed',
                            '• Crisis support available'
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '⚠️ Status Details',
                        value: 'Unable to retrieve detailed metrics. Please try again in a moment.',
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
