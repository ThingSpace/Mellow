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
        switch (interaction.options.getSubcommand()) {
            /** CREATE A NEW JOURNAL ENTRY */
            case 'write': {
                const feeling = interaction.options.getString('mood')
                const content = interaction.options.getString('entry')
                const isPrivate = interaction.options.getBoolean('private')

                await client.db.journalEntries.create({
                    userId: BigInt(interaction.user.id),
                    content: content,
                    private: isPrivate ? true : false
                })

                const response = await client.ai.getCopingResponse({
                    tool: 'journal',
                    feeling,
                    userId
                })

                const fullResponse = `Your journal entry has been saved!\n\n${response}`

                return interaction.reply({
                    content: fullResponse,
                    ephemeral: true
                })
            }

            /** LIST ALL JOURNAL ENTRIES */
            case 'list': {
                const entries = await client.ai.journalEntries.findMany({
                    where: { userId: BigInt(interaction.user.id) },
                    orderBy: { createdAt: 'desc' }
                })

                if (!entries.length)
                    return interaction.reply({
                        content:
                            'You have no journal entries yet, you can create one using the `/journal write` command'
                    })

                const lines = entries.map(
                    e =>
                        `- **ID:** \`${e.id}\` | *${e.createdAt.toLocaleString()}*${e.private ? ' 🔒' : ''}\n> ${e.content.slice(0, 50)}${e.content.length > 50 ? '...' : ''}`
                )

                return interaction.reply({
                    content:
                        'Here are your journal entries (showing ID, date, and a preview):\n\n' +
                        lines.join('\n\n') +
                        '\n\n> Use `/journal view <entry_id>` to view the full entry.\n> 🔒 = Private entry'
                })
            }

            /** VIEW A JOURNAL ENTRY */
            case 'view': {
                const entryId = parseInt(interaction.options.getString('entry_id'), 10)
                const entry = await client.db.journalEntries.findById(entryId)

                if (!entry || (entry.private && entry.userId !== BigInt(interaction.user.id))) {
                    return interaction.reply({
                        content: 'Entry not found or you do not have permission to view it.',
                        ephemeral: true
                    })
                }

                return interaction.reply({
                    content: `**ID:** \`${entry.id}\`\n*${entry.createdAt.toLocaleString()}*${entry.private ? ' 🔒' : ''}\n\n${entry.content}`,
                    ephemeral: entry.private
                })
            }

            /** VIEW RECENT JOURNAL ENTRIES */
            case 'recent': {
                const entries = await client.db.journalEntries.findMany({
                    where: { userId: BigInt(interaction.user.id) },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                })

                if (!entries.length)
                    return interaction.reply({
                        content:
                            'You have no recent journal entries, you can create one using the `/journal write` command',
                        ephemeral: true
                    })

                const lines = entries.map(
                    e =>
                        `- **ID:** \`${e.id}\` | *${e.createdAt.toLocaleString()}*${e.private ? ' 🔒' : ''}\n> ${e.content.slice(0, 50)}${e.content.length > 50 ? '...' : ''}`
                )

                return interaction.reply({
                    content: 'Here are your 5 most recent journal entries:\n\n' + lines.join('\n\n'),
                    ephemeral: true
                })
            }

            /** DELETE A JOURNAL ENTRY */
            case 'delete': {
                const entryId = parseInt(interaction.options.getString('entry_id'), 10)
                const entry = await client.db.journalEntries.findById(entryId)

                if (!entry || entry.userId !== BigInt(interaction.user.id)) {
                    return interaction.reply({
                        content: 'Entry not found or you do not have permission to delete it.',
                        ephemeral: true
                    })
                }

                await client.db.journalEntries.delete(entryId)

                return interaction.reply({
                    content: 'Journal entry deleted.',
                    ephemeral: true
                })
            }

            default: {
                return interaction.reply({
                    content: 'Please select a valid subcommand to continue!',
                    ephemeral: true
                })
            }
        }
    }
}
