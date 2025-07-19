import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import { log } from '../../../functions/logger.js'
import { PermissionFlagsBits } from 'discord.js'

export default {
    structure: {
        name: 'report-manage',
        category: 'Admin',
        description: 'Manage user reports and provide responses',
        handlers: {
            cooldown: 10000,
            requiredPerms: [PermissionFlagsBits.ManageMessages],
            requiredRoles: []
        },
        options: [
            {
                name: 'view',
                description: 'View report details and history',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'id',
                        description: 'Report ID to view',
                        required: true,
                        type: cmdTypes.INTEGER
                    }
                ]
            },
            {
                name: 'list',
                description: 'List reports by status',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'status',
                        description: 'Filter by status',
                        required: false,
                        type: cmdTypes.STRING,
                        choices: [
                            { name: 'Open', value: 'open' },
                            { name: 'Investigating', value: 'investigating' },
                            { name: 'Resolved', value: 'resolved' },
                            { name: 'Closed', value: 'closed' }
                        ]
                    },
                    {
                        name: 'limit',
                        description: 'Number of reports to show (default: 10)',
                        required: false,
                        type: cmdTypes.INTEGER,
                        min_value: 1,
                        max_value: 25
                    }
                ]
            },
            {
                name: 'status',
                description: 'Update report status',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'id',
                        description: 'Report ID to update',
                        required: true,
                        type: cmdTypes.INTEGER
                    },
                    {
                        name: 'new_status',
                        description: 'New status to set',
                        required: true,
                        type: cmdTypes.STRING,
                        choices: [
                            { name: 'Investigating', value: 'investigating' },
                            { name: 'Resolved', value: 'resolved' },
                            { name: 'Closed', value: 'closed' }
                        ]
                    }
                ]
            },
            {
                name: 'reply',
                description: 'Reply to a report',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'id',
                        description: 'Report ID to reply to',
                        required: true,
                        type: cmdTypes.INTEGER
                    },
                    {
                        name: 'message',
                        description: 'Your response to the user',
                        required: true,
                        type: cmdTypes.STRING
                    },
                    {
                        name: 'update_status',
                        description: 'Also update report status',
                        required: false,
                        type: cmdTypes.STRING,
                        choices: [
                            { name: 'Investigating', value: 'investigating' },
                            { name: 'Resolved', value: 'resolved' },
                            { name: 'Closed', value: 'closed' }
                        ]
                    }
                ]
            }
        ]
    },

    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand()

        // Check if user has appropriate permissions
        const isStaff = await isStaffMember(client, interaction)
        if (!isStaff) {
            return interaction.reply({
                content: '❌ You do not have permission to manage reports.',
                ephemeral: true
            })
        }

        try {
            // Handle different subcommands
            switch (subcommand) {
                case 'view':
                    return handleViewReport(client, interaction)

                case 'list':
                    return handleListReports(client, interaction)

                case 'status':
                    return handleUpdateStatus(client, interaction)

                case 'reply':
                    return handleReplyToReport(client, interaction)

                default:
                    return interaction.reply({
                        content: '❌ Unknown subcommand.',
                        ephemeral: true
                    })
            }
        } catch (error) {
            log(`Error in report-manage command: ${error.message}`, 'error')

            return interaction.reply({
                content: `❌ An error occurred: ${error.message}`,
                ephemeral: true
            })
        }
    }
}

/**
 * Check if user is staff (admin/mod/support)
 */
async function isStaffMember(client, interaction) {
    // Get user's role from database
    const userId = interaction.user.id
    const user = await client.db.users.findById(userId)

    if (!user) return false

    // Check if user has staff role
    return ['OWNER', 'ADMIN', 'MOD', 'SUPPORT'].includes(user.role)
}

/**
 * Handle the 'view' subcommand to show report details
 */
