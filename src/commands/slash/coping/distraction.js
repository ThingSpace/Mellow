import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'distraction',
        category: 'Coping',
        description: 'Get a joke, fun fact, or mini-game to distract yourself.',
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
            const distraction = await client.ai.getCopingResponse({
                tool: 'distraction',
                feeling,
                userId,
                context: {
                    guildId: interaction.guildId,
                    channelId: interaction.channelId
                }
            })

            return interaction.editReply({ content: distraction })
        } catch (aiError) {
            console.error('AI distraction response failed:', aiError)

            // Log the error
            if (client.systemLogger) {
                await client.systemLogger.logError(
                    'AI_COPING_ERROR',
                    'Failed to generate AI distraction: ' + aiError.message,
                    {
                        userId: interaction.user.id,
                        command: 'distraction',
                        feeling,
                        error: aiError.stack
                    }
                )
            }

            // Fallback distraction techniques
            const distractions = [
                '🎮 **Play a simple game** - even 5 minutes of a puzzle game or mobile game can shift your focus',
                '📚 **Read something interesting** - an article, book chapter, or even funny memes',
                '🎵 **Create a playlist** - gather songs that match your mood or ones that help you feel better',
                '🎨 **Get creative** - doodle, color, or craft something with whatever materials you have',
                '🧩 **Solve a puzzle** - crossword, sudoku, or any brain teaser that engages your mind',
                '📺 **Watch something uplifting** - funny videos, nature documentaries, or feel-good content',
                "🏠 **Organize a small space** - your desk, a drawer, or even just your phone's photos",
                '🌿 **Connect with nature** - look out a window, tend to a plant, or step outside briefly',
                '📞 **Reach out to someone** - text a friend, call a family member, or join an online community',
                '🍳 **Try a simple recipe** - make tea, a snack, or experiment with cooking/baking'
            ]

            const selectedDistractions = distractions.sort(() => Math.random() - 0.5).slice(0, 3)

            const fallbackResponse = feeling
                ? `I understand you're feeling **${feeling}** and could use a healthy distraction. Here are some ideas:\n\n` +
                  selectedDistractions.join('\n\n') +
                  `\n\nThe goal isn't to avoid your feelings forever, but to give your mind a gentle break. You're taking good care of yourself. 🌸`
                : `Here are some healthy distraction techniques:\n\n` +
                  selectedDistractions.join('\n\n') +
                  `\n\nSometimes we need a mental break, and that's perfectly okay. Choose what feels right for you today! ✨`

            return interaction.editReply({ content: fallbackResponse })
        }
    }
}
