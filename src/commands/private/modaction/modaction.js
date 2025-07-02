export default {
    structure: {
        name: 'modaction',
        category: 'ModAction',
        description: 'Admin/mod tools for viewing moderation logs.',
        handlers: {
            requiredRoles: ['ADMIN', 'MOD', 'SUPPORT']
        },
        options: [
            {
                type: 1,
                name: 'logs',
                description: 'View moderation logs for a guild',
                options: [{ name: 'guild', description: 'Guild ID', required: true, type: 3 }]
            }
        ]
    },
    run: async (client, interaction) => {
        const sub = interaction.options.getSubcommand()
        const userId = interaction.user.id
        const user = await client.db.users.findById(BigInt(userId))

        switch (sub) {
            case 'logs': {
                const guildId = interaction.options.getString('guild')
                const actions = await client.db.modActions.getRecentForGuild(BigInt(guildId), 20)
                if (!actions.length) {
                    return interaction.reply({
                        content: 'No moderation actions found for this guild.',
                        ephemeral: true
                    })
                }
                const lines = actions.map(
                    a =>
                        `• <t:${Math.floor(new Date(a.createdAt).getTime() / 1000)}:R> [${a.action}] <@${a.targetUserId}> by <@${a.moderatorId}>${a.reason ? ` — ${a.reason}` : ''}${a.roleId ? ` (role: <@&${a.roleId}>)` : ''}`
                )
                return interaction.reply({
                    content: `Recent moderation actions for guild ${guildId}:\n${lines.join('\n')}`,
                    ephemeral: true
                })
            }
            default:
                return interaction.reply({ content: 'Unknown subcommand.', ephemeral: true })
        }
    }
}
