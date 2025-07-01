import { PermissionFlagsBits, ChannelType } from 'discord.js'

export default {
    structure: {
        name: 'guildsettings',
        description: 'View or update guild settings',
        handlers: {
            requiredRoles: [],
            requiredPerms: [PermissionFlagsBits.Administrator, PermissionFlagsBits.ManageGuild],
            cooldown: 15000
        },
        options: [
            {
                name: 'view',
                type: 1, // SUB_COMMAND
                description: 'View current guild settings',
                options: []
            },
            {
                name: 'channels',
                type: 1, // SUB_COMMAND
                description: 'Configure channel settings',
                options: [
                    {
                        name: 'mod_alert_channel',
                        description: 'Channel for crisis alerts and serious moderation events',
                        type: 7, // CHANNEL
                        required: false,
                        channel_types: [ChannelType.GuildText]
                    },
                    {
                        name: 'mod_log_channel',
                        description: 'Channel for moderation logs',
                        type: 7, // CHANNEL
                        required: false,
                        channel_types: [ChannelType.GuildText]
                    },
                    {
                        name: 'checkin_channel',
                        description: 'Channel for check-in logs',
                        type: 7, // CHANNEL
                        required: false,
                        channel_types: [ChannelType.GuildText]
                    },
                    {
                        name: 'coping_tool_log',
                        description: 'Channel for coping tool usage logs',
                        type: 7, // CHANNEL
                        required: false,
                        channel_types: [ChannelType.GuildText]
                    },
                    {
                        name: 'system_channel',
                        description: 'System notifications channel',
                        type: 7, // CHANNEL
                        required: false,
                        channel_types: [ChannelType.GuildText]
                    },
                    {
                        name: 'audit_log_channel',
                        description: 'Audit log channel',
                        type: 7, // CHANNEL
                        required: false,
                        channel_types: [ChannelType.GuildText]
                    }
                ]
            },
            {
                name: 'features',
                type: 1, // SUB_COMMAND
                description: 'Enable or disable bot features',
                options: [
                    {
                        name: 'check_ins',
                        description: 'Enable mood check-ins',
                        type: 5, // BOOLEAN
                        required: false
                    },
                    {
                        name: 'ghost_letters',
                        description: 'Enable ghost letter feature',
                        type: 5, // BOOLEAN
                        required: false
                    },
                    {
                        name: 'crisis_alerts',
                        description: 'Enable crisis detection and alerts',
                        type: 5, // BOOLEAN
                        required: false
                    },
                    {
                        name: 'system_logs',
                        description: 'Enable system logging',
                        type: 5, // BOOLEAN
                        required: false
                    },
                    {
                        name: 'context_logging',
                        description: 'Allow AI to use server messages for conversation context',
                        type: 5, // BOOLEAN
                        required: false
                    }
                ]
            },
            {
                name: 'moderation',
                type: 1, // SUB_COMMAND
                description: 'Configure auto-moderation settings',
                options: [
                    {
                        name: 'auto_mod_enabled',
                        description: 'Enable auto-moderation',
                        type: 5, // BOOLEAN
                        required: false
                    },
                    {
                        name: 'auto_mod_level',
                        description: 'Auto-moderation sensitivity level',
                        type: 4, // INTEGER
                        required: false,
                        choices: [
                            { name: '1 - Very Lenient (High tolerance)', value: 1 },
                            { name: '2 - Lenient (Relaxed moderation)', value: 2 },
                            { name: '3 - Moderate (Balanced - Default)', value: 3 },
                            { name: '4 - Strict (Active moderation)', value: 4 },
                            { name: '5 - Very Strict (Zero tolerance)', value: 5 }
                        ]
                    },
                    {
                        name: 'moderator_role',
                        description: 'Designated moderator role',
                        type: 8, // ROLE
                        required: false
                    },
                    {
                        name: 'system_role',
                        description: 'Role automatically assigned to new members when they join',
                        type: 8, // ROLE
                        required: false
                    }
                ]
            },
            {
                name: 'general',
                type: 1, // SUB_COMMAND
                description: 'General guild settings',
                options: [
                    {
                        name: 'language',
                        description: 'Default language for the server',
                        type: 3, // STRING
                        required: false,
                        choices: [
                            { name: 'English', value: 'en' },
                            { name: 'Spanish', value: 'es' },
                            { name: 'French', value: 'fr' },
                            { name: 'German', value: 'de' }
                        ]
                    }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand()
        const guildId = interaction.guild.id

        try {
            switch (subcommand) {
                case 'view': {
                    const guild = await client.db.guilds.findById(guildId)

                    if (!guild) {
                        return interaction.reply({
                            content: '❌ Guild not found in database. Please contact an administrator.',
                            ephemeral: true
                        })
                    }

                    // Debug: Log the actual guild object
                    console.log(
                        'Guild data:',
                        JSON.stringify(guild, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)
                    )

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle(`🔧 Guild Settings for ${interaction.guild.name}`)
                        .setColor(client.colors.primary)
                        .setThumbnail(interaction.guild.iconURL())
                        .addFields(
                            {
                                name: '📺 Channels',
                                value: [
                                    `**Crisis & Mod Alerts:** ${guild.modAlertChannelId ? `<#${guild.modAlertChannelId}>` : 'Not set'}`,
                                    `**Moderation Logs:** ${guild.modLogChannelId ? `<#${guild.modLogChannelId}>` : 'Not set'}`,
                                    `**Check-ins:** ${guild.checkInChannelId ? `<#${guild.checkInChannelId}>` : 'Not set'}`,
                                    `**Coping Logs:** ${guild.copingToolLogId ? `<#${guild.copingToolLogId}>` : 'Not set'}`,
                                    `**System:** ${guild.systemChannelId ? `<#${guild.systemChannelId}>` : 'Not set'}`,
                                    `**Audit Logs:** ${guild.auditLogChannelId ? `<#${guild.auditLogChannelId}>` : 'Not set'}`
                                ].join('\n'),
                                inline: false
                            },
                            {
                                name: '🎛️ Features',
                                value: [
                                    `**Check-ins:** ${guild.enableCheckIns ? '✅' : '❌'}`,
                                    `**Ghost Letters:** ${guild.enableGhostLetters ? '✅' : '❌'}`,
                                    `**Crisis Alerts:** ${guild.enableCrisisAlerts ? '✅' : '❌'}`,
                                    `**System Logs:** ${guild.systemLogsEnabled ? '✅' : '❌'}`,
                                    `**Context Logging:** ${!guild.disableContextLogging ? '✅' : '❌'}`
                                ].join('\n'),
                                inline: true
                            },
                            {
                                name: '🛡️ Moderation',
                                value: [
                                    `**Auto-Mod:** ${guild.autoModEnabled ? '✅' : '❌'}`,
                                    `**Auto-Mod Level:** ${guild.autoModLevel ? `${guild.autoModLevel}/5` : 'Not set'}`,
                                    `**Moderator Role:** ${guild.moderatorRoleId ? `<@&${guild.moderatorRoleId}>` : 'Not set'}`,
                                    `**Member Role:** ${guild.systemRoleId ? `<@&${guild.systemRoleId}>` : 'Not set'}`
                                ].join('\n'),
                                inline: true
                            },
                            {
                                name: '🌐 General',
                                value: [
                                    `**Language:** ${guild.language || 'en'}`,
                                    `**Joined:** <t:${Math.floor(guild.joinedAt.getTime() / 1000)}:R>`,
                                    `**Status:** ${guild.isBanned ? '🚫 Banned' : '✅ Active'}`
                                ].join('\n'),
                                inline: false
                            }
                        )
                        .setFooter({ text: client.footer, iconURL: client.logo })
                        .setTimestamp()

                    return interaction.reply({ embeds: [embed] })
                }

                case 'channels': {
                    const updates = {}
                    let changes = []

                    const channelOptions = [
                        { option: 'mod_alert_channel', field: 'modAlertChannelId', name: 'Crisis & Mod Alert Channel' },
                        { option: 'mod_log_channel', field: 'modLogChannelId', name: 'Moderation Log Channel' },
                        { option: 'checkin_channel', field: 'checkInChannelId', name: 'Check-in Channel' },
                        { option: 'coping_tool_log', field: 'copingToolLogId', name: 'Coping Tool Log' },
                        { option: 'system_channel', field: 'systemChannelId', name: 'System Channel' },
                        { option: 'audit_log_channel', field: 'auditLogChannelId', name: 'Audit Log Channel' }
                    ]

                    for (const { option, field, name } of channelOptions) {
                        const channel = interaction.options.getChannel(option)
                        if (channel) {
                            updates[field] = channel.id
                            changes.push(`**${name}:** <#${channel.id}>`)
                        }
                    }

                    if (changes.length === 0) {
                        return interaction.reply({
                            content: '❌ No channel settings provided to update.',
                            ephemeral: true
                        })
                    }

                    // Debug: Log what we're trying to save
                    console.log('Updating guild with:', updates)

                    await client.db.guilds.upsert(guildId, {
                        name: interaction.guild.name,
                        ownerId: interaction.guild.ownerId
                    })

                    // Log guild settings update
                    if (client.systemLogger) {
                        await client.systemLogger.logGuildSettingsUpdate(
                            guildId,
                            interaction.guild.name,
                            updates,
                            interaction.user.id
                        )
                    }

                    return interaction.reply({
                        content: `✅ **Channel settings updated:**\n${changes.join('\n')}`
                    })
                }

                case 'features': {
                    const updates = {}
                    let changes = []

                    const featureOptions = [
                        { option: 'check_ins', field: 'enableCheckIns', name: 'Check-ins' },
                        { option: 'ghost_letters', field: 'enableGhostLetters', name: 'Ghost Letters' },
                        { option: 'crisis_alerts', field: 'enableCrisisAlerts', name: 'Crisis Alerts' },
                        { option: 'system_logs', field: 'systemLogsEnabled', name: 'System Logs' },
                        {
                            option: 'context_logging',
                            field: 'disableContextLogging',
                            name: 'Context Logging',
                            inverted: true
                        }
                    ]

                    for (const { option, field, name, inverted } of featureOptions) {
                        const value = interaction.options.getBoolean(option)
                        if (value !== null) {
                            updates[field] = inverted ? !value : value // Handle inverted logic
                            changes.push(`**${name}:** ${value ? '✅ Enabled' : '❌ Disabled'}`)
                        }
                    }

                    if (changes.length === 0) {
                        return interaction.reply({
                            content: '❌ No feature settings provided to update.',
                            ephemeral: true
                        })
                    }

                    // Include required fields for potential creation
                    const updateData = {
                        ...updates,
                        name: interaction.guild.name,
                        ownerId: interaction.guild.ownerId
                    }

                    await client.db.guilds.upsert(guildId, {
                        ...updates,
                        name: interaction.guild.name,
                        ownerId: interaction.guild.ownerId
                    })

                    // Log guild settings update
                    if (client.systemLogger) {
                        await client.systemLogger.logGuildSettingsUpdate(
                            guildId,
                            interaction.guild.name,
                            updates,
                            interaction.user.id
                        )
                    }

                    return interaction.reply({
                        content: `✅ **Feature settings updated:**\n${changes.join('\n')}`
                    })
                }

                case 'moderation': {
                    const updates = {}
                    let changes = []

                    const autoModEnabled = interaction.options.getBoolean('auto_mod_enabled')
                    const autoModLevel = interaction.options.getInteger('auto_mod_level')
                    const moderatorRole = interaction.options.getRole('moderator_role')
                    const systemRole = interaction.options.getRole('system_role')

                    if (autoModEnabled !== null) {
                        updates.autoModEnabled = autoModEnabled
                        changes.push(`**Auto-Moderation:** ${autoModEnabled ? '✅ Enabled' : '❌ Disabled'}`)
                    }

                    if (autoModLevel !== null) {
                        updates.autoModLevel = autoModLevel
                        changes.push(`**Auto-Mod Level:** ${autoModLevel}/5`)
                    }

                    if (moderatorRole) {
                        updates.moderatorRoleId = moderatorRole.id
                        changes.push(`**Moderator Role:** <@&${moderatorRole.id}>`)
                    }

                    if (systemRole) {
                        updates.systemRoleId = systemRole.id
                        changes.push(`**Member Role:** <@&${systemRole.id}>`)
                    }

                    if (changes.length === 0) {
                        return interaction.reply({
                            content: '❌ No moderation settings provided to update.',
                            ephemeral: true
                        })
                    }

                    // Include required fields for potential creation
                    const updateData = {
                        ...updates,
                        name: interaction.guild.name,
                        ownerId: interaction.guild.ownerId
                    }

                    await client.db.guilds.upsert(guildId, {
                        ...updates,
                        name: interaction.guild.name,
                        ownerId: interaction.guild.ownerId
                    })

                    // Log guild settings update
                    if (client.systemLogger) {
                        await client.systemLogger.logGuildSettingsUpdate(
                            guildId,
                            interaction.guild.name,
                            updates,
                            interaction.user.id
                        )
                    }

                    return interaction.reply({
                        content: `✅ **Moderation settings updated:**\n${changes.join('\n')}`
                    })
                }

                case 'general': {
                    const updates = {}
                    let changes = []

                    const language = interaction.options.getString('language')

                    if (language) {
                        updates.language = language
                        const languageNames = { en: 'English', es: 'Spanish', fr: 'French', de: 'German' }
                        changes.push(`**Language:** ${languageNames[language] || language}`)
                    }

                    if (changes.length === 0) {
                        return interaction.reply({
                            content: '❌ No general settings provided to update.',
                            ephemeral: true
                        })
                    }

                    // Include required fields for potential creation
                    const updateData = {
                        ...updates,
                        name: interaction.guild.name,
                        ownerId: interaction.guild.ownerId
                    }

                    await client.db.guilds.upsert(guildId, {
                        ...updates,
                        name: interaction.guild.name,
                        ownerId: interaction.guild.ownerId
                    })

                    // Log guild settings update
                    if (client.systemLogger) {
                        await client.systemLogger.logGuildSettingsUpdate(
                            guildId,
                            interaction.guild.name,
                            updates,
                            interaction.user.id
                        )
                    }

                    return interaction.reply({
                        content: `✅ **General settings updated:**\n${changes.join('\n')}`
                    })
                }

                default:
                    return interaction.reply({
                        content: '❌ Unknown subcommand.',
                        ephemeral: true
                    })
            }
        } catch (error) {
            console.error('Failed to update guild settings:', error)
            return interaction.reply({
                content: '❌ Failed to update guild settings. Please try again later.',
                ephemeral: true
            })
        }
    }
}
