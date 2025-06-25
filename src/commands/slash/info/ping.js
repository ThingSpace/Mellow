export default {
    structure: {
        name: 'ping',
        category: 'Info',
        description: "Check the bot's latency and uptime.",
        handlers: {
            cooldown: 10,
            requiredRoles: []
        }
    },
    run: async (client, interaction) => {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true })
        const latency = sent.createdTimestamp - interaction.createdTimestamp
        const uptime = client.uptime ? Math.floor(client.uptime / 1000) : 0
        await interaction.editReply({
            embeds: [
                new client.Gateway.EmbedBuilder()
                    .setTitle('Pong!')
                    .addFields(
                        { name: 'Latency', value: `${latency}ms`, inline: true },
                        {
                            name: 'Uptime',
                            value: `<t:${Math.floor((Date.now() - client.uptime) / 1000)}:R>`,
                            inline: true
                        }
                    )
                    .setColor(client.colors.info)
                    .setFooter({ text: client.footer, iconURL: client.logo })
            ]
        })
    }
}
