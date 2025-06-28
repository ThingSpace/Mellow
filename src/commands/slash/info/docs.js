export default {
    structure: {
        name: 'docs',
        category: 'Info',
        description: 'Get the link to the full Mellow documentation and key resources.',
        handlers: {
            cooldown: 15000,
            requiredRoles: []
        }
    },
    run: async (client, interaction) => {
        return interaction.reply({
            embeds: [
                new client.Gateway.EmbedBuilder()
                    .setTitle('Mellow Documentation')
                    .setDescription(
                        '📚 Access the full documentation for Mellow, including guides, command reference, privacy policy, and more.\n\n' +
                            '[Open Documentation](https://mellow.athing.space)\n\n' +
                            'Key Sections:\n' +
                            '- [Getting Started](https://mellow.athing.space/getting-started)\n' +
                            '- [Commands Reference](https://mellow.athing.space/commands)\n' +
                            '- [Privacy Policy](https://mellow.athing.space/privacy-policy)\n' +
                            '- [Terms of Service](https://mellow.athing.space/terms-of-service)\n' +
                            '- [Contributing](https://mellow.athing.space/contributing)'
                    )
                    .setColor(client.colors.primary)
                    .setFooter({ text: client.footer, iconURL: client.logo })
                    .setTimestamp()
            ]
        })
    }
}
