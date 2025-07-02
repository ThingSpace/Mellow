import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'breathing',
        category: 'Coping',
        description: 'Start a guided breathing exercise.',
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

        const breathing = await client.ai.getCopingResponse({
            tool: 'breathing',
            feeling,
            userId
        })

        // Log breathing exercise usage
        if (client.systemLogger) {
            await client.systemLogger.logUserEvent(
                interaction.user.id,
                interaction.user.username,
                'breathing_exercise_used',
                'User started breathing exercise'
            )
        }

        return interaction.editReply({ content: breathing })
    }
}
