import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'gratitude',
        category: 'Coping',
        description: 'Log or view things you are grateful for.',
        handlers: {
            cooldown: 15000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: [
            {
                name: 'log',
                type: cmdTypes.SUB_COMMAND,
                description: 'Log something you are grateful for',
                options: [
                    {
                        name: 'item',
                        description: 'What are you grateful for?',
                        required: true,
                        type: cmdTypes.STRING
                    },
                    {
                        name: 'private',
                        description: 'Should this entry be private?',
                        required: true,
                        type: cmdTypes.BOOLEAN
                    }
                ]
            },
            {
                name: 'view',
                type: cmdTypes.SUB_COMMAND,
                description: 'View your gratitude entries.',
                options: []
            }
        ]
    },
    run: async (client, interaction) => {
        const sub = interaction.options.getSubcommand()
        const userId = BigInt(interaction.user.id)

        /** LOG A NEW GRATITUDE ENTRY */
        if (sub === 'log') {
            const item = interaction.options.getString('item')
            const isPrivate = interaction.options.getBoolean('private')

            await interaction.deferReply({ ephemeral: isPrivate })

            await client.db.gratitudeEntries.create({
                userId,
                item
            })

            // Log gratitude entry
            if (client.systemLogger) {
                await client.systemLogger.logUserEvent(
                    interaction.user.id,
                    interaction.user.username,
                    'gratitude_entry_created',
                    'User logged gratitude entry'
                )
            }

            try {
                const gratitude = await client.ai.getCopingResponse({
                    tool: 'gratitude',
                    feeling: null,
                    userId,
                    context: {
                        guildId: interaction.guildId,
                        channelId: interaction.channelId
                    }
                })

                return interaction.editReply({ content: gratitude })
            } catch (aiError) {
                console.error('AI gratitude response failed:', aiError)

                // Log the error
                if (client.systemLogger) {
                    await client.systemLogger.logError(
                        'AI_COPING_ERROR',
                        'Failed to generate AI gratitude response: ' + aiError.message,
                        {
                            userId: interaction.user.id,
                            command: 'gratitude add',
                            error: aiError.stack
                        }
                    )
                }

                // Fallback gratitude response
                const fallbackResponse =
                    `Thank you for sharing what you're grateful for: **${item}** 🌟\n\n` +
                    `Gratitude is one of the most powerful practices for mental well-being. By acknowledging what we appreciate, we train our minds to notice the positive aspects of our lives.\n\n` +
                    `💝 **Benefits of gratitude practice:**\n` +
                    `• Increases happiness and life satisfaction\n` +
                    `• Reduces stress and anxiety\n` +
                    `• Improves relationships and empathy\n` +
                    `• Enhances sleep quality\n` +
                    `• Builds resilience during tough times\n\n` +
                    `Keep building this healthy habit - even small moments of gratitude can make a big difference! 🌱`

                return interaction.editReply({ content: fallbackResponse })
            }
        }

        if (sub === 'view') {
            const entries = await client.db.gratitudeEntries.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 5
            })

            if (!entries.length) {
                return interaction.reply({
                    content: 'You have no gratitude entries yet, You can create one using `/gratitude log`'
                })
            }

            return interaction.reply({
                content: entries.map(e => `• ${e.item} (*${e.createdAt.toLocaleString()}*)`).join('\n')
            })
        }
    }
}
