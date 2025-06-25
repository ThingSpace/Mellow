export default {
    structure: {
        name: 'about',
        category: 'Info',
        description: 'Learn about Mellow and our mission.',
        handlers: {
            cooldown: 15000,
            requiredRoles: []
        }
    },
    run: async (client, interaction) => {
        await interaction.reply({
            embeds: [
                new client.Gateway.EmbedBuilder()
                    .setTitle('About Mellow')
                    .setDescription(
                        'Mellow is your AI-powered mental health companion for Discord. Our mission is to provide a safe, supportive, and non-judgmental space for everyone. Mellow is not a replacement for therapy, but a friend you can talk to when you need support, reflection, or just someone to listen.'
                    )
                    .addFields(
                        {
                            name: 'Open Source',
                            value: '[GitHub Repository](https://github.com/ThingSpace/Mellow)',
                            inline: false
                        },
                        {
                            name: 'Important Note',
                            value: 'Mellow is not a substitute for professional help. If you are in crisis, please reach out to a qualified professional or helpline.',
                            inline: false
                        }
                    )
                    .setColor(client.colors.primary)
                    .setFooter({
                        text: client.footer,
                        iconURL: client.logo
                    })
            ]
        })
    }
}
