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
                options: []
            }
        ]
    },
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand()
        const userId = interaction.user.id

        try {
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
                        content: `✅ Added **${tool}** to your favorite coping tools!`,
                        ephemeral: true
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
                        content: `✅ Removed **${tool}** from your favorites.`,
                        ephemeral: true
                    })
                }

                case 'list': {
                    const favorites = await client.db.favoriteCopingTools.findMany({
                        where: { userId: BigInt(userId) }
                    })

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle('🧰 Your Favorite Coping Tools')
                        .setColor(client.colors.primary)
                        .setDescription(favorites.map(f => `• **${f.tool}**`).join('\n'))
                        .setFooter({ text: client.footer, iconURL: client.logo })
                        .setTimestamp()

                    if (favorites.length === 0) {
                        return interaction.reply({
                            content: "You don't have any favorite coping tools yet. Use `/toolbox add` to add some!"
                        })
                    }

                    return interaction.reply({ embeds: [embed] })
                }

                case 'suggest': {
                    // Get user's recent check-ins for context
                    const userProfile = await client.db.users.findById(userId, {
                        include: {
                            checkIns: {
                                orderBy: { createdAt: 'desc' },
                                take: 3
                            }
                        }
                    })

                    const recentMood = userProfile?.checkIns?.[0]?.mood || 'neutral'

                    // Simple suggestion logic based on mood
                    const suggestions = {
                        anxious: ['breathing exercises', 'grounding techniques', 'progressive muscle relaxation'],
                        sad: ['journaling', 'gratitude practice', 'gentle movement'],
                        angry: ['breathing exercises', 'physical exercise', 'mindful walking'],
                        stressed: ['meditation', 'breathing exercises', 'time management'],
                        happy: ['gratitude practice', 'creative activities', 'social connection'],
                        neutral: ['mindfulness', 'breathing exercises', 'gentle stretching']
                    }

                    const moodSuggestions = suggestions[recentMood] || suggestions.neutral
                    const suggestion = moodSuggestions[Math.floor(Math.random() * moodSuggestions.length)]

                    // Log coping tool suggestion
                    if (client.systemLogger) {
                        await client.systemLogger.logUserEvent(
                            userId,
                            interaction.user.username,
                            'coping_suggestion_requested',
                            `Suggested: ${suggestion} (based on mood: ${recentMood})`
                        )
                    }

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle('💡 Coping Tool Suggestion')
                        .setColor(client.colors.primary)
                        .setDescription(
                            `Based on your recent mood (${recentMood}), I suggest trying **${suggestion}**.`
                        )
                        .addFields({
                            name: 'Why this suggestion?',
                            value: `This tool is often helpful when feeling ${recentMood}. Give it a try and see how it feels!`,
                            inline: false
                        })
                        .setFooter({ text: client.footer, iconURL: client.logo })
                        .setTimestamp()

                    return interaction.reply({ embeds: [embed] })
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

            return interaction.reply({
                content: '❌ An error occurred while managing your toolbox. Please try again later.',
                ephemeral: true
            })
        }
    }
}
