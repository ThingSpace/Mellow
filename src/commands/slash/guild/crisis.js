import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'crisis',
        category: 'Guild',
        description: 'Configure crisis management settings for this server.',
        handlers: {
            cooldown: 30000,
            requiredPerms: ['ManageGuild'],
            requiredRoles: []
        },
        options: [
            {
                name: 'view',
                type: cmdTypes.SUB_COMMAND,
                description: 'View current crisis management settings',
                options: []
            },
            {
                name: 'alerts',
                type: cmdTypes.SUB_COMMAND,
                description: 'Configure crisis alert settings',
                options: [
                    {
                        name: 'enabled',
                        description: 'Enable or disable crisis alerts',
                        required: false,
                        type: cmdTypes.BOOLEAN
                    },
                    {
                        name: 'channel',
                        description: 'Channel for crisis alerts (use #channel)',
                        required: false,
                        type: cmdTypes.CHANNEL
                    }
                ]
            },
            {
                name: 'moderator',
                type: cmdTypes.SUB_COMMAND,
                description: 'Set moderator role for crisis management',
                options: [
                    {
                        name: 'role',
                        description: 'Role that can manage crisis situations',
                        required: true,
                        type: cmdTypes.ROLE
                    }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand()
        const guildId = interaction.guildId

        switch (subcommand) {
            case 'view': {
                const guild = await client.db.guilds.findById(guildId)

                if (!guild) {
                    return interaction.reply({
                        content: '❌ Guild settings not found. Please contact support.',
                        ephemeral: true
                    })
                }

                const embed = {
                    title: '⚙️ Crisis Management Settings',
                    description: `Settings for **${interaction.guild.name}**`,
                    color: 0x0099ff,
                    fields: [
                        {
                            name: '🚨 Crisis Alerts',
                            value: guild.enableCrisisAlerts ? '✅ Enabled' : '❌ Disabled',
                            inline: true
                        },
                        {
                            name: '📢 Alert Channel',
                            value: guild.modAlertChannelId ? `<#${guild.modAlertChannelId}>` : 'Not configured',
                            inline: true
                        },
                        {
                            name: '👮 Moderator Role',
                            value: guild.moderatorRoleId ? `<@&${guild.moderatorRoleId}>` : 'Not configured',
                            inline: true
                        }
                    ],
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: 'Use /guild crisis alerts or /guild crisis moderator to configure'
                    }
                }

                return interaction.reply({ embeds: [embed], ephemeral: true })
            }

            case 'alerts': {
                const enabled = interaction.options.getBoolean('enabled')
                const channel = interaction.options.getChannel('channel')

                const updateData = {}

                if (enabled !== null) {
                    updateData.enableCrisisAlerts = enabled
                }

                if (channel) {
                    updateData.modAlertChannelId = channel.id
                }

                if (Object.keys(updateData).length === 0) {
                    return interaction.reply({
                        content: '❌ Please specify at least one setting to update.',
                        ephemeral: true
                    })
                }

                try {
                    await client.db.guilds.upsert(guildId, updateData)

                    const embed = {
                        title: '✅ Crisis Alert Settings Updated',
                        description: 'Your crisis alert settings have been updated successfully.',
                        color: 0x00ff00,
                        fields: []
                    }

                    if (enabled !== null) {
                        embed.fields.push({
                            name: '🚨 Crisis Alerts',
                            value: enabled ? '✅ Enabled' : '❌ Disabled',
                            inline: true
                        })
                    }

                    if (channel) {
                        embed.fields.push({
                            name: '📢 Alert Channel',
                            value: `<#${channel.id}>`,
                            inline: true
                        })
                    }

                    embed.timestamp = new Date().toISOString()

                    return interaction.reply({ embeds: [embed], ephemeral: true })
                } catch (error) {
                    console.error('Error updating crisis alert settings:', error)
                    return interaction.reply({
                        content: '❌ Failed to update crisis alert settings.',
                        ephemeral: true
                    })
                }
            }

            case 'moderator': {
                const role = interaction.options.getRole('role')

                try {
                    await client.db.guilds.upsert(guildId, {
                        moderatorRoleId: role.id
                    })

                    const embed = {
                        title: '✅ Moderator Role Updated',
                        description: 'Crisis management moderator role has been updated successfully.',
                        color: 0x00ff00,
                        fields: [
                            {
                                name: '👮 Moderator Role',
                                value: `<@&${role.id}>`,
                                inline: true
                            }
                        ],
                        timestamp: new Date().toISOString(),
                        footer: {
                            text: 'Users with this role can now manage crisis situations'
                        }
                    }

                    return interaction.reply({ embeds: [embed], ephemeral: true })
                } catch (error) {
                    console.error('Error updating moderator role:', error)
                    return interaction.reply({
                        content: '❌ Failed to update moderator role.',
                        ephemeral: true
                    })
                }
            }

            default: {
                return interaction.reply({
                    content: 'Please choose a valid subcommand to continue!',
                    ephemeral: true
                })
            }
        }
    }
}
