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
                        '📚 Access the complete documentation for Mellow, organized by topic for easy navigation.\n\n' +
                            '**[📖 Open Full Documentation](https://mellow.athing.space)**\n\n' +
                            '**Quick Access by Section:**\n' +
                            '📖 **[User Guides](https://mellow.athing.space/guides/)** - Setup, privacy, troubleshooting\n' +
                            '📚 **[Reference](https://mellow.athing.space/reference/)** - Commands, features, API docs\n' +
                            '🛠️ **[Technical](https://mellow.athing.space/technical/)** - Developer resources\n\n' +
                            '**Essential Pages:**\n' +
                            '• [Getting Started](https://mellow.athing.space/guides/getting-started/)\n' +
                            '• [Commands Reference](https://mellow.athing.space/reference/commands/)\n' +
                            '• [Privacy Controls](https://mellow.athing.space/guides/privacy-controls/)\n' +
                            '• [Privacy Policy](https://mellow.athing.space/privacy-policy/)\n' +
                            '• [Contributing Guide](https://mellow.athing.space/contributing/)'
                    )
                    .setColor(client.colors.primary)
                    .setFooter({ text: client.footer, iconURL: client.logo })
                    .setTimestamp()
            ]
        })
    }
}
