import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import { PermissionFlagsBits } from 'discord.js'

export default {
    structure: {
        name: 'mod',
        category: 'Moderation',
        description: 'Moderation tools for server staff.',
        handlers: {
            cooldown: 15000,
            requiredRoles: [],
            requiredPerms: [
                PermissionFlagsBits.Administrator,
                PermissionFlagsBits.ModerateMembers,
                PermissionFlagsBits.BanMembers,
                PermissionFlagsBits.KickMembers
            ]
        },
        options: [
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'timeout',
                description: "Timeout a user (using Discord's timeout feature)",
                options: [
                    {
                        name: 'user',
                        description: 'User to timeout',
                        required: true,
                        type: cmdTypes.USER
                    },
                    {
                        name: 'duration',
                        description: 'Timeout duration',
                        required: true,
                        type: cmdTypes.STRING,
                        choices: [
                            { name: '60 seconds', value: '60' },
                            { name: '5 minutes', value: '300' },
                            { name: '10 minutes', value: '600' },
                            { name: '1 hour', value: '3600' },
                            { name: '1 day', value: '86400' },
                            { name: '1 week', value: '604800' }
                        ]
                    },
                    {
                        name: 'reason',
                        description: 'Reason for timeout',
                        required: false,
                        type: cmdTypes.STRING
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'untimeout',
                description: 'Remove timeout from a user',
                options: [
                    {
                        name: 'user',
                        description: 'User to remove timeout from',
                        required: true,
                        type: cmdTypes.USER
                    },
                    {
                        name: 'reason',
                        description: 'Reason for removing timeout',
                        required: false,
                        type: cmdTypes.STRING
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'ban',
                description: 'Ban a user',
                options: [
                    {
                        name: 'user',
                        description: 'User to ban',
                        required: true,
                        type: cmdTypes.USER
                    },
                    {
                        name: 'reason',
                        description: 'Reason for ban',
                        required: false,
                        type: cmdTypes.STRING
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'unban',
                description: 'Unban a user',
                options: [
                    {
                        name: 'user',
                        description: 'User to unban',
                        required: true,
                        type: cmdTypes.USER
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'role',
                description: 'Assign or remove a role',
                options: [
                    {
                        name: 'user',
                        description: 'User',
                        required: true,
                        type: cmdTypes.USER
                    },
                    {
                        name: 'role',
                        description: 'Role',
                        required: true,
                        type: cmdTypes.ROLE
                    },
                    {
                        name: 'action',
                        description: 'Assign or remove',
                        required: true,
                        type: cmdTypes.STRING,
                        choices: [
                            { name: 'Assign', value: 'assign' },
                            { name: 'Remove', value: 'remove' }
                        ]
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'logs',
                description: 'Show recent moderation actions',
                options: [
                    {
                        name: 'user',
                        description: 'Show logs for specific user',
                        required: false,
                        type: cmdTypes.USER
                    },
                    {
                        name: 'limit',
                        description: 'Number of actions to show (max 20)',
                        required: false,
                        type: cmdTypes.INTEGER,
                        min_value: 1,
                        max_value: 20
                    }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const sub = interaction.options.getSubcommand()
        const guild = interaction.guild

        if (!guild) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true })
        }

        const moderatorId = interaction.user.id
        const guildId = guild.id

        // Get guild settings for logging
        const guildSettings = await client.db.guilds.findById(guildId)

        switch (sub) {
            case 'timeout': {
                const user = interaction.options.getUser('user')
                const duration = parseInt(interaction.options.getString('duration'))
                const reason = interaction.options.getString('reason') || 'No reason provided.'

                const member = await guild.members.fetch(user.id).catch(() => null)
                if (!member) {
                    return interaction.reply({ content: 'User not found in this server.', ephemeral: true })
                }

                try {
                    await member.timeout(duration * 1000, reason)

                    // Log to database
                    await client.db.modActions.log({
                        guildId: BigInt(guildId),
                        moderatorId: BigInt(moderatorId),
                        targetUserId: BigInt(user.id),
                        action: 'timeout',
                        reason: `${reason} (${duration}s)`
                    })

                    // Log to system logger
                    if (client.systemLogger) {
                        await client.systemLogger.logModerationAction(
                            'timeout',
                            user.id,
                            moderatorId,
                            guildId,
                            `${reason} (${duration}s)`
                        )
                    }

                    const durationText = formatDuration(duration)
                    return interaction.reply({
                        content: `✅ ${user.tag} has been timed out for ${durationText}.\n**Reason:** ${reason}`
                    })
                } catch (error) {
                    console.error('Failed to timeout user:', error)
                    return interaction.reply({
                        content: '❌ Failed to timeout user. They may have higher permissions or be the server owner.',
                        ephemeral: true
                    })
                }
            }

            case 'untimeout': {
                const user = interaction.options.getUser('user')
                const reason = interaction.options.getString('reason') || 'No reason provided.'

                const member = await guild.members.fetch(user.id).catch(() => null)
                if (!member) {
                    return interaction.reply({ content: 'User not found in this server.', ephemeral: true })
                }

                try {
                    await member.timeout(null, reason)

                    // Log to database
                    await client.db.modActions.log({
                        guildId: BigInt(guildId),
                        moderatorId: BigInt(moderatorId),
                        targetUserId: BigInt(user.id),
                        action: 'untimeout',
                        reason
                    })

                    // Log to system logger
                    if (client.systemLogger) {
                        await client.systemLogger.logModerationAction(
                            'untimeout',
                            user.id,
                            moderatorId,
                            guildId,
                            reason
                        )
                    }

                    return interaction.reply({
                        content: `✅ Timeout removed from ${user.tag}.\n**Reason:** ${reason}`
                    })
                } catch (error) {
                    console.error('Failed to remove timeout:', error)
                    return interaction.reply({
                        content: '❌ Failed to remove timeout from user.',
                        ephemeral: true
                    })
                }
            }
            case 'ban': {
                const user = interaction.options.getUser('user')
                const reason = interaction.options.getString('reason') || 'No reason provided.'
                await guild.members.ban(user.id, { reason })
                await client.db.modActions.log({
                    guildId: BigInt(guildId),
                    moderatorId: BigInt(moderatorId),
                    targetUserId: BigInt(user.id),
                    action: 'ban',
                    reason
                })

                // Log to system logger
                if (client.systemLogger) {
                    await client.systemLogger.logModerationAction('ban', user.id, moderatorId, guildId, reason)
                }

                return interaction.reply({ content: `${user.tag} has been banned. Reason: ${reason}` })
            }
            case 'unban': {
                const user = interaction.options.getUser('user')
                await guild.bans.remove(user.id)
                await client.db.modActions.log({
                    guildId: BigInt(guildId),
                    moderatorId: BigInt(moderatorId),
                    targetUserId: BigInt(user.id),
                    action: 'unban'
                })

                // Log to system logger
                if (client.systemLogger) {
                    await client.systemLogger.logModerationAction('unban', user.id, moderatorId, guildId)
                }

                return interaction.reply({ content: `${user.tag} has been unbanned.` })
            }
            case 'role': {
                const user = interaction.options.getUser('user')
                const role = interaction.options.getRole('role')
                const action = interaction.options.getString('action')
                const member = await guild.members.fetch(user.id).catch(() => null)
                if (!member) {
                    return interaction.reply({ content: 'User not found in this server.', ephemeral: true })
                }
                if (action === 'assign') {
                    await member.roles.add(role)
                    await client.db.modActions.log({
                        guildId: BigInt(guildId),
                        moderatorId: BigInt(moderatorId),
                        targetUserId: BigInt(user.id),
                        action: 'role-assign',
                        roleId: BigInt(role.id)
                    })

                    // Log to system logger
                    if (client.systemLogger) {
                        await client.systemLogger.logModerationAction(
                            'role-assign',
                            user.id,
                            moderatorId,
                            guildId,
                            `Role: ${role.name}`
                        )
                    }

                    return interaction.reply({ content: `Role ${role.name} assigned to ${user.tag}.` })
                }
                await member.roles.remove(role)
                await client.db.modActions.log({
                    guildId: BigInt(guildId),
                    moderatorId: BigInt(moderatorId),
                    targetUserId: BigInt(user.id),
                    action: 'role-remove',
                    roleId: BigInt(role.id)
                })

                // Log to system logger
                if (client.systemLogger) {
                    await client.systemLogger.logModerationAction(
                        'role-remove',
                        user.id,
                        moderatorId,
                        guildId,
                        `Role: ${role.name}`
                    )
                }

                return interaction.reply({ content: `Role ${role.name} removed from ${user.tag}.` })
            }
            case 'logs': {
                const targetUser = interaction.options.getUser('user')
                const limit = interaction.options.getInteger('limit') || 10

                let actions
                if (targetUser) {
                    // Get actions for specific user
                    actions = await client.db.modActions.findMany({
                        where: {
                            guildId: BigInt(guildId),
                            targetUserId: BigInt(targetUser.id)
                        },
                        orderBy: { createdAt: 'desc' },
                        take: limit
                    })
                } else {
                    // Get recent actions for guild
                    actions = await client.db.modActions.getRecentForGuild(guildId, limit)
                }

                if (!actions.length) {
                    const message = targetUser
                        ? `No moderation actions found for ${targetUser.tag} in this server.`
                        : 'No moderation actions found for this server.'
                    return interaction.reply({ content: message, ephemeral: true })
                }

                const title = targetUser ? `Moderation History for ${targetUser.tag}` : 'Recent Moderation Actions'

                const embed = new client.Gateway.EmbedBuilder()
                    .setTitle(title)
                    .setColor(client.colors.primary)
                    .setTimestamp()
                    .setFooter({ text: client.footer, iconURL: client.logo })

                const lines = actions.map(a => {
                    const timeStamp = `<t:${Math.floor(new Date(a.createdAt).getTime() / 1000)}:R>`
                    const action = a.action.toUpperCase()
                    const target = `<@${a.targetUserId}>`
                    const moderator = `<@${a.moderatorId}>`
                    const reason = a.reason ? ` — ${a.reason}` : ''
                    const role = a.roleId ? ` (role: <@&${a.roleId}>)` : ''

                    return `${timeStamp} **[${action}]** ${target} by ${moderator}${reason}${role}`
                })

                embed.setDescription(lines.join('\n'))

                return interaction.reply({ embeds: [embed], ephemeral: true })
            }
            default: {
                return interaction.reply({ content: 'Unknown moderation subcommand.', ephemeral: true })
            }
        }
    }
}

/**
 * Format duration in seconds to human readable format
 */
function formatDuration(seconds) {
    if (seconds < 60) return `${seconds} seconds`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days`
    return `${Math.floor(seconds / 604800)} weeks`
}

/**
 * Get color for moderation action
 */
function getActionColor(action, client) {
    switch (action) {
        case 'ban':
            return client.colors.error
        case 'kick':
        case 'timeout':
            return client.colors.warning
        case 'untimeout':
            return client.colors.success
        default:
            return client.colors.primary
    }
}
