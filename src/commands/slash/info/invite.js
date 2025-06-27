export default {
    structure: {
        name: 'invite',
        category: 'Info',
        description: 'Get the invite link for Mellow',
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
                        .setTitle('Mellow Invite Link')
                        .setDescription(
                            'Hey there, you can add me using [this](https://discord.com/oauth2/authorize?client_id=1386810331367608371) link!'
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
