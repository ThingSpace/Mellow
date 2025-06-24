/**
 * Handles Mellow help/about message responses
 * @class MessageHandler
 */
export class MessageHandler {
    constructor(client) {
        this.client = client
    }

    get send() {
        return {
            help: async message => {
                return message.channel.send({
                    embeds: [
                        new this.client.Gateway.EmbedBuilder()
                            .setTitle('Mellow Help')
                            .setDescription('Here are the available features and commands:')
                            .setColor(this.client.colors.primary)
                            .addFields([
                                {
                                    name: '`/checkin`',
                                    value: 'Start an emotional check-in',
                                    inline: true
                                },
                                {
                                    name: '`/ghostletter`',
                                    value: 'Write a private ghost letter',
                                    inline: true
                                },
                                {
                                    name: '`/coping`',
                                    value: 'Get a coping tool or prompt',
                                    inline: true
                                },
                                {
                                    name: '`/about`',
                                    value: 'Learn more about Mellow',
                                    inline: true
                                }
                            ])
                            .setThumbnail(this.client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: this.client.logo
                            })
                    ]
                })
            },

            about: async message => {
                return message.channel.send({
                    embeds: [
                        new this.client.Gateway.EmbedBuilder()
                            .setTitle('About Mellow')
                            .setDescription(
                                [
                                    'Mellow is your AI-powered mental health companion, living right inside Discord.',
                                    '',
                                    "It's not a therapist — but it *is* a safe, supportive presence you can talk to when things feel heavy, confusing, or just too much.",
                                    '',
                                    'Mellow offers emotional check-ins, ghost letter mode, coping tools, and gentle support — always private, never judgmental.'
                                ].join('\n')
                            )
                            .setColor(this.client.colors.primary)
                            .setThumbnail(this.client.logo)
                            .setTimestamp()
                            .setFooter({
                                text: client.footer,
                                iconURL: this.client.logo
                            })
                    ]
                })
            }
        }
    }
}
