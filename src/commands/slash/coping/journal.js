import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import { moodChoices } from '../../../configs/mood.config.js'

export default {
    structure: {
        name: 'journal',
        category: 'Coping',
        description: 'Write, view or delete your journal entries',
        handlers: {
            cooldown: 15000,
            requiredPerms: [],
            requiredRoles: []
        },
        options: [
            {
                name: 'write',
                type: cmdTypes.SUB_COMMAND,
                description: 'Write a new journal entry.',
                options: [
                    {
                        name: 'mood',
                        description: 'How are you feeling right now?',
                        required: true,
                        type: cmdTypes.STRING,
                        choices: moodChoices
                    },
                    {
                        name: 'entry',
                        description: 'Your journal entry content',
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
                name: 'list',
                type: cmdTypes.SUB_COMMAND,
                description: 'List all of your journal entries by their ID',
                options: []
            },
            {
                name: 'view',
                type: cmdTypes.SUB_COMMAND,
                description: 'View a journal entry',
                options: [
                    {
                        name: 'entry_id',
                        description: 'ID of the journal entry',
                        required: true,
                        type: cmdTypes.STRING
                    }
                ]
            },
            {
                name: 'recent',
                type: cmdTypes.SUB_COMMAND,
                description: 'View your recent journal entries',
                options: []
            },
            {
                name: 'delete',
                type: cmdTypes.SUB_COMMAND,
                description: 'Delete a journal entry',
                options: [
                    {
                        name: 'entry_id',
                        description: 'ID of the entry to delete',
                        required: true,
                        type: cmdTypes.STRING
                    }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const userId = BigInt(interaction.user.id)

        switch (interaction.options.getSubcommand()) {
            /** CREATE A NEW JOURNAL ENTRY */
            case 'write': {
                const feeling = interaction.options.getString('mood')
                const content = interaction.options.getString('entry')
                const isPrivate = interaction.options.getBoolean('private')

                await interaction.deferReply({ ephemeral: isPrivate })

                await client.db.journalEntries.create({
                    userId: BigInt(interaction.user.id),
                    content: content,
                    private: isPrivate ? true : false
                })

                // Log journal entry creation
                if (client.systemLogger) {
                    await client.systemLogger.logUserEvent(
                        interaction.user.id,
                        interaction.user.username,
                        'journal_entry_created',
                        `Created ${isPrivate ? 'private' : 'public'} journal entry`
                    )
                }

                try {
                    const response = await client.ai.getCopingResponse({
                        tool: 'journal',
                        feeling,
                        userId,
                        context: {
                            guildId: interaction.guildId,
                            channelId: interaction.channelId
                        }
                    })

                    const fullResponse = `Your journal entry has been saved!\n\n${response}`

                    return interaction.editReply({
                        content: fullResponse
                    })
                } catch (aiError) {
                    console.error('AI journal response failed:', aiError)

                    // Log the error
                    if (client.systemLogger) {
                        await client.systemLogger.logError(
                            'AI_COPING_ERROR',
                            'Failed to generate AI journal response: ' + aiError.message,
                            {
                                userId: interaction.user.id,
                                command: 'journal write',
                                feeling,
                                error: aiError.stack
                            }
                        )
                    }

                    // Fallback response
                    const fallbackResponse = feeling
                        ? `Your journal entry has been saved! 📝\n\n` +
                          `Thank you for sharing that you're feeling **${feeling}**. Journaling is a powerful way to process emotions and thoughts.\n\n` +
                          `💭 **Reflection prompts for later:**\n` +
                          `• What led to this feeling?\n` +
                          `• What would help you feel more balanced?\n` +
                          `• What are you grateful for today?\n\n` +
                          `Remember, all feelings are valid and temporary. You're taking great care of yourself by journaling. 💙`
                        : `Your journal entry has been saved! 📝\n\n` +
                          `Journaling is an excellent way to process your thoughts and feelings. You're doing something wonderful for your mental health.\n\n` +
                          `💡 **Tips for your journaling journey:**\n` +
                          `• Write regularly, even if it's just a few lines\n` +
                          `• Don't worry about perfect grammar or structure\n` +
                          `• Include both challenges and gratitude\n` +
                          `• Review past entries to see your growth\n\n` +
                          `Keep up this healthy habit! 🌱`

                    return interaction.editReply({
                        content: fallbackResponse
                    })
                }
            }

            /** LIST ALL JOURNAL ENTRIES */
            case 'list': {
                await interaction.deferReply({ ephemeral: false })

                const entries = await client.db.journalEntries.findMany({
                    where: { userId: BigInt(interaction.user.id) },
                    orderBy: { createdAt: 'desc' }
                })

                if (!entries.length)
                    return interaction.editReply({
                        content:
                            'You have no journal entries yet, you can create one using the `/journal write` command'
                    })

                const lines = entries.map(
                    e =>
                        `- **ID:** \`${e.id}\` | *${e.createdAt.toLocaleString()}*${e.private ? ' 🔒' : ''}\n> ${e.content.slice(0, 50)}${e.content.length > 50 ? '...' : ''}`
                )

                return interaction.editReply({
                    content:
                        'Here are your journal entries (showing ID, date, and a preview):\n\n' +
                        lines.join('\n\n') +
                        '\n\n> Use `/journal view <entry_id>` to view the full entry.\n> 🔒 = Private entry'
                })
            }

            /** VIEW A JOURNAL ENTRY */
            case 'view': {
                await interaction.deferReply({ ephemeral: false })

                const entryId = parseInt(interaction.options.getString('entry_id'), 10)
                const entry = await client.db.journalEntries.findById(entryId)

                if (!entry || (entry.private && entry.userId !== userId)) {
                    return interaction.editReply({
                        content: 'Entry not found or you do not have permission to view it.'
                    })
                }

                return interaction.editReply({
                    content: `**ID:** \`${entry.id}\`\n*${entry.createdAt.toLocaleString()}*${entry.private ? ' 🔒' : ''}\n\n${entry.content}`
                })
            }

            /** VIEW RECENT JOURNAL ENTRIES */
            case 'recent': {
                await interaction.deferReply({ ephemeral: true })

                const entries = await client.db.journalEntries.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                })

                if (!entries.length)
                    return interaction.editReply({
                        content:
                            'You have no recent journal entries, you can create one using the `/journal write` command'
                    })

                const lines = entries.map(
                    e =>
                        `- **ID:** \`${e.id}\` | *${e.createdAt.toLocaleString()}*${e.private ? ' 🔒' : ''}\n> ${e.content.slice(0, 50)}${e.content.length > 50 ? '...' : ''}`
                )

                return interaction.editReply({
                    content: 'Here are your 5 most recent journal entries:\n\n' + lines.join('\n\n')
                })
            }

            /** DELETE A JOURNAL ENTRY */
            case 'delete': {
                await interaction.deferReply({ ephemeral: false })

                const entryId = parseInt(interaction.options.getString('entry_id'), 10)
                const entry = await client.db.journalEntries.findById(entryId)

                if (!entry || entry.userId !== userId) {
                    return interaction.editReply({
                        content: 'Entry not found or you do not have permission to delete it.'
                    })
                }

                await client.db.journalEntries.delete(entryId)

                return interaction.editReply({
                    content: 'Journal entry deleted.'
                })
            }

            default: {
                return interaction.editReply({
                    content: 'Please select a valid subcommand to continue!'
                })
            }
        }
    }
}
