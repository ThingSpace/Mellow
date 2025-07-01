export default {
    structure: {
        name: 'stats',
        category: 'Info',
        description: 'View Mellow community statistics and impact metrics.',
        handlers: {
            cooldown: 15000,
            requiredRoles: []
        }
    },
    run: async (client, interaction) => {
        try {
            // Gather comprehensive stats from the database
            const [
                guildCount,
                userCount,
                checkInCount,
                feedbackCount,
                reportCount,
                ghostLetterCount,
                copingToolCount,
                conversationCount,
                crisisEventCount,
                gratitudeEntryCount,
                journalEntryCount
            ] = await Promise.all([
                client.db.prisma.guild.count(),
                client.db.prisma.user.count(),
                client.db.prisma.moodCheckIn.count(),
                client.db.prisma.feedback.count(),
                client.db.prisma.report.count(),
                client.db.prisma.ghostLetter.count(),
                client.db.prisma.copingToolUsage.count(),
                client.db.prisma.conversationHistory.count(),
                client.db.prisma.crisisEvent.count().catch(() => 0),
                client.db.prisma.gratitudeEntry.count().catch(() => 0),
                client.db.prisma.journalEntry.count().catch(() => 0)
            ])

            // Calculate some recent activity (last 30 days)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            const [recentCheckIns, recentCopingTools, recentConversations] = await Promise.all([
                client.db.prisma.moodCheckIn
                    .count({
                        where: { createdAt: { gte: thirtyDaysAgo } }
                    })
                    .catch(() => 0),
                client.db.prisma.copingToolUsage
                    .count({
                        where: { createdAt: { gte: thirtyDaysAgo } }
                    })
                    .catch(() => 0),
                client.db.prisma.conversationHistory
                    .count({
                        where: { timestamp: { gte: thirtyDaysAgo } }
                    })
                    .catch(() => 0)
            ])

            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('📊 Mellow Community Impact')
                .setDescription("Here's how I've been supporting mental health across the community! 💜")
                .setColor(client.colors.primary)
                .setThumbnail(client.logo)
                .addFields(
                    {
                        name: '🌐 Community Reach',
                        value: [
                            `**${guildCount.toLocaleString()}** servers`,
                            `**${userCount.toLocaleString()}** users supported`,
                            `**${conversationCount.toLocaleString()}** conversations`,
                            `**${feedbackCount.toLocaleString()}** feedback received`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '💝 Mental Health Support',
                        value: [
                            `**${checkInCount.toLocaleString()}** mood check-ins`,
                            `**${copingToolCount.toLocaleString()}** coping tools used`,
                            `**${ghostLetterCount.toLocaleString()}** ghost letters written`,
                            `**${gratitudeEntryCount.toLocaleString()}** gratitude entries`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '📈 Recent Activity (30 days)',
                        value: [
                            `**${recentCheckIns.toLocaleString()}** recent check-ins`,
                            `**${recentCopingTools.toLocaleString()}** coping tools used`,
                            `**${recentConversations.toLocaleString()}** new conversations`,
                            `**${journalEntryCount.toLocaleString()}** journal entries total`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🛡️ Safety & Moderation',
                        value: [
                            `**${reportCount.toLocaleString()}** reports handled`,
                            `**${crisisEventCount.toLocaleString()}** crisis interventions`,
                            `**Privacy-first** approach`,
                            `**24/7** crisis support available`
                        ].join('\n'),
                        inline: false
                    }
                )
                .setFooter({
                    text: `${client.footer} • Thanks for being part of Mellow's journey!`,
                    iconURL: client.logo
                })
                .setTimestamp()

            return interaction.reply({ embeds: [embed] })
        } catch (error) {
            console.error('Error getting stats:', error)
            return interaction.reply({
                content:
                    "❌ Sorry, I encountered an error while gathering statistics. Here's the basics:\n\n" +
                    `🖥️ Currently supporting mental health in multiple servers\n` +
                    `💜 Helping users with check-ins, coping tools, and crisis support\n` +
                    `🔒 Always respecting privacy and user preferences\n\n` +
                    'Please try again later for detailed statistics!',
                ephemeral: true
            })
        }
    }
}
