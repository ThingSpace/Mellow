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
                name: 'mute',
                description: 'Mute a user (10 min timeout)',
                options: [
                    {
                        name: 'user',
                        description: 'User to mute',
                        required: true,
                        type: cmdTypes.USER
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
                type: 1,
                name: 'logs',
                description: 'Show recent moderation actions',
                options: []
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

        switch (sub) {
            case 'mute': {
                const user = interaction.options.getUser('user')
                const member = await guild.members.fetch(user.id).catch(() => null)
                if (!member) {
                    return interaction.reply({ content: 'User not found in this server.', ephemeral: true })
                }
                await member.timeout(10 * 60 * 1000, 'Muted by mod command')
                await client.db.modActions.log({
                    guildId: BigInt(guildId),
                    moderatorId: BigInt(moderatorId),
                    targetUserId: BigInt(user.id),
                    action: 'mute',
                    reason: '10 min timeout'
                })
                return interaction.reply({ content: `${user.tag} has been muted for 10 minutes.` })
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
                return interaction.reply({ content: `Role ${role.name} removed from ${user.tag}.` })
            }
            case 'logs': {
                const actions = await client.db.modActions.getRecentForGuild(guildId, 10)
                if (!actions.length) {
                    return interaction.reply({ content: 'No moderation actions found for this server.' })
                }
                const lines = actions.map(
                    a =>
                        `• <t:${Math.floor(new Date(a.createdAt).getTime() / 1000)}:R> [${a.action}] <@${a.targetUserId}> by <@${a.moderatorId}>${a.reason ? ` — ${a.reason}` : ''}${a.roleId ? ` (role: <@&${a.roleId}>)` : ''}`
                )
                return interaction.reply({ content: `Recent moderation actions:\n${lines.join('\n')}` })
            }
            default: {
                return interaction.reply({ content: 'Unknown moderation subcommand.', ephemeral: true })
            }
        }
    }
}
