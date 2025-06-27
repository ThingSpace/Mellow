import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'feedback',
        category: 'Users',
        description: 'Submit feedback about Mellow.',
        handlers: {
            cooldown: 300000, // 5 minutes
            requiredRoles: []
        },
        options: [
            {
                name: 'message',
                description: 'Your feedback message',
                required: true,
                type: cmdTypes.STRING
            }
        ]
    },
    run: async (client, interaction) => {
        const message = interaction.options.getString('message')
        const userId = interaction.user.id

        try {
            // Store feedback in database
            await client.db.feedback.create({
                userId: userId,
                message: message
            })

            // Log feedback submission
            if (client.systemLogger) {
                await client.systemLogger.logUserEvent(
                    userId,
                    interaction.user.username,
                    'feedback_submitted',
                    'User submitted feedback'
                )
            }

            // Get Mellow configuration for feedback logging
            const mellowConfig = await client.db.mellow.get()

            // Send to configured feedback channel if available
            if (mellowConfig.feedbackLogs) {
                try {
                    const feedbackChannel = await client.channels.fetch(mellowConfig.feedbackLogs.toString())
                    if (feedbackChannel?.isTextBased()) {
                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle('📝 New Feedback Received')
                            .setDescription(message)
                            .addFields(
                                {
                                    name: 'User',
                                    value: `<@${userId}>`,
                                    inline: true
                                },
                                {
                                    name: 'User ID',
                                    value: userId,
                                    inline: true
                                },
                                {
                                    name: 'Guild',
                                    value: interaction.guild
                                        ? `${interaction.guild.name} (${interaction.guild.id})`
                                        : 'Direct Message',
                                    inline: false
                                }
                            )
                            .setColor(client.colors.primary)
                            .setTimestamp()
                            .setFooter({ text: client.footer, iconURL: client.logo })

                        await feedbackChannel.send({ embeds: [embed] })
                    }
                } catch (error) {
                    console.error('Failed to send feedback to configured channel:', error)
                }
            }

            return interaction.reply({
                content: '✅ Thank you for your feedback! Your message has been submitted to the development team.'
            })
        } catch (error) {
            console.error('Error submitting feedback:', error)
            return interaction.reply({
                content: '❌ Failed to submit feedback. Please try again later.',
                ephemeral: true
            })
        }
    }
}
