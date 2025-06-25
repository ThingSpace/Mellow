export default {
    structure: {
        name: 'privacy',
        category: 'Info',
        description: 'Learn about how your data is handled and our privacy policy.',
        handlers: {
            cooldown: 15000,
            requiredRoles: [],
            requiredPerms: []
        }
    },
    run: async (client, interaction) => {
        await interaction.reply({
            embeds: [
                new client.Gateway.EmbedBuilder()
                    .setTitle('Mellow: privacy policy')
                    .setDescription(
                        'Mellow values your privacy. We only store the minimum data necessary to provide our services, such as check-in history and preferences.'
                    )
                    .setThumbnail(client.logo)
                    .setColor(client.colors.primary)
                    .addFields(
                        {
                            name: 'Full Policy',
                            value: '[Read the full privacy policy](https://github.com/ThingSpace/Mellow/blob/master/docs/privacy-policy.md)',
                            inline: false
                        },
                        {
                            name: 'Terms of Service',
                            value: '[View our Terms of Service](https://github.com/ThingSpace/Mellow/blob/master/docs/terms-of-service.md)'
                        }
                    )
                    .setTimestamp()
                    .setFooter({
                        text: client.footer,
                        iconURL: client.logo
                    })
            ]
        })
    }
}
