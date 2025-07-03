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

        try {
            const affirmation = await client.ai.getCopingResponse({
                tool: 'affirmations',
                feeling,
                userId,
                context: {
                    guildId: interaction.guildId,
                    channelId: interaction.channelId
                }
            })

            // Log affirmations usage
            if (client.systemLogger) {
                await client.systemLogger.logUserEvent(
                    interaction.user.id,
                    interaction.user.username,
                    'affirmations_used',
                    'User requested affirmations'
                )
            }

            return interaction.editReply({ content: affirmation })
        } catch (aiError) {
            console.error('AI affirmations response failed:', aiError)

            // Log the error
            if (client.systemLogger) {
                await client.systemLogger.logError(
                    'AI_COPING_ERROR',
                    'Failed to generate AI affirmations: ' + aiError.message,
                    {
                        userId: interaction.user.id,
                        command: 'affirmations',
                        feeling,
                        error: aiError.stack
                    }
                )
            }

            // Fallback affirmations
            const positiveAffirmations = [
                'I am worthy of love and respect, including from myself.',
                'I have the strength to overcome challenges that come my way.',
                'My feelings are valid, and I allow myself to feel them fully.',
                'I am growing and learning with each experience.',
                'I choose to focus on what I can control in this moment.',
                'I am doing my best with the resources I have right now.',
                'I deserve peace, happiness, and good things in my life.',
                'I am resilient and have overcome difficulties before.',
                'I trust in my ability to navigate through tough times.',
                'I am not my thoughts or feelings - I am the observer of them.'
            ]

            const generalAffirmations = [
                'I am exactly where I need to be in this moment.',
                'I choose progress over perfection.',
                'I am capable of creating positive change in my life.',
                'I release what no longer serves me and embrace what helps me grow.',
                'I am grateful for the opportunity to learn and evolve.'
            ]

            let selectedAffirmations
            if (feeling) {
                selectedAffirmations = positiveAffirmations.slice(0, 3)
            } else {
                selectedAffirmations = generalAffirmations.slice(0, 3)
            }

            const fallbackResponse = feeling
                ? `I understand you're feeling **${feeling}**. Here are some affirmations that might help:\n\n` +
                  selectedAffirmations.map(aff => `💙 ${aff}`).join('\n\n') +
                  `\n\nTake a moment to breathe deeply and repeat these to yourself. You matter, and these feelings will pass. 🌸`
                : `Here are some positive affirmations for you:\n\n` +
                  selectedAffirmations.map(aff => `💙 ${aff}`).join('\n\n') +
                  `\n\nRepeat these to yourself throughout the day. You are worthy of kindness, especially from yourself. ✨`

            // Log affirmations usage (fallback)
            if (client.systemLogger) {
                await client.systemLogger.logUserEvent(
                    interaction.user.id,
                    interaction.user.username,
                    'affirmations_used',
                    'User used fallback affirmations'
                )
            }

            return interaction.editReply({ content: fallbackResponse })
        }
    }
}
