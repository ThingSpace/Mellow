export default {
    structure: {
        name: 'insights',
        category: 'Check-In',
        description: 'Get insights and trends from your mood check-ins.',
        handlers: {
            cooldown: 300,
            requiredRoles: []
        },
        options: [
            {
                name: 'timeframe',
                description: 'Period to analyze',
                required: false,
                type: 3,
                choices: [
                    { name: 'Last Week', value: 'week' },
                    { name: 'Last Month', value: 'month' },
                    { name: 'All Time', value: 'all' }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const userId = interaction.user.id
        const timeframe = interaction.options.getString('timeframe') || 'week'

        await interaction.deferReply()

        // Get check-ins based on timeframe
        const now = new Date()
        const timeframeDate = new Date(now)
        if (timeframe === 'week') {
            timeframeDate.setDate(now.getDate() - 7)
        }
        if (timeframe === 'month') {
            timeframeDate.setMonth(now.getMonth() - 1)
        }

        const checkIns = await client.db.moodCheckIns.findMany({
            where: {
                userId: BigInt(userId),
                ...(timeframe !== 'all' && {
                    createdAt: {
                        gte: timeframeDate
                    }
                })
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        if (!checkIns.length) {
            return interaction.editReply({
                embeds: [
                    new client.Gateway.EmbedBuilder()
                        .setTitle('Mood Insights')
                        .setDescription(
                            `No check-ins found for the selected timeframe.\n` +
                                `Use \`/checkin\` to start tracking your moods!`
                        )
                        .setColor(client.colors.primary)
                        .setFooter({ text: client.footer, iconURL: client.logo })
                ]
            })
        }

        // Analyze moods
        const moodCounts = {}
        const intensitySum = {}
        const activities = new Set()
        let totalIntensity = 0
        let intensityCount = 0

        checkIns.forEach(c => {
            moodCounts[c.mood] = (moodCounts[c.mood] || 0) + 1
            intensitySum[c.mood] = (intensitySum[c.mood] || 0) + (c.intensity || 3)
            if (c.activity) {
                activities.add(c.activity)
            }
            totalIntensity += c.intensity || 3
            intensityCount++
        })

        // Find most common mood and average intensity
        const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]
        const avgIntensity = (totalIntensity / intensityCount).toFixed(1)

        // Generate mood trend description
        const moodEmojis = {
            happy: '😊',
            calm: '😌',
            neutral: '😐',
            sad: '😔',
            anxious: '😟',
            frustrated: '😤',
            tired: '😴',
            confused: '🤔'
        }

        const moodStats = Object.entries(moodCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([mood, count]) => {
                const percentage = ((count / checkIns.length) * 100).toFixed(0)
                const avgMoodIntensity = (intensitySum[mood] / count).toFixed(1)
                return `${moodEmojis[mood] || '❓'} **${mood}**: ${percentage}% (avg intensity: ${avgMoodIntensity})`
            })
            .join('\n')

        // Generate insights
        const insights = []
        if (mostCommonMood) {
            insights.push(`Your most frequent mood was **${mostCommonMood[0]}** (${mostCommonMood[1]} times)`)
        }
        if (activities.size) {
            insights.push(`You logged ${activities.size} different activities`)
        }
        if (avgIntensity) {
            insights.push(`Your average mood intensity was ${avgIntensity}/5`)
        }

        let timeframeText
        if (timeframe === 'week') {
            timeframeText = 'Last Week'
        } else if (timeframe === 'month') {
            timeframeText = 'Last Month'
        } else {
            timeframeText = 'All Time'
        }

        await interaction.editReply({
            embeds: [
                new client.Gateway.EmbedBuilder()
                    .setTitle(`Mood Insights (${timeframeText})`)
                    .setDescription(
                        `Based on ${checkIns.length} check-in${checkIns.length === 1 ? '' : 's'}:\n\n` +
                            `${insights.join('\n')}\n\n` +
                            `**Mood Distribution**\n${moodStats}`
                    )
                    .setColor(client.colors.primary)
                    .setFooter({ text: client.footer, iconURL: client.logo })
            ]
        })
    }
}
