import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'report',
        category: 'Users',
        description: 'Submit a report or view your report history.',
        handlers: {
            cooldown: 300000, // 5 minutes for submitting
            requiredRoles: []
        },
        options: [
            {
                name: 'submit',
                description: 'Submit a new report',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'message',
                        description: 'Your report details (min 20, max 1000 characters)',
                        required: true,
                        type: cmdTypes.STRING
                    }
                ]
            },
            {
                name: 'view',
                description: 'View your report history and any staff responses',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'id',
                        description: 'Specific report ID to view (optional)',
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

            // Enforce character limits
            if (message.length < 20) {
                return interaction.reply({
                    content: '❌ Your report must be at least 20 characters long. Please provide more details.',
                    ephemeral: true
                })
            }

            if (message.length > 1000) {
                return interaction.reply({
                    content: '❌ Your report is too long (max 1000 characters). Please shorten your message.',
                    ephemeral: true
                })
            }

            try {
                // Store report in database
                await client.db.reports.create({
                    userId: userId,
                    message: message,
                    status: 'open'
                })

                // Log report submission
                if (client.systemLogger) {
                    await client.systemLogger.logUserEvent(
                        userId,
                        interaction.user.username,
                        'report_submitted',
                        'User submitted a report'
                    )
                }

                // Get Mellow configuration for report logging
                const mellowConfig = await client.db.mellow.get()

                // Send to configured report channel if available
                if (mellowConfig.reportLogs) {
                    try {
                        const reportChannel = await client.channels.fetch(mellowConfig.reportLogs.toString())
                        if (reportChannel?.isTextBased()) {
                            const embed = new client.Gateway.EmbedBuilder()
                                .setTitle('🚨 New Report Received')
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
                                        name: 'Status',
                                        value: '🔴 Open',
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
                                .setColor(client.colors.error)
                                .setTimestamp()
                                .setFooter({ text: client.footer, iconURL: client.logo })

                            await reportChannel.send({ embeds: [embed] })
                        }
                    } catch (error) {
                        console.error('Failed to send report to configured channel:', error)
                    }
                }

                return interaction.reply({
                    content:
                        '✅ Thank you for your report! Your message has been submitted to our staff team. You can use `/report view` to check the status of your reports.',
                    ephemeral: true
                })
            } catch (error) {
                console.error('Error submitting report:', error)

                // Log to system logger
                if (client.systemLogger) {
                    await client.systemLogger.logError('REPORT_ERROR', 'Failed to submit report: ' + error.message, {
                        guildId: interaction.guild?.id,
                        userId: interaction.user.id,
                        error: error.stack
                    })
                }

                return interaction.reply({
                    content: '❌ Failed to submit report. Please try again later.',
                    ephemeral: true
                })
            }
        } else if (subcommand === 'view') {
            const reportId = interaction.options.getInteger('id')

            try {
                // Fetch either specific report or all user reports
                let reportData
                if (reportId) {
                    reportData = await client.db.reports.findById(reportId, {
                        include: { replies: true }
                    })

                    // Verify ownership
                    if (!reportData || (reportData.userId && reportData.userId.toString() !== userId)) {
                        return interaction.reply({
                            content: '❌ Report not found or you do not have permission to view it.',
                            ephemeral: true
                        })
                    }

                    // Show single report with replies
                    const statusEmoji = {
                        open: '🔴',
                        investigating: '🟠',
                        resolved: '🟢',
                        closed: '⚫'
                    }

                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle(`Report #${reportData.id}`)
                        .setDescription(reportData.message)
                        .addFields(
                            {
                                name: 'Submitted',
                                value: `<t:${Math.floor(new Date(reportData.createdAt).getTime() / 1000)}:R>`,
                                inline: true
                            },
                            {
                                name: 'Status',
                                value: `${statusEmoji[reportData.status] || '⚪'} ${reportData.status.charAt(0).toUpperCase() + reportData.status.slice(1)}`,
                                inline: true
                            }
                        )
                        .setColor(
                            reportData.status === 'open'
                                ? client.colors.error
                                : reportData.status === 'investigating'
                                  ? client.colors.warning
                                  : reportData.status === 'resolved'
                                    ? client.colors.success
                                    : client.colors.secondary
                        )
                        .setTimestamp()
                        .setFooter({ text: client.footer, iconURL: client.logo })

                    // Add replies if any exist
                    if (reportData.replies && reportData.replies.length > 0) {
                        embed.addFields({
                            name: '💬 Staff Responses',
                            value: reportData.replies
                                .map(
                                    reply =>
                                        `**<t:${Math.floor(new Date(reply.createdAt).getTime() / 1000)}:R>**\n${reply.message}`
                                )
                                .join('\n\n')
                        })
                    }

                    return interaction.reply({ embeds: [embed], ephemeral: true })
                } else {
                    // Show report history
                    reportData = await client.db.reports.findByUserId(userId)

                    if (!reportData || reportData.length === 0) {
                        return interaction.reply({
                            content:
                                "You haven't submitted any reports yet. Use `/report submit` if you need to report an issue.",
                            ephemeral: true
                        })
                    }

                    // Create a paginated view for multiple report items
                    const embed = new client.Gateway.EmbedBuilder()
                        .setTitle('Your Report History')
                        .setDescription(
                            `You've submitted ${reportData.length} report${reportData.length > 1 ? 's' : ''}.` +
                                `\nUse \`/report view id:[number]\` to see details and any staff responses.`
                        )
                        .setColor(client.colors.primary)
                        .setFooter({ text: client.footer, iconURL: client.logo })

                    // Status emojis
                    const statusEmoji = {
                        open: '🔴',
                        investigating: '🟠',
                        resolved: '🟢',
                        closed: '⚫'
                    }

                    // Show the 5 most recent reports
                    const recentReports = reportData.slice(0, 5)
                    recentReports.forEach(report => {
                        const hasReplies = report.replies && report.replies.length > 0
                        const status = report.status.charAt(0).toUpperCase() + report.status.slice(1)

                        embed.addFields({
                            name: `#${report.id} - ${statusEmoji[report.status] || '⚪'} ${status} ${hasReplies ? '- 💬 Has Responses' : ''}`,
                            value:
                                `**Submitted:** <t:${Math.floor(new Date(report.createdAt).getTime() / 1000)}:R>\n` +
                                `**Message:** ${report.message.length > 100 ? report.message.substring(0, 100) + '...' : report.message}`
                        })
                    })

                    return interaction.reply({ embeds: [embed], ephemeral: true })
                }
            } catch (error) {
                console.error('Error viewing report:', error)

                // Log to system logger
                if (client.systemLogger) {
                    await client.systemLogger.logError('REPORT_VIEW_ERROR', 'Failed to view report: ' + error.message, {
                        guildId: interaction.guild?.id,
                        userId: interaction.user.id,
                        reportId,
                        error: error.stack
                    })
                }

                return interaction.reply({
                    content: '❌ Failed to retrieve report. Please try again later.',
                    ephemeral: true
                })
            }
        }
    }
}
