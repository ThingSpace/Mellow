import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'report',
        category: 'Users',
        description: 'Report a user, bug, or safety concern.',
        handlers: {
            cooldown: 300000, // 5 minutes
            requiredRoles: []
        },
        options: [
            {
                name: 'type',
                description: 'Type of report',
                required: true,
                type: cmdTypes.STRING,
                choices: [
                    { name: 'User Behavior', value: 'user' },
                    { name: 'Bug Report', value: 'bug' },
                    { name: 'Safety Concern', value: 'safety' },
                    { name: 'Other', value: 'other' }
                ]
            },
            {
                name: 'message',
                description: 'Detailed description of the issue',
                required: true,
                type: cmdTypes.STRING
            },
            {
                name: 'user',
                description: 'User involved (if applicable)',
                required: false,
                type: cmdTypes.USER
            }
        ]
    },
    run: async (client, interaction) => {
        const type = interaction.options.getString('type')
        const message = interaction.options.getString('message')
        const reportedUser = interaction.options.getUser('user')
        const reporterId = interaction.user.id

        try {
            // Store report in database
            await client.db.reports.create({
                userId: reporterId,
                message: `[${type.toUpperCase()}] ${message}${reportedUser ? ` | Reported User: ${reportedUser.tag} (${reportedUser.id})` : ''}`
            })

            // Get Mellow configuration for report logging
            const mellowConfig = await client.db.mellow.get()

            // Send to configured report channel if available
            if (mellowConfig.reportLogs) {
                try {
                    const reportChannel = await client.channels.fetch(mellowConfig.reportLogs.toString())

                    if (reportChannel?.isTextBased()) {
                        const embed = new client.Gateway.EmbedBuilder()
                            .setTitle(`🚨 New ${type.charAt(0).toUpperCase() + type.slice(1)} Report`)
                            .setDescription(message)
                            .addFields(
                                {
                                    name: 'Reporter',
                                    value: `<@${reporterId}>`,
                                    inline: true
                                },
                                {
                                    name: 'Reporter ID',
                                    value: reporterId,
                                    inline: true
                                },
                                {
                                    name: 'Report Type',
                                    value: type.toUpperCase(),
                                    inline: true
                                }
                            )
                            .setColor(type === 'safety' ? client.colors.error : client.colors.warning)
                            .setTimestamp()
                            .setFooter({ text: client.footer, iconURL: client.logo })

                        if (reportedUser) {
                            embed.addFields(
                                {
                                    name: 'Reported User',
                                    value: `<@${reportedUser.id}>`,
                                    inline: true
                                },
                                {
                                    name: 'Reported User ID',
                                    value: reportedUser.id,
                                    inline: true
                                }
                            )
                        }

                        if (interaction.guild) {
                            embed.addFields({
                                name: 'Guild',
                                value: `${interaction.guild.name} (${interaction.guild.id})`,
                                inline: false
                            })
                        }

                        await reportChannel.send({ embeds: [embed] })
                    }
                } catch (error) {
                    console.error('Failed to send report to configured channel:', error)
                }
            }

            return interaction.reply({
                content: '✅ Thank you for your report! It has been submitted to the moderation team for review.',
                ephemeral: true
            })
        } catch (error) {
            console.error('Error submitting report:', error)
            return interaction.reply({
                content: '❌ Failed to submit report. Please try again later.',
                ephemeral: true
            })
        }
    }
}
