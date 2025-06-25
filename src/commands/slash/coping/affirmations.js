import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'affirmations',
        category: 'Coping',
        description: 'Receive a positive affirmation to brighten your day.',
        handlers: {
            cooldown: 15000,
            requiredPerms: [],
            requiredRoles: []
        },
        options: [
            {
                name: 'feeling',
                description: `Describe how you're feeling (optional)`,
                required: false,
                type: cmdTypes.STRING
            },
            {
                name: 'private',
                description: 'Should this be private? (default: yes)',
                required: false,
                type: cmdTypes.BOOLEAN
            }
        ]
    },
    run: async (client, interaction) => {
        const feeling = interaction.options.getString('feeling') ?? null
        const isPrivate = interaction.options.getBoolean('private') ?? true

        await interaction.deferReply({ ephemeral: isPrivate })

        const userId = BigInt(interaction.user.id)

        const affirmation = await client.ai.getCopingResponse({
            tool: 'affirmations',
            feeling,
            userId
        })

        return interaction.editReply({
            content: affirmation,
            ephemeral: false
        })
    }
}