async function handleViewReport(client, interaction) {
    const reportId = interaction.options.getInteger('id')

    // Fetch report with replies
    const report = await client.db.reports.findById(reportId, {
        include: { replies: true }
    })

    if (!report) {
        return interaction.reply({
            content: `❌ Report #${reportId} not found.`,
            ephemeral: true
        })
    }

    // Format the report data
    const statusEmoji = {
        open: '🔴',
        investigating: '🟠',
        resolved: '🟢',
        closed: '⚫'
    }

    // Get username if possible
    let username = 'Unknown User'
    if (report.userId) {
        try {
            const user = await client.users.fetch(report.userId.toString())
            username = user.tag
        } catch (e) {
            // Use database username if available
            if (report.user?.username) {
                username = report.user.username
            }
        }
    }

    const embed = new client.Gateway.EmbedBuilder()
        .setTitle(`Report #${report.id}`)
        .setDescription(report.message)
        .addFields(
            {
                name: 'Submitted By',
                value: report.userId ? `<@${report.userId}> (${username})` : 'Anonymous',
                inline: true
            },
            {
                name: 'Status',
                value: `${statusEmoji[report.status] || '⚪'} ${report.status.charAt(0).toUpperCase() + report.status.slice(1)}`,
                inline: true
            },
            {
                name: 'Submitted',
                value: `<t:${Math.floor(new Date(report.createdAt).getTime() / 1000)}:F>`,
                inline: true
            }
        )
        .setColor(
            report.status === 'open'
                ? client.colors.error
                : report.status === 'investigating'
                  ? client.colors.warning
                  : report.status === 'resolved'
                    ? client.colors.success
                    : client.colors.secondary
        )
        .setTimestamp()
        .setFooter({ text: client.footer, iconURL: client.logo })

    // Add staff responses if any
    if (report.replies && report.replies.length > 0) {
        const responseField = {
            name: '💬 Staff Responses',
            value: ''
        }

        for (const reply of report.replies) {
            let staffName = 'Staff'
            if (reply.staffId) {
                try {
                    const staffUser = await client.users.fetch(reply.staffId.toString())
                    staffName = staffUser.tag
                } catch (e) {
                    // Keep default 'Staff'
                }
            }

            responseField.value += `**${staffName}** - <t:${Math.floor(new Date(reply.createdAt).getTime() / 1000)}:R>\n${reply.message}\n\n`
        }

        embed.addFields(responseField)
    }

    // Add action buttons
    const row = new client.Gateway.ActionRowBuilder().addComponents(
        new client.Gateway.ButtonBuilder()
            .setCustomId(`report_investigate_${report.id}`)
            .setLabel('Investigating')
            .setStyle(client.Gateway.ButtonStyle.Primary)
            .setDisabled(report.status === 'investigating'),
        new client.Gateway.ButtonBuilder()
            .setCustomId(`report_resolve_${report.id}`)
            .setLabel('Resolved')
            .setStyle(client.Gateway.ButtonStyle.Success)
            .setDisabled(report.status === 'resolved'),
        new client.Gateway.ButtonBuilder()
            .setCustomId(`report_close_${report.id}`)
            .setLabel('Close')
            .setStyle(client.Gateway.ButtonStyle.Secondary)
            .setDisabled(report.status === 'closed'),
        new client.Gateway.ButtonBuilder()
            .setCustomId(`report_reply_${report.id}`)
            .setLabel('Reply')
            .setStyle(client.Gateway.ButtonStyle.Primary)
    )

    // Send the reply and store the response for collector attachment
    const response = await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
        fetchReply: true
    })

    // Set up button handler
    const filter = i => i.user.id === interaction.user.id && i.customId.startsWith('report_')

    // Create collector on the response message, not the channel
    const collector = response.createMessageComponentCollector({
        filter,
        time: 300000 // 5 minutes
    })

    collector.on('collect', async i => {
        const [_, action, id] = i.customId.split('_')

        if (action === 'reply') {
            // Create modal for reply
            const modal = new client.Gateway.ModalBuilder()
                .setCustomId(`report_modal_${id}`)
                .setTitle(`Reply to Report #${id}`)

            const replyInput = new client.Gateway.TextInputBuilder()
                .setCustomId('reply_content')
                .setLabel('Your response')
                .setStyle(client.Gateway.TextInputStyle.Paragraph)
                .setMinLength(5)
                .setMaxLength(1000)
                .setPlaceholder('Type your response to the user here...')
                .setRequired(true)

            const actionRow = new client.Gateway.ActionRowBuilder().addComponents(replyInput)
            modal.addComponents(actionRow)

            await i.showModal(modal)

            // Set up a collector for the modal submit
            const modalSubmitInteraction = await i
                .awaitModalSubmit({
                    filter: modalInteraction =>
                        modalInteraction.customId === `report_modal_${id}` &&
                        modalInteraction.user.id === interaction.user.id,
                    time: 300000 // 5 minutes
                })
                .catch(() => null)

            if (modalSubmitInteraction) {
                const replyContent = modalSubmitInteraction.fields.getTextInputValue('reply_content')

                try {
                    // Add the reply
                    await client.db.reports.addReply(parseInt(id), interaction.user.id, replyContent)

                    await modalSubmitInteraction.reply({
                        content: `✅ Your reply to report #${id} has been sent to the user.`,
                        ephemeral: true
                    })

                    // Log reply
                    if (client.systemLogger) {
                        await client.systemLogger.logUserEvent(
                            interaction.user.id,
                            interaction.user.username,
                            'report_reply_sent',
                            `Staff replied to report #${id}`
                        )
                    }
                } catch (error) {
                    await modalSubmitInteraction.reply({
                        content: `❌ Failed to send reply: ${error.message}`,
                        ephemeral: true
                    })
                }
            }
        } else {
            // Update status (investigate, resolve, close)
            const statusMap = {
                investigate: 'investigating',
                resolve: 'resolved',
                close: 'closed'
            }

            const newStatus = statusMap[action]
            if (!newStatus) return

            try {
                await client.db.reports.updateStatus(parseInt(id), newStatus)

                await i.update({
                    content: `✅ Report #${id} status updated to **${newStatus}**`,
                    components: []
                })

                // Log status change
                if (client.systemLogger) {
                    await client.systemLogger.logUserEvent(
                        interaction.user.id,
                        interaction.user.username,
                        'report_status_updated',
                        `Staff updated report #${id} status to ${newStatus}`
                    )
                }
            } catch (error) {
                await i.update({
                    content: `❌ Failed to update report status: ${error.message}`,
                    components: []
                })
            }
        }
    })
}

