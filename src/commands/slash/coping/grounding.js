import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'grounding',
        category: 'Coping',
        description: 'Try a 5-4-3-2-1 grounding exercise.',
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
        const userId = BigInt(interaction.user.id)

        await interaction.deferReply({ ephemeral: isPrivate })

        const grounding = await client.ai.getCopingResponse({
            tool: 'grounding',
            feeling,
            userId
        })

        return interaction.editReply({ content: grounding })
    }
}
