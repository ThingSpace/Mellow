import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'feedback',
        category: 'Users',
        description: 'Submit feedback about Mellow or view your feedback history.',
        handlers: {
            cooldown: 300000, // 5 minutes for submitting
            requiredRoles: []
        },
        options: [
            {
                name: 'submit',
                description: 'Submit new feedback',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'message',
                        description: 'Your feedback (min 20, max 1000 characters)',
                        required: true,
                        type: cmdTypes.STRING
                    },
                    {
                        name: 'public',
                        description: 'Allow this feedback to be used as a testimonial if approved',
                        required: false,
                        type: cmdTypes.BOOLEAN
                    }
                ]
            },
            {
                name: 'view',
                description: 'View your feedback history and any staff replies',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'id',
                        description: 'Specific feedback ID to view (optional)',
                        required: false,
                        type: cmdTypes.INTEGER
                    }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand()
        const userId = interaction.user.id

        if (subcommand === 'submit') {
            const message = interaction.options.getString('message')
            const isPublic = interaction.options.getBoolean('public') || false

            // Enforce character limits
            if (message.length < 20) {
                return interaction.reply({
                    content: '❌ Your feedback must be at least 20 characters long. Please provide more details.',
                    ephemeral: true
                })
            }

            if (message.length > 1000) {
                return interaction.reply({
                    content: '❌ Your feedback is too long (max 1000 characters). Please shorten your message.',
                    ephemeral: true
                })
            }

            try {
                // Store feedback in database
                await client.db.feedback.create({
                    userId: userId,
                    message: message,
                    public: isPublic
                })

                // Log feedback submission
                if (client.systemLogger) {
                    await client.systemLogger.logUserEvent(
                        userId,
                        interaction.user.username,
                        'feedback_submitted',
                        `User submitted feedback${isPublic ? ' (marked as public)' : ''}`
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
                                        name: 'Public Testimonial',
                                        value: isPublic ? '✅ Yes (needs approval)' : '❌ No',
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
                    content: `✅ Thank you for your feedback! Your message has been submitted to the development team.${
                        isPublic
                            ? '\n\n*Since you marked this as public, it may be used as a testimonial once approved by our team.*'
                            : ''
                    }`,
                    ephemeral: true
                })
            } catch (error) {
                console.error('Error submitting feedback:', error)

                // Log to system logger
                if (client.systemLogger) {
                    await client.systemLogger.logError(
                        'FEEDBACK_ERROR',
                        'Failed to submit feedback: ' + error.message,
                        {
                            guildId: interaction.guild?.id,
                            userId: interaction.user.id,
                            error: error.stack
                        }
                    )
                }

                return interaction.reply({
                    content: '❌ Failed to submit feedback. Please try again later.',
                    ephemeral: true
                })
            }
        } else if (subcommand === 'view') {
            const feedbackId = interaction.options.getInteger('id')

            try {
                // Fetch either specific feedback or all user feedback
                let feedbackData
                if (feedbackId) {
                    feedbackData = await client.db.feedback.findById(feedbackId, {
                        include: { replies: true }
                    })

                    // Verify ownership
                    if (!feedbackData || (feedbackData.userId && feedbackData.userId.toString() !== userId)) {
                        return interaction.reply({
                            content: '❌ Feedback not found or you do not have permission to view it.',
                            ephemeral: true
                        })
                    }

                    // Show single feedback with replies
                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle(`Feedback #${feedbackData.id}`)
                        .setDescription(feedbackData.message)
                        .addFields(
                            {
                                name: 'Submitted',
                                value: `<t:${Math.floor(new Date(feedbackData.createdAt).getTime() / 1000)}:R>`,
                                inline: true
                            },
                            {
                                name: 'Status',
                                value: feedbackData.approved ? '✅ Approved' : '⏳ Pending Review',
                                inline: true
                            },
                            {
                                name: 'Public',
                                value: feedbackData.public ? '✅ Yes' : '❌ No',
                                inline: true
                            }
                        )
                        .setColor(client.colors.primary)
                        .setTimestamp()
                        .setFooter({ text: client.footer, iconURL: client.logo })

                    // Add replies if any exist
                    if (feedbackData.replies && feedbackData.replies.length > 0) {
                        embed.addFields({
                            name: '💬 Staff Replies',
                            value: feedbackData.replies
                                .map(
                                    reply =>
                                        `**<t:${Math.floor(new Date(reply.createdAt).getTime() / 1000)}:R>**\n${reply.message}`
                                )
                                .join('\n\n')
                        })
                    }

                    return interaction.reply({ embeds: [embed], ephemeral: true })
                } else {
                    // Show feedback history
                    feedbackData = await client.db.feedback.findByUserId(userId)

                    if (!feedbackData || feedbackData.length === 0) {
                        return interaction.reply({
                            content:
                                "You haven't submitted any feedback yet. Use `/feedback submit` to share your thoughts!",
                            ephemeral: true
                        })
                    }

                    // Create a paginated view for multiple feedback items
                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle('Your Feedback History')
                        .setDescription(
                            `You've submitted ${feedbackData.length} feedback item${feedbackData.length > 1 ? 's' : ''}.` +
                                `\nUse \`/feedback view id:[number]\` to see details and any staff replies.`
                        )
                        .setColor(client.colors.primary)
                        .setFooter({ text: client.footer, iconURL: client.logo })

                    // Show the 5 most recent feedback items
                    const recentFeedback = feedbackData.slice(0, 5)
                    recentFeedback.forEach(feedback => {
                        const hasReplies = feedback.replies && feedback.replies.length > 0
                        embed.addFields({
                            name: `#${feedback.id} - ${hasReplies ? '💬 Has Replies' : 'No Replies'} - ${feedback.approved ? '✅ Approved' : '⏳ Pending'}`,
                            value:
                                `**Submitted:** <t:${Math.floor(new Date(feedback.createdAt).getTime() / 1000)}:R>\n` +
                                `**Message:** ${feedback.message.length > 100 ? feedback.message.substring(0, 100) + '...' : feedback.message}`
                        })
                    })

                    return interaction.reply({ embeds: [embed], ephemeral: true })
                }
            } catch (error) {
                console.error('Error viewing feedback:', error)

                // Log to system logger
                if (client.systemLogger) {
                    await client.systemLogger.logError(
                        'FEEDBACK_VIEW_ERROR',
                        'Failed to view feedback: ' + error.message,
                        {
                            guildId: interaction.guild?.id,
                            userId: interaction.user.id,
                            feedbackId,
                            error: error.stack
                        }
                    )
                }

                return interaction.reply({
                    content: '❌ Failed to retrieve feedback. Please try again later.',
                    ephemeral: true
                })
            }
        }
    }
}