/**
 * Handle the 'list' subcommand to show multiple reports
 */
async function handleListReports(client, interaction) {
    const status = interaction.options.getString('status')
    const limit = interaction.options.getInteger('limit') || 10

    // Build query
    const query = {
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { user: true }
    }

    if (status) {
        query.where = { status }
    }

    // Fetch reports
    const reports = await client.db.reports.findMany(query)

    if (!reports || reports.length === 0) {
        return interaction.reply({
            content: status ? `📝 No reports with status "${status}" found.` : `📝 No reports found.`,
            ephemeral: true
        })
    }

    // Format the report data
    const statusEmoji = {
        open: '🔴',
        investigating: '🟠',
        resolved: '🟢',
        closed: '⚫'
    }

    const embed = new client.Gateway.EmbedBuilder()
        .setTitle('📋 Report Management')
        .setDescription(`Showing ${reports.length} ${status ? `${status} ` : ''}reports`)
        .setColor(client.colors.primary)
        .setTimestamp()
        .setFooter({ text: client.footer, iconURL: client.logo })

    for (const report of reports) {
        const userDisplay = report.userId ? `<@${report.userId}> (${report.user?.username || 'Unknown'})` : 'Anonymous'

        embed.addFields({
            name: `#${report.id} - ${statusEmoji[report.status]} ${report.status.charAt(0).toUpperCase() + report.status.slice(1)}`,
            value:
                `**From:** ${userDisplay}\n` +
                `**Date:** <t:${Math.floor(new Date(report.createdAt).getTime() / 1000)}:R>\n` +
                `**Preview:** ${report.message.length > 100 ? report.message.substring(0, 100) + '...' : report.message}`,
            inline: false
        })
    }

    // Create select menu for quick actions
    const selectOptions = reports.map(report => ({
        label: `#${report.id} - ${report.status.charAt(0).toUpperCase() + report.status.slice(1)}`,
        description: report.message.substring(0, 50) + (report.message.length > 50 ? '...' : ''),
        value: `${report.id}`
    }))

    const row = new client.Gateway.ActionRowBuilder().addComponents(
        new client.Gateway.StringSelectMenuBuilder()
            .setCustomId('report_select')
            .setPlaceholder('Select a report to view details')
            .addOptions(selectOptions)
    )

    const response = await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
        fetchReply: true // Add this to get the message object back
    })

    // Set up select menu handler
    const filter = i => i.user.id === interaction.user.id && i.customId === 'report_select'

    const collector = response.createMessageComponentCollector({
        filter,
        time: 300000 // 5 minutes
    })

    collector.on('collect', async i => {
        const reportId = parseInt(i.values[0])

        // Call the view report handler with the selected ID
        await i.deferUpdate()

        // Get the report
        const report = await client.db.reports.findById(reportId, {
            include: { replies: true }
        })

        if (!report) {
            return i.editReply({
                content: `❌ Report #${reportId} not found.`,
                embeds: [],
                components: []
            })
        }

        // Use the view report logic to show details
        await handleViewReport(client, {
            ...interaction,
            options: {
                getInteger: () => reportId
            },
            reply: i.editReply.bind(i)
        })
    })
}

