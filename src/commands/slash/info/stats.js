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

        return interaction.reply({
            content:
                "Hey there! Here's how I've been supporting the community lately:\n\n" +
                `- 🖥️ I'm currently in: **${guildCount} servers**\n` +
                `- 👤I'm available for: **${userCount} users**\n` +
                `- 📝 I've handled: **${checkInCount} check-ins**!\n` +
                `- 👻 I've processed: **${ghostLetterCount} ghost letters**\n` +
                `- 🧰 I've executed: **${copingToolCount} coping tools**\n` +
                `- 💬 I'm trained on: **${conversationCount} conversations**\n` +
                `- 📨 I've received feedback: **${feedbackCount} times**\n` +
                `- 🚩 My team has handled: **${reportCount} report**\n\n` +
                'Thanks for being part of Mellow’s journey! 💜'
        })
    }
}
