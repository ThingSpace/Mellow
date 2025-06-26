export default {
    structure: {
        name: 'feedback',
        category: 'Info',
        description: 'Send feedback or suggestions to the Mellow team.',
        handlers: {
            cooldown: 15000,
            requiredRoles: []
        },
        options: [
            {
                name: 'message',
                description: 'Your feedback or suggestion',
                required: true,
                type: 3
            }
        ]
    },
    run: async (client, interaction) => {
        const message = interaction.options.getString('message')
        const userId = interaction.user?.id ? BigInt(interaction.user.id) : null

        await client.db.feedback.create({
            userId,
            message
        })

        const logChannel = client.channels.cache.get('1387375352837308526')

        if (logChannel) {
            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('[FEEDBACK]: new submission')
                .setDescription("Everyone's opinion matters, remember that!")
                .setThumbnail(client.logo)
                .setColor(client.colors.primary)
                .addFields(
                    {
                        name: 'User',
                        value: `${interaction.user.tag} (${interaction.user.id})`,
                        inline: false
                    },
                    {
                        name: 'Guild',
                        value: interaction.guild ? `${interaction.guild.name} (${interaction.guild.id})` : 'DM',
                        inline: false
                    },
                    {
                        name: 'Channel',
                        value: interaction.channel ? `<#${interaction.channel.id}> (${interaction.channel.id})` : 'DM',
                        inline: false
                    },
                    {
                        name: 'Message',
                        value: message,
                        inline: false
                    }
                )
                .setTimestamp()
                .setFooter({
                    text: client.footer,
                    iconURL: client.logo
                })

            await logChannel.send({ embeds: [embed] })
        }

        return interaction.reply({
            content: 'Thank you for your feedback, i have forwarded it to the team! 💜',
            ephemeral: false
        })
    }
}
