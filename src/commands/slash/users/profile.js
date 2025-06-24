export default {
    structure: {
        name: 'profile',
        category: 'Users',
        description: 'View your Mellow profile and mental health journey.',
        handlers: {
            cooldown: 15000,
            requiredRoles: []
        }
    },

    run: async (client, interaction) => {
        await interaction.deferReply()

        const fetch = await client.db.prisma.user.findUnique({
            where: { id: BigInt(interaction.user.id) },
            include: {
                checkIns: true,
                ghostLetters: true,
                copingToolUsages: true,
                crisisEvents: true
            }
        })

        if (!fetch) {
            return interaction.editReply({
                content:
                    "You don't have a Mellow profile yet. Start by using `/checkin` to begin your mental health journey!"
            })
        }

        const totalCheckIns = fetch.checkIns.length
        const totalGhostLetters = fetch.ghostLetters.length
        const totalCopingTools = fetch.copingToolUsages.length
        const totalCrisisEvents = fetch.crisisEvents.length

        // Get recent mood if available
        const recentCheckIn = fetch.checkIns.length > 0 ? fetch.checkIns[0] : null

        return interaction.editReply({
            embeds: [
                new client.Gateway.EmbedBuilder()
                    .setTitle('Your Mellow Profile')
                    .setDescription("Here's your mental health journey with Mellow.")
                    .setColor(client.colors.primary)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .addFields(
                        {
                            name: 'Discord ID',
                            value: interaction.user.id,
                            inline: true
                        },
                        {
                            name: 'Username',
                            value: fetch.username || interaction.user.username,
                            inline: true
                        },
                        {
                            name: 'Role',
                            value: fetch.role || 'USER',
                            inline: true
                        },
                        {
                            name: 'Member Since',
                            value: fetch.createdAt.toLocaleDateString(),
                            inline: true
                        },
                        {
                            name: 'Recent Mood',
                            value: recentCheckIn ? recentCheckIn.mood : 'No check-ins yet',
                            inline: true
                        },
                        {
                            name: 'Total Check-ins',
                            value: totalCheckIns.toString(),
                            inline: true
                        },
                        {
                            name: 'Ghost Letters',
                            value: totalGhostLetters.toString(),
                            inline: true
                        },
                        {
                            name: 'Coping Tools Used',
                            value: totalCopingTools.toString(),
                            inline: true
                        },
                        {
                            name: 'Crisis Events',
                            value: totalCrisisEvents.toString(),
                            inline: true
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
