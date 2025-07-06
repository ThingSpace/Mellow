import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'toolbox',
        category: 'Coping',
        description: 'Manage your favorite coping tools for quick access.',
        handlers: {
            cooldown: 15000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: [
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'add',
                description: 'Add a tool to your favorites',
                options: [
                    {
                        name: 'tool',
                        description: 'Tool name',
                        required: true,
                        type: cmdTypes.STRING
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'remove',
                description: 'Remove a tool from your favorites',
                options: [
                    {
                        name: 'tool',
                        description: 'Tool name',
                        required: true,
                        type: cmdTypes.STRING
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'list',
                description: 'List your favorite coping tools',
                options: []
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'suggest',
                description: 'Get a personalized coping tool suggestion',
                options: [
                    {
                        name: 'goal',
                        description: 'What is your current goal or focus?',
                        required: false,
                        type: cmdTypes.STRING
                    }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand()
        const userId = interaction.user.id

        try {
            // Defer reply for potentially long-running subcommands
            if (subcommand === 'suggest') {
                await interaction.deferReply()
            }

            switch (subcommand) {
                case 'add': {
                    const tool = interaction.options.getString('tool')

                    await client.db.favoriteCopingTools.create({
                        userId: userId,
                        tool: tool
                    })

                    // Log coping tool usage
                    if (client.systemLogger) {
                        await client.systemLogger.logUserEvent(
                            userId,
                            interaction.user.username,
                            'favorite_tool_added',
                            `Added favorite tool: ${tool}`
                        )
                    }

                    return interaction.reply({
                        content: `✅ Added **${tool}** to your favorite coping tools!`
                    })
                }

                case 'remove': {
                    const tool = interaction.options.getString('tool')

                    const existing = await client.db.favoriteCopingTools.findMany({
                        where: {
                            userId: BigInt(userId),
                            tool: tool
                        }
                    })

                    if (existing.length === 0) {
                        return interaction.reply({
                            content: `❌ **${tool}** is not in your favorites.`,
                            ephemeral: true
                        })
                    }

                    await client.db.favoriteCopingTools.delete(existing[0].id)

                    // Log removal
                    if (client.systemLogger) {
                        await client.systemLogger.logUserEvent(
                            userId,
                            interaction.user.username,
                            'favorite_tool_removed',
                            `Removed favorite tool: ${tool}`
                        )
                    }

                    return interaction.reply({
                        content: `✅ Removed **${tool}** from your favorites.`
                    })
                }

                case 'list': {
                    const favorites = await client.db.favoriteCopingTools.findMany({
                        where: { userId: BigInt(userId) }
                    })

                    if (favorites.length === 0) {
                        return interaction.reply({
                            content: "You don't have any favorite coping tools yet. Use `/toolbox add` to add some!"
                        })
                    }

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle('🧰 Your Favorite Coping Tools')
                        .setColor(client.colors.primary)
                        .setDescription(favorites.map(f => `• **${f.tool}**`).join('\n'))
                        .setFooter({ text: client.footer, iconURL: client.logo })
                        .setTimestamp()

                    return interaction.reply({ embeds: [embed] })
                }

                case 'suggest': {
                    const goal = interaction.options.getString('goal') || undefined

                    try {
                        const aiSuggestion = await client.ai.generateSuggestion({
                            userId,
                            goal
                        })

                        if (client.systemLogger) {
                            await client.systemLogger.logUserEvent(
                                userId,
                                interaction.user.username,
                                'coping_suggestion_requested',
                                `AI suggested: ${aiSuggestion}`
                            )
                        }

                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('💡 Coping Tool Suggestion')
                            .setColor(client.colors.primary)
                            .setDescription(`Here's a personalized suggestion for you:\n\n${aiSuggestion}`)
                            .setFooter({ text: client.footer, iconURL: client.logo })
                            .setTimestamp()

                        return interaction.editReply({ embeds: [embed] })
                    } catch (aiError) {
                        console.error('AI suggestion failed:', aiError)

                        // Log the error
                        if (client.systemLogger) {
                            await client.systemLogger.logError(
                                'AI_SUGGESTION_ERROR',
                                'Failed to generate AI suggestion: ' + aiError.message,
                                {
                                    userId,
                                    command: 'toolbox suggest',
                                    goal,
                                    error: aiError.stack
                                }
                            )
                        }

                        // Fallback response without AI
                        const fallbackSuggestions = [
                            '🌬️ Try a **breathing exercise** - inhale for 4, hold for 4, exhale for 6',
                            '📝 **Journal writing** can help process your thoughts and feelings',
                            '🚶‍♀️ Take a **mindful walk** and focus on your surroundings',
                            '🎵 Listen to **calming music** or sounds that help you relax',
                            '💭 Practice **positive affirmations** to shift your mindset',
                            '🧘‍♀️ Try a **grounding exercise** - name 5 things you can see, 4 you can touch, 3 you can hear',
                            '📱 Use the **distraction technique** - find something engaging to focus on'
                        ]

                        const randomSuggestion =
                            fallbackSuggestions[Math.floor(Math.random() * fallbackSuggestions.length)]

                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('💡 Coping Tool Suggestion')
                            .setColor(client.colors.primary)
                            .setDescription(`Here's a suggestion for you:\n\n${randomSuggestion}`)
                            .setFooter({ text: client.footer, iconURL: client.logo })
                            .setTimestamp()

                        return interaction.editReply({ embeds: [embed] })
                    }
                }

                default:
                    return interaction.reply({
                        content: '❌ Unknown subcommand.',
                        ephemeral: true
                    })
            }
        } catch (error) {
            console.error('Error in toolbox command:', error)

            if (client.systemLogger) {
                await client.systemLogger.logError(error, `Toolbox Command: ${subcommand}`)
            }

            // Only reply if not already replied or deferred
            if (!interaction.replied && !interaction.deferred) {
                return interaction.reply({
                    content: '❌ An error occurred while managing your toolbox. Please try again later.',
                    ephemeral: true
                })
            }
        }
    }
}
