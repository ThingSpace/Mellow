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
                            '**[📖 Open Full Documentation](https://mymellow.space/docs)**\n\n' +
                            '**Quick Access by Section:**\n' +
                            '📖 **[Commands](https://mymellow.space/docs/core/commands)** - In-depth command references\n' +
                            '📚 **[Reference](https://mymellow.space/docs/core/references)** - Commands, features, API docs\n' +
                            '🛠️ **[Technical](https://mymellow.space/docs/core/technical)** - Developer resources\n\n' +
                            '**Essential Pages:**\n' +
                            '• [Getting Started](https://mymellow.space/docs/core/getting-started)\n' +
                            '• [Commands Reference](https://mymellow.space/docs/core/commands)\n' +
                            '• [Privacy Controls](https://mymellow.space/docs/core/security/privacy-controls)\n' +
                            '• [Privacy Policy](https://mymellow.space/privacy)\n' +
                            '• [Contributing Guide](https://mymellow.space/docs/core/technical/contributing)'
                    )
                    .setColor(client.colors.primary)
                    .setFooter({ text: client.footer, iconURL: client.logo })
                    .setTimestamp()
            ]
        })
    }
}
