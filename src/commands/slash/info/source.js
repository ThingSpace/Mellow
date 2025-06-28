export default {
    structure: {
        name: 'source',
        category: 'Info',
        description: 'Mellow is open-source, get the link to our repo and project info here!',
        handlers: {
            cooldown: 15000,
            requiredRoles: []
        }
    },

    run: async (client, interaction) => {
        try {
            return interaction.reply({
                embeds: [
                    new client.Gateway.EmbedBuilder()
                        .setTitle('Mellow: Open Source Project')
                        .setDescription(
                            'Mellow is an AI-powered mental health companion for Discord. It is not a therapist, but a safe, supportive presence you can talk to when things feel heavy, confusing, or just too much.'
                        )
                        .addFields(
                            {
                                name: 'GitHub Repository',
                                value: '[ThingSpace/Mellow](https://github.com/ThingSpace/Mellow)',
                                inline: false
                            },
                            {
                                name: 'Documentation',
                                value: '[Mellow Docs](https://mellow.athing.space)',
                                inline: false
                            },
                            {
                                name: 'License',
                                value: 'AGPL-3.0',
                                inline: true
                            },
                            {
                                name: 'Contributing',
                                value: 'We welcome contributions! See the [contributing guidelines](https://github.com/ThingSpace/Mellow#contributing) in the README.',
                                inline: false
                            },
                            {
                                name: 'Key Features',
                                value: [
                                    '• Emotional Check-Ins',
                                    '• Ghost Letter Mode',
                                    '• Coping Tools & Prompts',
                                    '• Crisis Routing',
                                    '• Late-Night Companion Mode'
                                ].join('\n'),
                                inline: false
                            },
                            {
                                name: 'Important Note',
                                value: 'Mellow is not a replacement for therapy or professional help. It is here for support, reflection, and companionship not diagnosis or treatment.',
                                inline: false
                            }
                        )
                        .setColor(client.colors.success)
                        .setThumbnail(client.logo)
                        .setTimestamp()
                        .setFooter({
                            text: client.footer,
                            iconURL: client.logo
                        })
                ]
            })
        } catch (error) {
            console.error('Error handling interaction:', error)
            return interaction.reply({
                embeds: [
                    new client.Gateway.EmbedBuilder()
                        .setTitle('ERROR: unknown error')
                        .setDescription(
                            'An unknown error occurred while processing your request. Please try again later.'
                        )
                        .setColor(client.colors.error)
                        .setThumbnail(client.logo)
                        .setTimestamp()
                        .setFooter({
                            text: client.footer,
                            iconURL: client.logo
                        })
                ]
            })
        }
    }
}
