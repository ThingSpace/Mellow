export default {
    structure: {
        name: 'twitter',
        category: 'Info',
        description: 'Get the latest updates and news from Mellow on Twitter.',
        handlers: {
            cooldown: 15000,
            requiredRoles: []
        }
    },
    run: async (client, interaction) => {
        await interaction.reply({
            embeds: [
                new client.Gateway.EmbedBuilder()
                    .setTitle('Follow Mellow on Twitter')
                    .setDescription(
                        'Stay updated with the latest news, updates, and announcements from Mellow by following us on Twitter!'
                    )
                    .addFields({
                        name: 'Twitter',
                        value: '[Follow us on Twitter](https://twitter.com/HeyItsMellow)',
                        inline: false
                    })
                    .setColor(client.colors.primary)
                    .setFooter({
                        text: client.footer,
                        iconURL: client.logo
                    })
            ]
        })
    }
}
