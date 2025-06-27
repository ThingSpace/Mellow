import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'challenge',
        category: 'Coping',
        description: 'Get a daily self-care or coping challenge.',
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

        const challenge = await client.ai.getCopingResponse({
            tool: 'challenge',
            feeling,
            userId
        })

        // Log challenge usage
        if (client.systemLogger) {
            await client.systemLogger.logUserEvent(
                interaction.user.id,
                interaction.user.username,
                'coping_challenge_used',
                'User requested a coping challenge'
            )
        }

        return interaction.editReply({ content: challenge })
    }
}
