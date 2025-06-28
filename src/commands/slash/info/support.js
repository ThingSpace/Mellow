export default {
    structure: {
        name: 'support',
        category: 'Info',
        description: 'Get help with Mellow or join our support community.',
        handlers: {
            cooldown: 15000,
            requiredRoles: []
        }
    },
    run: async (client, interaction) => {
        await interaction.reply({
            embeds: [
                new client.Gateway.EmbedBuilder()
                    .setTitle('Support & Community')
                    .setDescription('Need help with Mellow? Join our support server or reach out to the maintainers!')
                    .addFields(
                        {
                            name: 'Support Server',
                            value: '[Join the Discord Support Server](https://discord.gg/C3ZuXPP7Hc)',
                            inline: false
                        },
                        {
                            name: 'Contact',
                            value: 'Open an issue on [GitHub](https://github.com/ThingSpace/Mellow/issues) or use /feedback in this server.',
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
