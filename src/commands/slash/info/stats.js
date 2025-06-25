export default {
    structure: {
        name: 'stats',
        category: 'Info',
        description: 'View Mellow bot statistics.',
        handlers: {
            cooldown: 15000,
            requiredRoles: []
        }
    },
    run: async (client, interaction) => {
        // Gather stats from the database
        const [
            guildCount,
            userCount,
            checkInCount,
            feedbackCount,
            reportCount,
            ghostLetterCount,
            copingToolCount,
            conversationCount
        ] = await Promise.all([
            client.db.prisma.guild.count(),
            client.db.prisma.user.count(),
            client.db.prisma.moodCheckIn.count(),
            client.db.prisma.feedback.count(),
            client.db.prisma.report.count(),
            client.db.prisma.ghostLetter.count(),
            client.db.prisma.copingToolUsage.count(),
            client.db.prisma.conversationHistory.count()
        ])
        await interaction.reply({
            embeds: [
                new client.Gateway.EmbedBuilder()
                    .setTitle('Mellow Bot Stats')
                    .addFields(
                        { name: 'Servers', value: guildCount.toString(), inline: true },
                        { name: 'Users', value: userCount.toString(), inline: true },
                        { name: 'Mood Check-Ins', value: checkInCount.toString(), inline: true },
                        { name: 'Conversations', value: conversationCount.toString(), inline: true },
                        { name: 'Feedback', value: feedbackCount.toString(), inline: true },
                        { name: 'Reports', value: reportCount.toString(), inline: true },
                        { name: 'Ghost Letters', value: ghostLetterCount.toString(), inline: true },
                        { name: 'Coping Tool Uses', value: copingToolCount.toString(), inline: true }
                    )
                    .setColor(client.colors.info)
                    .setFooter({ text: client.footer, iconURL: client.logo })
            ]
        })
    }
}
