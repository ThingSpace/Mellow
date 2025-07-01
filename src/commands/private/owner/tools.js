import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import deploy from '../../../handlers/deploy.js'
import commands from '../../../handlers/commands.js'

export default {
    structure: {
        name: 'tools',
        category: 'Owner',
        description: 'Bot management tools for owners (reload commands, sync, etc.)',
        handlers: {
            cooldown: 10000,
            requiredRoles: ['OWNER']
        },
        options: [
            {
                name: 'reload',
                description: 'Reload slash commands from filesystem',
                type: cmdTypes.SUB_COMMAND,
                options: []
            },
            {
                name: 'sync',
                description: 'Sync/redeploy slash commands to Discord',
                type: cmdTypes.SUB_COMMAND,
                options: []
            },
            {
                name: 'restart',
                description: 'Restart the bot (reload commands + sync)',
                type: cmdTypes.SUB_COMMAND,
                options: []
            },
            {
                name: 'status',
                description: 'View bot system status and command counts',
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
                    embeds: [
                        new client.Gateway.EmbedBuilder()
                            .setTitle('Access Denied')
                            .setDescription('You do not have permission to use owner commands.')
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
                case 'reload': {
                    try {
                        // Clear existing commands
                        client.slash.clear()
                        client.private.clear()
                        client.context.clear()

                        // Reload commands from filesystem
                        await commands(client)

                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('🔄 Commands Reloaded')
                            .setDescription('Successfully reloaded all commands from filesystem!')
                            .setColor(client.colors.success)
                            .addFields(
                                {
                                    name: 'Slash Commands',
                                    value: `${client.slash.size} commands loaded`,
                                    inline: true
                                },
                                {
                                    name: 'Private Commands',
                                    value: `${client.private.size} commands loaded`,
                                    inline: true
                                },
                                {
                                    name: 'Context Commands',
                                    value: `${client.context.size} commands loaded`,
                                    inline: true
                                }
                            )
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })

                        await interaction.editReply({ embeds: [embed] })
                    } catch (error) {
                        console.error('Error reloading commands:', error)

                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('❌ Reload Failed')
                            .setDescription(`Failed to reload commands: ${error.message}`)
                            .setColor(client.colors.error)
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })

                        await interaction.editReply({ embeds: [embed] })
                    }
                    break
                }

                case 'sync': {
                    try {
                        // Redeploy commands to Discord
                        await deploy(client)

                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('🔄 Commands Synced')
                            .setDescription('Successfully synced all commands with Discord!')
                            .setColor(client.colors.success)
                            .addFields(
                                {
                                    name: 'Global Commands',
                                    value: `${client.slash.size} slash commands deployed`,
                                    inline: true
                                },
                                {
                                    name: 'Guild Commands',
                                    value: `${client.private.size} private commands deployed`,
                                    inline: true
                                },
                                {
                                    name: 'Status',
                                    value: '✅ All commands are now live',
                                    inline: false
                                }
                            )
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })

                        await interaction.editReply({ embeds: [embed] })
                    } catch (error) {
                        console.error('Error syncing commands:', error)

                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('❌ Sync Failed')
                            .setDescription(`Failed to sync commands: ${error.message}`)
                            .setColor(client.colors.error)
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })

                        await interaction.editReply({ embeds: [embed] })
                    }
                    break
                }

                case 'restart': {
                    try {
                        // First reload commands
                        client.slash.clear()
                        client.private.clear()
                        client.context.clear()
                        await commands(client)

                        // Then sync with Discord
                        await deploy(client)

                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('🔄 Bot Restarted')
                            .setDescription('Successfully reloaded and synced all commands!')
                            .setColor(client.colors.success)
                            .addFields(
                                {
                                    name: '📁 Filesystem Reload',
                                    value: `✅ ${client.slash.size + client.private.size} commands reloaded`,
                                    inline: true
                                },
                                {
                                    name: '🌐 Discord Sync',
                                    value: '✅ Commands deployed to Discord',
                                    inline: true
                                },
                                {
                                    name: '⚡ Performance',
                                    value: `Ready in ${Math.round(client.uptime / 1000)}s`,
                                    inline: true
                                }
                            )
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })

                        await interaction.editReply({ embeds: [embed] })
                    } catch (error) {
                        console.error('Error restarting bot:', error)

                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('❌ Restart Failed')
                            .setDescription(`Failed to restart bot: ${error.message}`)
                            .setColor(client.colors.error)
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })

                        await interaction.editReply({ embeds: [embed] })
                    }
                    break
                }

                case 'status': {
                    try {
                        // Get memory usage
                        const memUsage = process.memoryUsage()
                        const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024)

                        // Get command categories
                        const categories = [...new Set(client.slash.map(cmd => cmd.structure.category))]
                        const categoryStats = categories
                            .map(cat => {
                                const count = client.slash.filter(cmd => cmd.structure.category === cat).size
                                return `• ${cat}: ${count}`
                            })
                            .join('\n')

                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('🤖 Bot System Status')
                            .setDescription('Current bot status and command information')
                            .setColor(client.colors.primary)
                            .addFields(
                                {
                                    name: '📊 Command Stats',
                                    value: [
                                        `**Total Slash:** ${client.slash.size}`,
                                        `**Private Commands:** ${client.private.size}`,
                                        `**Context Commands:** ${client.context.size}`,
                                        `**Total Loaded:** ${client.slash.size + client.private.size + client.context.size}`
                                    ].join('\n'),
                                    inline: true
                                },
                                {
                                    name: '⚡ Performance',
                                    value: [
                                        `**Uptime:** ${Math.round(client.uptime / 1000)}s`,
                                        `**Memory:** ${memUsageMB}MB`,
                                        `**Guilds:** ${client.guilds.cache.size}`,
                                        `**Users:** ${client.users.cache.size}`
                                    ].join('\n'),
                                    inline: true
                                },
                                {
                                    name: '📂 Command Categories',
                                    value: categoryStats || 'No categories found',
                                    inline: false
                                }
                            )
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })

                        await interaction.editReply({ embeds: [embed] })
                    } catch (error) {
                        console.error('Error getting status:', error)

                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('❌ Status Error')
                            .setDescription(`Failed to get status: ${error.message}`)
                            .setColor(client.colors.error)
                            .setThumbnail(client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: client.logo
                            })

                        await interaction.editReply({ embeds: [embed] })
                    }
                    break
                }

                default: {
                    return interaction.editReply({
                        embeds: [
                            new client.Gateway.EmbedBuilder()
                                .setTitle('Unknown Subcommand')
                                .setDescription('Please use a valid subcommand.')
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
            }
        } catch (error) {
            console.error('Error in owner command:', error)
            await interaction.editReply({
                embeds: [
                    new client.Gateway.EmbedBuilder()
                        .setTitle('Error')
                        .setDescription('An error occurred while executing the owner command.')
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
