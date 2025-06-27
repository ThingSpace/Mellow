import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'guild',
        category: 'Guild',
        description: 'Admin/mod tools for managing guilds.',
        handlers: {
            requiredRoles: ['ADMIN', 'MOD']
        },
        options: [
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'list',
                description: 'List all guilds',
                options: []
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'info',
                description: 'View info about a guild',
                options: [
                    {
                        name: 'guild',
                        description: 'Guild ID',
                        required: true,
                        type: cmdTypes.STRING
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'ban',
                description: 'Ban a guild',
                options: [
                    {
                        name: 'guild',
                        description: 'Guild ID',
                        required: true,
                        type: cmdTypes.STRING
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
                type: 1,
                name: 'unban',
                description: 'Unban a guild',
                options: [
                    {
                        name: 'guild',
                        description: 'Guild ID',
                        required: true,
                        type: 3
                    }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand()

        if (subcommand === 'list') {
            const guilds = await client.db.guilds.findMany({
                take: 20,
                orderBy: { joinedAt: 'desc' }
            })
            if (!guilds.length) {
                return interaction.reply({ content: 'No guilds found.', ephemeral: true })
            }
            const lines = guilds.map(g => `• ${g.name} (ID: ${g.id})${g.isBanned ? ' [BANNED]' : ''}`)
            return interaction.reply({ content: `Guilds:\n${lines.join('\n')}`, ephemeral: true })
        }

        if (subcommand === 'info') {
            const guildId = interaction.options.getString('guild')
            const g = await client.db.guilds.findById(guildId)
            if (!g) {
                return interaction.reply({ content: 'Guild not found.', ephemeral: true })
            }
            return interaction.reply({
                content: `Guild: ${g.name}\nID: ${g.id}\nOwner: ${g.ownerId}\nBanned: ${g.isBanned ? 'Yes' : 'No'}\nBan Reason: ${g.banReason || 'None'}`,
                ephemeral: true
            })
        }

        if (subcommand === 'ban') {
            const guildId = interaction.options.getString('guild')
            const reason = interaction.options.getString('reason') || 'No reason provided.'
            // Don't include name/ownerId when banning - preserve state = false
            await client.db.guilds.upsert(
                guildId,
                {
                    isBanned: true,
                    banReason: reason,
                    bannedUntil: null
                },
                false
            )
            return interaction.reply({ content: `Guild ${guildId} has been banned.`, ephemeral: true })
        }

        if (subcommand === 'unban') {
            const guildId = interaction.options.getString('guild')
            await client.db.guilds.upsert(
                guildId,
                {
                    isBanned: false,
                    banReason: null,
                    bannedUntil: null
                },
                false
            )
            return interaction.reply({ content: `Guild ${guildId} has been unbanned.`, ephemeral: true })
        }
    }
}
