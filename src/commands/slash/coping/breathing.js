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

        try {
            const breathing = await client.ai.getCopingResponse({
                tool: 'breathing',
                feeling,
                userId,
                context: {
                    guildId: interaction.guildId,
                    channelId: interaction.channelId
                }
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
        } catch (aiError) {
            console.error('AI breathing response failed:', aiError)

            // Log the error
            if (client.systemLogger) {
                await client.systemLogger.logError(
                    'AI_COPING_ERROR',
                    'Failed to generate AI breathing response: ' + aiError.message,
                    {
                        userId: interaction.user.id,
                        command: 'breathing',
                        feeling,
                        error: aiError.stack
                    }
                )
            }

            // Fallback breathing exercise
            const fallbackBreathing = feeling
                ? `I understand you're feeling **${feeling}**. Let's try this breathing exercise:\n\n` +
                  `🌬️ **4-7-8 Breathing Technique:**\n` +
                  `1. Exhale completely through your mouth\n` +
                  `2. Close your mouth and inhale through your nose for 4 counts\n` +
                  `3. Hold your breath for 7 counts\n` +
                  `4. Exhale completely through your mouth for 8 counts\n` +
                  `5. Repeat 3-4 times\n\n` +
                  `Focus on the counting and let your body relax with each exhale. You've got this! 💙`
                : `Let's practice some calming breathing together:\n\n` +
                  `🌬️ **Box Breathing:**\n` +
                  `1. Breathe in for 4 counts\n` +
                  `2. Hold for 4 counts\n` +
                  `3. Breathe out for 4 counts\n` +
                  `4. Hold for 4 counts\n` +
                  `5. Repeat 5-10 times\n\n` +
                  `As you breathe, imagine tracing the sides of a box. Let each breath bring you more calm and peace. 🌸`

            // Log breathing exercise usage (fallback)
            if (client.systemLogger) {
                await client.systemLogger.logUserEvent(
                    interaction.user.id,
                    interaction.user.username,
                    'breathing_exercise_used',
                    'User used fallback breathing exercise'
                )
            }

            return interaction.editReply({ content: fallbackBreathing })
        }
    }
}
