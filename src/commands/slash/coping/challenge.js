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

        try {
            const challenge = await client.ai.getCopingResponse({
                tool: 'challenge',
                feeling,
                userId,
                context: {
                    guildId: interaction.guildId,
                    channelId: interaction.channelId
                }
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
        } catch (aiError) {
            console.error('AI challenge response failed:', aiError)

            // Log the error
            if (client.systemLogger) {
                await client.systemLogger.logError(
                    'AI_COPING_ERROR',
                    'Failed to generate AI challenge: ' + aiError.message,
                    {
                        userId: interaction.user.id,
                        command: 'challenge',
                        feeling,
                        error: aiError.stack
                    }
                )
            }

            // Fallback challenge exercises
            const challenges = [
                '🏃‍♀️ **Physical Challenge**: Do 10 jumping jacks or stretch for 2 minutes to get your energy moving.',
                "🎨 **Creative Challenge**: Draw or doodle something for 5 minutes - it doesn't need to be perfect!",
                '📚 **Learning Challenge**: Learn one new fact about something that interests you.',
                "🌱 **Mindfulness Challenge**: Name 3 things you're grateful for right now, no matter how small.",
                '🤝 **Connection Challenge**: Send a kind message to someone you care about.',
                '🧘‍♀️ **Breathing Challenge**: Take 5 slow, deep breaths and focus only on your breathing.',
                '🎵 **Music Challenge**: Listen to one song that makes you feel good and really focus on it.',
                '📝 **Reflection Challenge**: Write down one thing you accomplished today, even if it feels small.'
            ]

            const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)]

            const fallbackResponse = feeling
                ? `I notice you're feeling **${feeling}**. Here's a gentle challenge for you:\n\n${randomChallenge}\n\n` +
                  `Remember, small actions can make a big difference in how we feel. You're taking positive steps by being here. 💙`
                : `Here's a positive challenge for you:\n\n${randomChallenge}\n\n` +
                  `Sometimes a small change in activity can shift our whole mood. You're doing great by taking care of yourself! ✨`

            // Log challenge usage (fallback)
            if (client.systemLogger) {
                await client.systemLogger.logUserEvent(
                    interaction.user.id,
                    interaction.user.username,
                    'coping_challenge_used',
                    'User used fallback coping challenge'
                )
            }

            return interaction.editReply({ content: fallbackResponse })
        }
    }
}