/**
 * Handle the 'status' subcommand to update report status
 */
async function handleUpdateStatus(client, interaction) {
    const reportId = interaction.options.getInteger('id')
    const newStatus = interaction.options.getString('new_status')

    try {
        // Check if report exists
        const report = await client.db.reports.findById(reportId)

        if (!report) {
            return interaction.reply({
                content: `❌ Report #${reportId} not found.`,
                ephemeral: true
            })
        }

        // Update status
        await client.db.reports.updateStatus(reportId, newStatus)

        // Log status change
        if (client.systemLogger) {
            await client.systemLogger.logUserEvent(
                interaction.user.id,
                interaction.user.username,
                'report_status_updated',
                `Staff updated report #${reportId} status to ${newStatus}`
            )
        }

        return interaction.reply({
            content: `✅ Report #${reportId} status updated to **${newStatus}**.`,
            ephemeral: true
        })
    } catch (error) {
        log(`Error updating report status: ${error.message}`, 'error')

        return interaction.reply({
            content: `❌ Failed to update report status: ${error.message}`,
            ephemeral: true
        })
    }
}

/**
 * Handle the 'reply' subcommand to respond to a report
 */
async function handleReplyToReport(client, interaction) {
    const reportId = interaction.options.getInteger('id')
    const message = interaction.options.getString('message')
    const newStatus = interaction.options.getString('update_status')

    try {
        // Check if report exists
        const report = await client.db.reports.findById(reportId)

        if (!report) {
            return interaction.reply({
                content: `❌ Report #${reportId} not found.`,
                ephemeral: true
            })
        }

        // Add reply
        await client.db.reports.addReply(reportId, interaction.user.id, message)

        // Update status if requested
        if (newStatus) {
            await client.db.reports.updateStatus(reportId, newStatus)
        }

        // Log reply
        if (client.systemLogger) {
            await client.systemLogger.logUserEvent(
                interaction.user.id,
                interaction.user.username,
                'report_reply_sent',
                `Staff replied to report #${reportId}`
            )
        }

        return interaction.reply({
            content: `✅ Your reply to report #${reportId} has been sent to the user.${
                newStatus ? ` Status updated to **${newStatus}**.` : ''
            }`,
            ephemeral: true
        })
    } catch (error) {
        log(`Error replying to report: ${error.message}`, 'error')

        return interaction.reply({
            content: `❌ Failed to send reply: ${error.message}`,
            ephemeral: true
        })
    }
}
