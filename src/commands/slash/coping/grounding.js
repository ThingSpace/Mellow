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

        try {
            const grounding = await client.ai.getCopingResponse({
                tool: 'grounding',
                feeling,
                userId,
                context: {
                    guildId: interaction.guildId,
                    channelId: interaction.channelId
                }
            })

            return interaction.editReply({ content: grounding })
        } catch (aiError) {
            console.error('AI grounding response failed:', aiError)

            // Log the error
            if (client.systemLogger) {
                await client.systemLogger.logError(
                    'AI_COPING_ERROR',
                    'Failed to generate AI grounding response: ' + aiError.message,
                    {
                        userId: interaction.user.id,
                        command: 'grounding',
                        feeling,
                        error: aiError.stack
                    }
                )
            }

            // Fallback grounding exercise
            const fallbackGrounding = feeling
                ? `I can see you're feeling **${feeling}**. Let's ground yourself with this exercise:\n\n` +
                  `🧘‍♀️ **5-4-3-2-1 Grounding Technique:**\n` +
                  `**5** things you can **see** around you\n` +
                  `**4** things you can **touch** or feel\n` +
                  `**3** things you can **hear** right now\n` +
                  `**2** things you can **smell**\n` +
                  `**1** thing you can **taste**\n\n` +
                  `Take your time with each step. This helps bring your mind back to the present moment. You're safe here. 🌿`
                : `Let's practice grounding together:\n\n` +
                  `🧘‍♀️ **5-4-3-2-1 Technique:**\n` +
                  `Look around and name:\n` +
                  `• **5** things you can see\n` +
                  `• **4** things you can touch\n` +
                  `• **3** things you can hear\n` +
                  `• **2** things you can smell\n` +
                  `• **1** thing you can taste\n\n` +
                  `This exercise helps anchor you to the present moment and can be very calming. 🌱`

            return interaction.editReply({ content: fallbackGrounding })
        }
    }
}
