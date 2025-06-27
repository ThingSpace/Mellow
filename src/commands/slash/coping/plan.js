import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'plan',
        category: 'Coping',
        description: 'Create or view your personalized coping plan.',
        handlers: {
            cooldown: 15000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: [
            {
                name: 'plan',
                description: 'Your coping plan (leave empty to view current plan)',
                required: false,
                type: cmdTypes.STRING
            }
        ]
    },
    run: async (client, interaction) => {
        const userId = interaction.user.id
        const planText = interaction.options.getString('plan')

        try {
            if (planText) {
                // Save or update plan
                await client.db.copingPlans.upsert(userId, {
                    userId: userId,
                    plan: planText
                })

                // Log plan creation/update
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
            } else {
                // Show existing plan
                const existingPlan = await client.db.copingPlans.findMany({
                    where: { userId: BigInt(userId) },
                    take: 1
                })

                if (existingPlan.length === 0) {
                    return interaction.reply({
                        content:
                            "📋 You don't have a coping plan yet.\n\nUse `/plan <your plan>` to create one! A coping plan can include:\n• Breathing exercises\n• People to contact\n• Activities that help you feel better\n• Positive affirmations\n• Emergency contacts"
                    })
                }

                const plan = existingPlan[0]
                const embed = new client.Gateway.EmbedBuilder()
                    .setTitle('📋 Your Coping Plan')
                    .setColor(client.colors.primary)
                    .setDescription(plan.plan)
                    .addFields({
                        name: '💡 Tip',
                        value: 'Review and update your plan regularly. Use `/plan <new plan>` to modify it.',
                        inline: false
                    })
                    .setFooter({ text: client.footer, iconURL: client.logo })
                    .setTimestamp()

                return interaction.reply({ embeds: [embed] })
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
