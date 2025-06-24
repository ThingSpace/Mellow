const BOT_OWNERS = ['510065483693817867', '896951964234043413']

export default {
    structure: {
        name: 'user',
        category: 'User',
        description: 'Admin/mod tools for managing users.',
        handlers: {
            requiredRoles: ['ADMIN', 'MOD']
        },
        options: [
            { type: 1, name: 'list', description: 'List users', options: [] },
            {
                type: 1,
                name: 'info',
                description: 'View info about a user',
                options: [{ name: 'user', description: 'User ID', required: true, type: 3 }]
            },
            {
                type: 1,
                name: 'ban',
                description: 'Ban a user',
                options: [
                    { name: 'user', description: 'User ID', required: true, type: 3 },
                    { name: 'reason', description: 'Reason', required: false, type: 3 }
                ]
            },
            {
                type: 1,
                name: 'unban',
                description: 'Unban a user',
                options: [{ name: 'user', description: 'User ID', required: true, type: 3 }]
            },
            {
                type: 1,
                name: 'promote',
                description: 'Promote user to MOD or ADMIN',
                options: [
                    { name: 'user', description: 'User ID', required: true, type: 3 },
                    {
                        name: 'role',
                        description: 'Role',
                        required: true,
                        type: 3,
                        choices: [
                            { name: 'MOD', value: 'MOD' },
                            { name: 'ADMIN', value: 'ADMIN' }
                        ]
                    }
                ]
            },
            {
                type: 1,
                name: 'demote',
                description: 'Demote user to USER',
                options: [{ name: 'user', description: 'User ID', required: true, type: 3 }]
            },
            {
                type: 1,
                name: 'addadmin',
                description: 'Add ADMIN user (bot owner only)',
                options: [{ name: 'user', description: 'User ID', required: true, type: 3 }]
            },
            {
                type: 1,
                name: 'removeadmin',
                description: 'Remove ADMIN user (bot owner only)',
                options: [{ name: 'user', description: 'User ID', required: true, type: 3 }]
            }
        ]
    },
    run: async (client, interaction) => {
        const sub = interaction.options.getSubcommand()
        const userId = interaction.user.id
        const user = await client.db.users.findById(BigInt(userId))
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MOD')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true })
        }
        if (['addadmin', 'removeadmin'].includes(sub) && !BOT_OWNERS.includes(userId)) {
            return interaction.reply({ content: 'Only bot owners can add or remove admin users.', ephemeral: true })
        }
        if (sub === 'list') {
            const users = await client.db.prisma.user.findMany({ take: 20, orderBy: { createdAt: 'desc' } })
            if (!users.length) {
                return interaction.reply({ content: 'No users found.', ephemeral: true })
            }
            const lines = users.map(u => `• ${u.username} (ID: ${u.id}) [${u.role}]${u.isBanned ? ' [BANNED]' : ''}`)
            return interaction.reply({ content: `Users:\n${lines.join('\n')}`, ephemeral: true })
        }
        const targetId = interaction.options.getInteger('user')
        if (sub === 'info') {
            const u = await client.db.users.findById(BigInt(targetId))
            if (!u) {
                return interaction.reply({ content: 'User not found.', ephemeral: true })
            }
            return interaction.reply({
                content: `User: ${u.username}\nID: ${u.id}\nRole: ${u.role}\nBanned: ${u.isBanned ? 'Yes' : 'No'}\nBan Reason: ${u.banReason || 'None'}`,
                ephemeral: true
            })
        }
        if (sub === 'ban') {
            const reason = interaction.options.getString('reason') || 'No reason provided.'
            await client.db.users.ban(BigInt(targetId), reason)
            return interaction.reply({ content: `User ${targetId} has been banned.`, ephemeral: true })
        }
        if (sub === 'unban') {
            await client.db.users.unban(BigInt(targetId))
            return interaction.reply({ content: `User ${targetId} has been unbanned.`, ephemeral: true })
        }
        if (sub === 'promote') {
            const role = interaction.options.getString('role')
            await client.db.prisma.user.update({ where: { id: BigInt(targetId) }, data: { role } })
            return interaction.reply({ content: `User ${targetId} has been promoted to ${role}.`, ephemeral: true })
        }
        if (sub === 'demote') {
            await client.db.prisma.user.update({ where: { id: BigInt(targetId) }, data: { role: 'USER' } })
            return interaction.reply({ content: `User ${targetId} has been demoted to USER.`, ephemeral: true })
        }
        if (sub === 'addadmin') {
            await client.db.prisma.user.update({ where: { id: BigInt(targetId) }, data: { role: 'ADMIN' } })
            return interaction.reply({ content: `User ${targetId} has been granted ADMIN role.`, ephemeral: true })
        }
        if (sub === 'removeadmin') {
            await client.db.prisma.user.update({ where: { id: BigInt(targetId) }, data: { role: 'USER' } })
            return interaction.reply({ content: `User ${targetId} has been removed from ADMIN role.`, ephemeral: true })
        }
    }
}
