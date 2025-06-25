export default {
    structure: {
        name: 'report',
        category: 'Info',
        description: 'Report a bug or inappropriate content to the Mellow team.',
        handlers: {
            cooldown: 600,
            requiredRoles: []
        },
        options: [
            {
                name: 'message',
                description: 'Describe the bug or issue',
                required: true,
                type: 3 // STRING
            }
        ]
    },
    run: async (client, interaction) => {
        const message = interaction.options.getString('message')
        const userId = interaction.user?.id ? BigInt(interaction.user.id) : null

        await client.db.prisma.report.create({
            data: {
                userId,
                message
            }
        })

        // Send log to support server channel
        const logChannel = client.channels.cache.get('1387375352837308526')

        if (logChannel) {
            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('[REPORT]: new submission')
                .setDescription('Please review this as soon as possible!')
                .setThumbnail(client.logo)
                .setColor(client.colors.error)
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
                .setTimestamp()
                .setFooter({
                    text: client.footer,
                    iconURL: client.logo
                })

            await logChannel.send({ embeds: [embed] })
        }

        return interaction.reply({
            content: 'Thank you for your report. My team will review it as soon as possible.',
            ephemeral: false
        })
    }
}
