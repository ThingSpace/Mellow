export default {
    structure: {
        name: 'privacy',
        category: 'Info',
        description: 'Learn about how your data is handled and our privacy policy.',
        handlers: {
            cooldown: 15000,
            requiredRoles: []
        }
    },
    run: async (client, interaction) => {
        await interaction.reply({
            embeds: [
                new client.Gateway.EmbedBuilder()
                    .setTitle('Privacy Policy')
                    .setDescription(
                        'Mellow values your privacy. We only store the minimum data necessary to provide our services, such as check-in history and preferences. Your data is never sold or shared with third parties. You can request deletion of your data at any time.'
                    )
                    .addFields({
                        name: 'Full Policy',
                        value: '[Read the full privacy policy](https://github.com/ThingSpace/Mellow#privacy-policy)',
                        inline: false
                    })
                    .setColor(client.colors.info)
                    .setFooter({
                        text: client.footer,
                        iconURL: client.logo
                    })
            ]
        })
    }
}
