import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'feedback-manage',
        category: 'Admin',
        description: 'Manage user feedback and testimonials',
        handlers: {
            cooldown: 5000,
            requiredRoles: ['ADMIN', 'MOD', 'SUPPORT']
        },
        options: [
            {
                name: 'list',
                description: 'List recent feedback',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'filter',
                        description: 'Filter feedback by status',
                        required: false,
                        type: cmdTypes.STRING,
                        choices: [
                            { name: 'All Feedback', value: 'all' },
                            { name: 'Pending Approval', value: 'pending' },
                            { name: 'Approved', value: 'approved' },
                            { name: 'Public Testimonials', value: 'testimonials' }
                        ]
                    },
                    {
                        name: 'limit',
                        description: 'Number of items to show (1-20)',
                        required: false,
                        type: cmdTypes.INTEGER,
                        min_value: 1,
                        max_value: 20
                    }
                ]
            },
            {
                name: 'view',
                description: 'View specific feedback details',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'id',
                        description: 'Feedback ID to view',
                        required: true,
                        type: cmdTypes.INTEGER
                    }
                ]
            },
            {
                name: 'reply',
                description: 'Reply to user feedback',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'id',
                        description: 'Feedback ID to reply to',
                        required: true,
                        type: cmdTypes.INTEGER
                    },
                    {
                        name: 'message',
                        description: 'Your reply message',
                        required: true,
                        type: cmdTypes.STRING
                    }
                ]
            },
            {
                name: 'approve',
                description: 'Approve feedback (especially for testimonials)',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'id',
                        description: 'Feedback ID to approve',
                        required: true,
                        type: cmdTypes.INTEGER
                    },
                    {
                        name: 'public',
                        description: 'Make this feedback available as a public testimonial',
                        required: false,
                        type: cmdTypes.BOOLEAN
                    },
                    {
                        name: 'featured',
                        description: 'Feature this testimonial on the website',
                        required: false,
                        type: cmdTypes.BOOLEAN
                    }
                ]
            },
            {
                name: 'unapprove',
                description: 'Unapprove previously approved feedback',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'id',
                        description: 'Feedback ID to unapprove',
                        required: true,
                        type: cmdTypes.INTEGER
                    }
                ]
            },
            {
                name: 'delete',
                description: 'Delete feedback',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'id',
                        description: 'Feedback ID to delete',
                        required: true,
                        type: cmdTypes.INTEGER
                    }
                ]
            },
            {
                name: 'feature',
                description: 'Mark/unmark feedback as featured',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'id',
                        description: 'Feedback ID to update',
                        required: true,
                        type: cmdTypes.INTEGER
                    },
                    {
                        name: 'featured',
                        description: 'Whether to feature this testimonial',
                        required: true,
                        type: cmdTypes.BOOLEAN
                    }
                ]
            }
        ]
    },

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true })

        const subcommand = interaction.options.getSubcommand()
        const staffId = interaction.user.id

        try {
            // Handle different subcommands
            switch (subcommand) {
                case 'list': {
                    const filter = interaction.options.getString('filter') || 'all'
                    const limit = interaction.options.getInteger('limit') || 10

                    // Build query based on filter
                    const query = {}
                    if (filter === 'pending') {
                        query.where = { approved: false }
                    } else if (filter === 'approved') {
                        query.where = { approved: true }
                    } else if (filter === 'testimonials') {
                        query.where = { approved: true, public: true }
                    }

                    // Add ordering and limit
                    query.orderBy = { createdAt: 'desc' }
                    query.take = limit
                    query.include = { user: true }

                    const feedbackList = await client.db.feedback.findMany(query)

                    if (!feedbackList || feedbackList.length === 0) {
                        return interaction.editReply(`No feedback found matching your criteria.`)
                    }

                    // Create embed for feedback list
                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle(
                            `Feedback Management - ${
                                filter === 'pending'
                                    ? 'Pending Approval'
                                    : filter === 'approved'
                                      ? 'Approved Feedback'
                                      : filter === 'testimonials'
                                        ? 'Public Testimonials'
                                        : 'All Feedback'
                            }`
                        )
                        .setDescription(
                            `Found ${feedbackList.length} feedback items. Use \`/feedback-manage view id:[number]\` to see details.`
                        )
                        .setColor(client.colors.primary)
                        .setFooter({ text: client.footer, iconURL: client.logo })

                    // Add fields for each feedback item
                    feedbackList.forEach(feedback => {
                        const username = feedback.user?.username || 'Anonymous'
                        const userId = feedback.userId ? feedback.userId.toString() : 'Anonymous'

                        embed.addFields({
                            name: `#${feedback.id} - ${feedback.approved ? '✅ Approved' : '⏳ Pending'} ${feedback.public ? '🌐 Public' : '🔒 Private'}`,
                            value:
                                `**From:** ${username} (${userId})\n` +
                                `**Date:** <t:${Math.floor(new Date(feedback.createdAt).getTime() / 1000)}:R>\n` +
                                `**Preview:** ${feedback.message.length > 100 ? feedback.message.substring(0, 100) + '...' : feedback.message}`
                        })
                    })

                    return interaction.editReply({ embeds: [embed] })
                }

                case 'view': {
                    const feedbackId = interaction.options.getInteger('id')

                    const feedback = await client.db.feedback.findById(feedbackId, {
                        include: { user: true, replies: true }
                    })

                    if (!feedback) {
                        return interaction.editReply('❌ Feedback not found. Please check the ID and try again.')
                    }

                    // Create detailed embed
                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle(`Feedback #${feedback.id}`)
                        .setDescription(feedback.message)
                        .addFields(
                            {
                                name: 'From',
                                value: feedback.user
                                    ? `${feedback.user.username} (<@${feedback.userId}>)`
                                    : 'Anonymous',
                                inline: true
                            },
                            {
                                name: 'Submitted',
                                value: `<t:${Math.floor(new Date(feedback.createdAt).getTime() / 1000)}:R>`,
                                inline: true
                            },
                            {
                                name: 'Status',
                                value: `${feedback.approved ? '✅ Approved' : '⏳ Pending Review'} ${feedback.public ? '🌐 Public' : '🔒 Private'} ${feedback.featured ? '⭐ Featured' : ''}`,
                                inline: true
                            }
                        )
                        .setColor(client.colors.primary)
                        .setFooter({ text: client.footer, iconURL: client.logo })

                    // Add staff replies if any
                    if (feedback.replies && feedback.replies.length > 0) {
                        embed.addFields({
                            name: '💬 Staff Replies',
                            value: feedback.replies
                                .map(
                                    reply =>
                                        `**<t:${Math.floor(new Date(reply.createdAt).getTime() / 1000)}:R>** by <@${reply.staffId}>\n${reply.message}`
                                )
                                .join('\n\n')
                        })
                    }

                    // Add action buttons
                    const approveButton = new client.Gateway.ButtonBuilder()
                        .setCustomId(`feedback_approve_${feedback.id}`)
                        .setLabel('Approve')
                        .setStyle(client.Gateway.ButtonStyle.Success)
                        .setDisabled(feedback.approved)

                    const featureButton = new client.Gateway.ButtonBuilder()
                        .setCustomId(`feedback_feature_${feedback.id}`)
                        .setLabel(feedback.featured ? 'Unfeature' : 'Feature')
                        .setStyle(
                            feedback.featured
                                ? client.Gateway.ButtonStyle.Secondary
                                : client.Gateway.ButtonStyle.Primary
                        )
                        .setDisabled(!feedback.approved || !feedback.public)

                    const replyButton = new client.Gateway.ButtonBuilder()
                        .setCustomId(`feedback_reply_${feedback.id}`)
                        .setLabel('Reply')
                        .setStyle(client.Gateway.ButtonStyle.Primary)

                    const deleteButton = new client.Gateway.ButtonBuilder()
                        .setCustomId(`feedback_delete_${feedback.id}`)
                        .setLabel('Delete')
                        .setStyle(client.Gateway.ButtonStyle.Danger)

                    const row = new client.Gateway.ActionRowBuilder().addComponents(
                        approveButton,
                        featureButton,
                        replyButton,
                        deleteButton
                    )

                    return interaction.editReply({ embeds: [embed], components: [row] })
                }

                case 'reply': {
                    const feedbackId = interaction.options.getInteger('id')
                    const message = interaction.options.getString('message')

                    // Check if feedback exists
                    const feedback = await client.db.feedback.findById(feedbackId)
                    if (!feedback) {
                        return interaction.editReply('❌ Feedback not found. Please check the ID and try again.')
                    }

                    // Add the reply
                    await client.db.feedback.addReply(feedbackId, staffId, message)

                    // Log the reply
                    if (client.systemLogger) {
                        await client.systemLogger.logUserEvent(
                            staffId,
                            interaction.user.username,
                            'feedback_reply_added',
                            `Staff replied to feedback #${feedbackId}`
                        )
                    }

                    // Notify the user if possible
                    if (feedback.userId) {
                        try {
                            const user = await client.users.fetch(feedback.userId.toString())
                            const userEmbed = new client.Gateway.EmbedBuilder()
                                .setTitle(`✉️ New Reply to Your Feedback`)
                                .setDescription(`You've received a response to your feedback #${feedbackId}:`)
                                .addFields(
                                    {
                                        name: 'Your Original Feedback',
                                        value:
                                            feedback.message.length > 200
                                                ? feedback.message.substring(0, 200) + '...'
                                                : feedback.message
                                    },
                                    {
                                        name: 'Staff Reply',
                                        value: message
                                    }
                                )
                                .setColor(client.colors.primary)
                                .setFooter({
                                    text: 'Use /feedback view id:' + feedbackId + ' to see the full conversation',
                                    iconURL: client.logo
                                })

                            await user.send({ embeds: [userEmbed] }).catch(() => {
                                // User might have DMs disabled - ignore errors
                            })
                        } catch (err) {
                            // Failed to notify user - continue
                        }
                    }

                    return interaction.editReply(`✅ Reply added to feedback #${feedbackId}!`)
                }

                case 'approve': {
                    const feedbackId = interaction.options.getInteger('id')
                    const makePublic = interaction.options.getBoolean('public')
                    const makeFeatured = interaction.options.getBoolean('featured')

                    // Check if feedback exists
                    const feedback = await client.db.feedback.findById(feedbackId)
                    if (!feedback) {
                        return interaction.editReply('❌ Feedback not found. Please check the ID and try again.')
                    }

                    // Update approval status
                    await client.db.feedback.updateApproval(feedbackId, true)

                    // Update public status if specified
                    if (makePublic !== null) {
                        await client.db.feedback.updatePublicStatus(feedbackId, makePublic)
                    }

                    // Update featured status if specified
                    if (makeFeatured !== null) {
                        await client.db.feedback.updateFeaturedStatus(feedbackId, makeFeatured)
                    }

                    // Log the approval
                    if (client.systemLogger) {
                        await client.systemLogger.logUserEvent(
                            staffId,
                            interaction.user.username,
                            'feedback_approved',
                            `Staff approved feedback #${feedbackId}${makePublic ? ' (public testimonial)' : ''}${makeFeatured ? ' (featured)' : ''}`
                        )
                    }

                    return interaction.editReply(
                        `✅ Feedback #${feedbackId} has been approved${makePublic ? ' and marked as a public testimonial' : ''}${makeFeatured ? ' and featured on the website' : ''}!`
                    )
                }

                case 'unapprove': {
                    const feedbackId = interaction.options.getInteger('id')

                    // Check if feedback exists
                    const feedback = await client.db.feedback.findById(feedbackId)
                    if (!feedback) {
                        return interaction.editReply('❌ Feedback not found. Please check the ID and try again.')
                    }

                    // Update approval status
                    await client.db.feedback.updateApproval(feedbackId, false)

                    // Log the unapproval
                    if (client.systemLogger) {
                        await client.systemLogger.logUserEvent(
                            staffId,
                            interaction.user.username,
                            'feedback_unapproved',
                            `Staff unapproved feedback #${feedbackId}`
                        )
                    }

                    return interaction.editReply(
                        `✅ Feedback #${feedbackId} has been unapproved. It is no longer available as a testimonial.`
                    )
                }

                case 'delete': {
                    const feedbackId = interaction.options.getInteger('id')

                    // Check if feedback exists
                    const feedback = await client.db.feedback.findById(feedbackId)
                    if (!feedback) {
                        return interaction.editReply('❌ Feedback not found. Please check the ID and try again.')
                    }

                    // Confirm deletion
                    const confirmButton = new client.Gateway.ButtonBuilder()
                        .setCustomId(`feedback_delete_confirm_${feedbackId}`)
                        .setLabel('Confirm Delete')
                        .setStyle(client.Gateway.ButtonStyle.Danger)

                    const cancelButton = new client.Gateway.ButtonBuilder()
                        .setCustomId(`feedback_delete_cancel`)
                        .setLabel('Cancel')
                        .setStyle(client.Gateway.ButtonStyle.Secondary)

                    const row = new client.Gateway.ActionRowBuilder().addComponents(confirmButton, cancelButton)

                    return interaction.editReply({
                        content: `⚠️ Are you sure you want to delete feedback #${feedbackId}? This cannot be undone.`,
                        components: [row]
                    })
                }

                case 'feature': {
                    const feedbackId = interaction.options.getInteger('id')
                    const setFeatured = interaction.options.getBoolean('featured')

                    // Check if feedback exists
                    const feedback = await client.db.feedback.findById(feedbackId)
                    if (!feedback) {
                        return interaction.editReply('❌ Feedback not found. Please check the ID and try again.')
                    }

                    // Check if the feedback is approved and public
                    if (!feedback.approved || !feedback.public) {
                        return interaction.editReply(
                            '❌ Only approved and public feedback can be featured. Please approve and make it public first.'
                        )
                    }

                    // Update featured status
                    await client.db.feedback.updateFeaturedStatus(feedbackId, setFeatured)

                    // Log the action
                    if (client.systemLogger) {
                        await client.systemLogger.logUserEvent(
                            staffId,
                            interaction.user.username,
                            setFeatured ? 'feedback_featured' : 'feedback_unfeatured',
                            `Staff ${setFeatured ? 'featured' : 'unfeatured'} feedback #${feedbackId}`
                        )
                    }

                    return interaction.editReply(
                        `✅ Feedback #${feedbackId} has been ${setFeatured ? 'featured' : 'unfeatured'} successfully!`
                    )
                }
            }
        } catch (error) {
            console.error('Error in feedback-manage command:', error)

            // Log to system logger
            if (client.systemLogger) {
                await client.systemLogger.logError(
                    'FEEDBACK_MANAGE_ERROR',
                    'Error in feedback management: ' + error.message,
                    {
                        guildId: interaction.guild?.id,
                        userId: interaction.user.id,
                        subcommand,
                        error: error.stack
                    }
                )
            }

            return interaction.editReply('❌ An error occurred while managing feedback. Please try again later.')
        }
    }
}
