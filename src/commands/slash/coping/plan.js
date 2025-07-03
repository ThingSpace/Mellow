import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'plan',
        category: 'Coping',
        description: 'Manage your personalized coping plan.',
        handlers: {
            cooldown: 15000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: [
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'suggest',
                description: 'Get a suggested coping plan based on your trends',
                options: [
                    {
                        name: 'goal',
                        description: 'What is your current goal or focus?',
                        required: false,
                        type: cmdTypes.STRING
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'create',
                description: 'Create or update your coping plan',
                options: [
                    {
                        name: 'plan',
                        description: 'Your coping plan',
                        required: true,
                        type: cmdTypes.STRING
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'view',
                description: 'View your current coping plan',
                options: []
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'remove',
                description: 'Delete your current coping plan',
                options: []
            }
        ]
    },
    run: async (client, interaction) => {
        const userId = interaction.user.id
        const sub = interaction.options.getSubcommand()

        try {
            switch (sub) {
                case 'suggest': {
                    await interaction.deferReply()
                    const goal = interaction.options.getString('goal') || undefined

                    try {
                        const aiSuggestion = await client.ai.generateSuggestion({
                            userId,
                            goal
                        })

                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('📝 Suggested Coping Plan')
                            .setColor(client.colors.primary)
                            .setDescription(aiSuggestion)
                            .setFooter({ text: client.footer, iconURL: client.logo })
                            .setTimestamp()

                        return interaction.editReply({ embeds: [embed] })
                    } catch (aiError) {
                        console.error('AI suggestion failed for coping plan:', aiError)

                        // Log the error
                        if (client.systemLogger) {
                            await client.systemLogger.logError(
                                'AI_SUGGESTION_ERROR',
                                'Failed to generate AI coping plan: ' + aiError.message,
                                {
                                    userId,
                                    command: 'plan suggest',
                                    goal,
                                    error: aiError.stack
                                }
                            )
                        }

                        // Fallback coping plan template
                        const fallbackPlan = goal
                            ? `Here's a basic coping plan to help with **${goal}**:\n\n` +
                              `🌅 **Morning**: Start with 5 minutes of deep breathing\n` +
                              `🌞 **Midday**: Take mindful breaks and check in with yourself\n` +
                              `🌙 **Evening**: Practice gratitude and reflection\n\n` +
                              `**Quick Tools**: Grounding exercises, positive affirmations, journaling\n` +
                              `**When struggling**: Reach out to support, use distraction techniques, focus on breathing`
                            : `Here's a basic coping plan template:\n\n` +
                              `🧘‍♀️ **Daily**: Practice mindfulness for 10 minutes\n` +
                              `📝 **Weekly**: Journal about your thoughts and feelings\n` +
                              `🚶‍♀️ **Regular**: Get fresh air and light exercise\n` +
                              `💭 **Ongoing**: Build positive thought patterns\n\n` +
                              `**Crisis Tools**: Deep breathing, grounding exercises, reaching out for support\n` +
                              `**Self-Care**: Regular sleep, healthy eating, social connection`

                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('📝 Suggested Coping Plan')
                            .setColor(client.colors.primary)
                            .setDescription(fallbackPlan)
                            .setFooter({ text: client.footer, iconURL: client.logo })
                            .setTimestamp()

                        return interaction.editReply({ embeds: [embed] })
                    }
                }

                case 'create': {
                    const planText = interaction.options.getString('plan')
                    // Find existing plan for this user
                    const existingPlan = await client.db.copingPlans.findMany({
                        where: { userId: BigInt(userId) },
                        take: 1
                    })

                    if (existingPlan.length > 0) {
                        // Update existing plan
                        await client.db.copingPlans.upsert(existingPlan[0].id, {
                            userId: BigInt(userId),
                            plan: planText
                        })
                    } else {
                        // Create new plan (do not set id)
                        await client.db.copingPlans.create({
                            userId: BigInt(userId),
                            plan: planText
                        })
                    }

                    if (client.systemLogger) {
                        await client.systemLogger.logUserEvent(
                            userId,
                            interaction.user.username,
                            'coping_plan_updated',
                            'User created/updated their coping plan'
                        )
                    }

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle('📋 Coping Plan Saved')
                        .setColor(client.colors.success)
                        .setDescription(
                            'Your personalized coping plan has been saved! Having a plan can help you feel more prepared for difficult times.'
                        )
                        .addFields({
                            name: 'Your Plan',
                            value: planText.length > 1000 ? planText.substring(0, 1000) + '...' : planText,
                            inline: false
                        })
                        .setFooter({ text: client.footer, iconURL: client.logo })
                        .setTimestamp()

                    return interaction.reply({ embeds: [embed], ephemeral: true })
                }

                case 'view': {
                    const existingPlan = await client.db.copingPlans.findMany({
                        where: { userId: BigInt(userId) },
                        take: 1
                    })

                    if (existingPlan.length === 0) {
                        return interaction.reply({
                            content:
                                "📋 You don't have a coping plan yet.\n\nUse `/plan create` to make one! A coping plan can include:\n• Breathing exercises\n• People to contact\n• Activities that help you feel better\n• Positive affirmations\n• Emergency contacts",
                            ephemeral: true
                        })
                    }

                    const plan = existingPlan[0]
                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle('📋 Your Coping Plan')
                        .setColor(client.colors.primary)
                        .setDescription(plan.plan)
                        .addFields({
                            name: '💡 Tip',
                            value: 'Review and update your plan regularly. Use `/plan create` to modify it.'
                        })
                        .setFooter({ text: client.footer, iconURL: client.logo })
                        .setTimestamp()

                    return interaction.reply({ embeds: [embed] })
                }

                case 'remove': {
                    const existingPlan = await client.db.copingPlans.findMany({
                        where: { userId: BigInt(userId) },
                        take: 1
                    })
                    if (!existingPlan.length) {
                        return interaction.reply({
                            content: "❌ You don't have a coping plan to remove.",
                            ephemeral: true
                        })
                    }
                    await client.db.copingPlans.delete(existingPlan[0].id)
                    if (client.systemLogger) {
                        await client.systemLogger.logUserEvent(
                            userId,
                            interaction.user.username,
                            'coping_plan_deleted',
                            'User deleted their coping plan'
                        )
                    }
                    return interaction.reply({
                        content: '🗑️ Your coping plan has been deleted.'
                    })
                }

                default:
                    return interaction.reply({
                        content: '❌ Unknown subcommand.',
                        ephemeral: true
                    })
            }
        } catch (error) {
            console.error('Error in plan command:', error)

            if (client.systemLogger) {
                await client.systemLogger.logError(error, 'Coping Plan Command')
            }

            return interaction.reply({
                content: '❌ An error occurred while managing your coping plan. Please try again later.',
                ephemeral: true
            })
        }
    }
}
