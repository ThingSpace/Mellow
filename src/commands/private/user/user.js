import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'user',
        category: 'User',
        description: 'Admin/mod tools for managing users.',
        handlers: {
            requiredPerms: [],
            requiredRoles: ['ADMIN', 'MOD'],
            cooldown: 15000
        },
        options: [
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'list',
                description: 'List all STAFF users in our database',
                options: []
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'info',
                description: 'View info about a user',
                options: [
                    {
                        name: 'user',
                        description: 'The user you want to view info for!',
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
                        description: 'The user you want to ban',
                        required: true,
                        type: cmdTypes.USER
                    },
                    {
                        name: 'reason',
                        description: 'Reason',
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
                        description: 'The user you want to unban',
                        required: true,
                        type: cmdTypes.USER
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'promote',
                description: 'Promote someone to MODERATOR',
                options: [
                    {
                        name: 'user',
                        description: 'The user you want to promote',
                        required: true,
                        type: cmdTypes.USER
                    },
                    {
                        name: 'role',
                        description: 'Role',
                        required: true,
                        type: cmdTypes.STRING,
                        choices: [
                            {
                                name: 'MOD',
                                value: 'MOD'
                            }
                        ]
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'demote',
                description: 'Demote someone to USER',
                options: [
                    {
                        name: 'user',
                        description: 'The user you want to demote',
                        required: true,
                        type: cmdTypes.USER
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'addowner',
                description: 'Add OWNER user (bot owner only)',
                options: [
                    {
                        name: 'user',
                        description: 'User ID',
                        required: true,
                        type: cmdTypes.USER
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'removeowner',
                description: 'Remove OWNER user (bot owner only)',
                options: [
                    { name: 'user', description: 'User ID', required: true, type: cmdTypes.USER },
                    {
                        name: 'newrole',
                        description: 'The new position to assign',
                        required: false,
                        type: cmdTypes.STRING,
                        choices: [
                            { name: 'ADMIN', value: 'ADMIN' },
                            { name: 'MOD', value: 'MOD' },
                            { name: 'USER', value: 'USER' }
                        ]
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'addadmin',
                description: 'Add ADMIN user (bot owner only)',
                options: [
                    {
                        name: 'user',
                        description: 'The user you want to make an admin',
                        required: true,
                        type: cmdTypes.USER
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'removeadmin',
                description: 'Remove ADMIN user (bot owner only)',
                options: [
                    {
                        name: 'user',
                        description: 'The user you want to remove from admin',
                        required: true,
                        type: cmdTypes.USER
                    }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const sub = interaction.options.getSubcommand()
        const userId = interaction.user.id
        const user = await client.db.users.findById(BigInt(userId))

        if (['addowner', 'removeowner', 'addadmin', 'removeadmin'].includes(sub) && !['OWNER'].includes(user.role)) {
            return interaction.reply({
                content: 'Only bot owners can add or remove admin users.',
                ephemeral: true
            })
        }

        /** LIST ALL ADMINS/MODERATORS FOR MELLOW */
        if (sub === 'list') {
            const users = await client.db.prisma.user.findMany({
                take: 20,
                orderBy: {
                    createdAt: 'desc'
                }
            })

            if (!users.length) {
                return interaction.reply({
                    content: 'No users found.',
                    ephemeral: true
                })
            }

            const lines = users.map(u => `• ${u.username} (ID: ${u.id}) [${u.role}]${u.isBanned ? ' [BANNED]' : ''}`)

            return interaction.reply({
                content: `Users:\n${lines.join('\n')}`,
                ephemeral: true
            })
        }

        const targetId = interaction.options.getUser('user')

        /** VIEW INFORMATION FOR A ADMIN/MODERATOR */
        if (sub === 'info') {
            const u = await client.db.users.findById(BigInt(targetId))

            if (!u) {
                return interaction.reply({
                    content: 'User not found.',
                    ephemeral: true
                })
            }

            return interaction.reply({
                embeds: [
                    new client.Gateway.EmbedBuilder()
                        .setTitle('User Information')
                        .setColor(client.colors.primary)
                        .setDescription(`Here is everything i know about ${targetId.globalName}!`)
                        .addFields(
                            {
                                name: 'ID',
                                value: `${u.id}`,
                                inline: false
                            },
                            {
                                name: 'Username',
                                value: `${u.username}`,
                                inline: false
                            },
                            {
                                name: 'Role',
                                value: `${u.role}`,
                                inline: false
                            },
                            {
                                name: 'State',
                                value: `- Banned: ${u.isBanned ? 'Yes' : 'No'}\n- Ban Reason: ${u.banReason || 'None'}`,
                                inline: false
                            }
                        )
                        .setThumbnail(client.logo)
                        .setTimestamp()
                        .setFooter({
                            text: client.footer,
                            iconURL: client.logo
                        })
                ]
            })
        }

        /** BAN A USER FROM USING MELLOW */
        if (sub === 'ban') {
            const reason = interaction.options.getString('reason') || 'No reason provided.'

            await client.db.users.ban(BigInt(targetId), reason)

            return interaction.reply({
                content: `User ${targetId} has been banned.`,
                ephemeral: true
            })
        }

        /** RESTORE A USERS ACCESS TO MELLOW */
        if (sub === 'unban') {
            await client.db.users.unban(BigInt(targetId))

            return interaction.reply({
                content: `User ${targetId} has been unbanned.`,
                ephemeral: true
            })
        }

        /** PROMOTE A USER WITHIN THE MELLOW TEAM */
        if (sub === 'promote') {
            const role = interaction.options.getString('role')

            await client.db.prisma.user.update({ where: { id: BigInt(targetId) }, data: { role } })

            return interaction.reply({
                content: `User ${targetId} has been promoted to ${role}.`,
                ephemeral: true
            })
        }

        /** DEMOTE A USER WITHIN THE MELLOW TEAM */
        if (sub === 'demote') {
            await client.db.prisma.user.update({ where: { id: BigInt(targetId) }, data: { role: 'USER' } })

            return interaction.reply({
                content: `User ${targetId} has been demoted to USER.`,
                ephemeral: true
            })
        }

        /** ADD A MELLOW BOT OWNER */
        if (sub === 'addowner') {
            await client.db.prisma.user.update({ where: { id: BigInt(targetId) }, data: { role: 'OWNER' } })

            return interaction.reply({
                content: `User ${targetId} has been granted the owner role.`,
                ephemeral: true
            })
        }

        /** REMOVE A USER FROM MELLOW OWNERSHIP */
        if (sub === 'removeowner') {
            let role = interaction.options.getString('newrole')

            if (!role) role = 'USER'

            await client.db.prisma.user.update({ where: { id: BigInt(targetId) }, data: { role } })

            return interaction.reply({
                content: `User ${targetId} has been promoted to ${role}.`,
                ephemeral: true
            })
        }

        /** ADD A USER AS A MELLOW ADMIN */
        if (sub === 'addadmin') {
            await client.db.prisma.user.update({ where: { id: BigInt(targetId) }, data: { role: 'ADMIN' } })

            return interaction.reply({
                content: `User ${targetId} has been granted ADMIN role.`,
                ephemeral: true
            })
        }

        /** REMOVE A USER FROM MELLOW ADMIN */
        if (sub === 'removeadmin') {
            await client.db.prisma.user.update({ where: { id: BigInt(targetId) }, data: { role: 'USER' } })

            return interaction.reply({
                content: `User ${targetId} has been removed from ADMIN role.`,
                ephemeral: true
            })
        }
    }
}
