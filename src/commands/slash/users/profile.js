import { calculateCheckInStreaks } from '../../../functions/streakCalculator.js'

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
        const userId = BigInt(interaction.user.id)

        // Fetch comprehensive user data using correct database methods
        const [userProfile, userPrefs] = await Promise.all([
            client.db.users.findById(userId, {
                include: {
                    checkIns: {
                        orderBy: { createdAt: 'desc' },
                        take: 50
                    },
                    ghostLetters: {
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    },
                    copingToolUsages: {
                        orderBy: { usedAt: 'desc' },
                        take: 20
                    },
                    crisisEvents: {
                        orderBy: { detectedAt: 'desc' },
                        take: 10
                    }
                }
            }),
            client.db.userPreferences.findById(userId)
        ])

        // Log profile access
        if (client.systemLogger) {
            await client.systemLogger.logUserEvent(
                interaction.user.id,
                interaction.user.username,
                'profile_accessed',
                'User viewed their comprehensive profile'
            )
        }

        if (!userProfile) {
            return interaction.reply({
                content:
                    "You don't have a Mellow profile yet. Start by using `/checkin` to begin your mental health journey!"
            })
        }

        // Calculate comprehensive statistics
        const stats = calculateProfileStats(userProfile, userPrefs)
        const moodStats = calculateMoodStats(userProfile.checkIns)
        const activityStats = calculateActivityStats(userProfile)

        // Get recent crisis events from the user profile data
        const recentCrisis = userProfile.crisisEvents || []

        // Build comprehensive embed
        const embed = new client.Gateway.EmbedBuilder()
            .setTitle(`${interaction.user.username}'s Mellow Journey`)
            .setDescription('Your comprehensive mental health journey with Mellow')
            .setColor(getProfileThemeColor(userPrefs?.profileTheme))
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields(
                // Basic Info
                {
                    name: '👤 Profile Information',
                    value: [
                        `**Discord ID:** ${interaction.user.id}`,
                        `**Username:** ${userProfile.username || interaction.user.username}`,
                        `**Role:** ${userProfile.role || 'USER'}`,
                        `**Member Since:** <t:${Math.floor(userProfile.createdAt.getTime() / 1000)}:D>`
                    ].join('\n'),
                    inline: false
                },
                // Activity Overview
                {
                    name: '📊 Activity Overview',
                    value: [
                        `**Total Check-ins:** ${stats.totalCheckIns}`,
                        `**Check-in Streak:** ${stats.currentStreak} days`,
                        `**Best Streak:** ${stats.bestStreak} days`,
                        `**Ghost Letters:** ${stats.totalGhostLetters}`,
                        `**Coping Tools Used:** ${stats.totalCopingTools}`,
                        `**Unique Tools:** ${stats.uniqueTools}`
                    ].join('\n'),
                    inline: true
                },
                // Mood Insights
                {
                    name: '🎭 Mood Insights',
                    value: [
                        `**Recent Mood:** ${moodStats.recentMood || 'No check-ins yet'}`,
                        `**Most Common:** ${moodStats.mostCommonMood || 'N/A'}`,
                        `**Average Intensity:** ${moodStats.avgIntensity || 'N/A'}/5`,
                        `**Mood Variety:** ${moodStats.moodVariety} different moods`,
                        `**Last Check-in:** ${moodStats.lastCheckIn || 'Never'}`
                    ].join('\n'),
                    inline: true
                },
                // Preferences & Settings
                {
                    name: '⚙️ Your Preferences',
                    value: userPrefs
                        ? [
                              `**Reminders:** ${userPrefs.remindersEnabled ? '✅ Enabled' : '❌ Disabled'}`,
                              `**Check-in Interval:** ${userPrefs.checkInInterval / 60}h`,
                              `**AI Personality:** ${userPrefs.aiPersonality || 'gentle'}`,
                              `**Language:** ${userPrefs.language || 'en'}`,
                              `**Theme:** ${userPrefs.profileTheme || 'blue'}`
                          ].join('\n')
                        : 'No preferences set',
                    inline: false
                },
                // Recent Activity
                {
                    name: '🕒 Recent Activity',
                    value: [
                        `**This Week:** ${activityStats.thisWeek} check-ins`,
                        `**This Month:** ${activityStats.thisMonth} check-ins`,
                        `**Most Active Day:** ${activityStats.mostActiveDay || 'N/A'}`,
                        `**Favorite Coping Tool:** ${activityStats.favoriteTool || 'N/A'}`,
                        `**Recent Crisis Events:** ${recentCrisis.length}`
                    ].join('\n'),
                    inline: true
                },
                // Mental Health Journey
                {
                    name: '🌱 Mental Health Journey',
                    value: [
                        `**Days with Mellow:** ${Math.floor((Date.now() - userProfile.createdAt.getTime()) / (1000 * 60 * 60 * 24))}`,
                        `**Crisis Events:** ${stats.totalCrisisEvents} total`,
                        `**Support Received:** ${stats.totalCrisisEvents > 0 ? 'Yes' : 'Preventive care'}`,
                        `**Journey Progress:** ${getJourneyProgress(stats)}`,
                        `**Wellness Score:** ${calculateWellnessScore(stats, moodStats)}/100`
                    ].join('\n'),
                    inline: true
                }
            )
            .setTimestamp()
            .setFooter({
                text: `Keep up the great work! • ${client.footer}`,
                iconURL: client.logo
            })

        // Add mood trend if available
        if (moodStats.moodTrend) {
            embed.addFields({
                name: '📈 Recent Mood Trend',
                value: moodStats.moodTrend,
                inline: false
            })
        }

        return interaction.reply({ embeds: [embed] })
    }
}

/**
 * Calculate comprehensive profile statistics
 */
function calculateProfileStats(userProfile, userPrefs) {
    const checkIns = userProfile.checkIns || []
    const ghostLetters = userProfile.ghostLetters || []
    const copingTools = userProfile.copingToolUsages || []
    const crisisEvents = userProfile.crisisEvents || []

    // Use shared streak calculation function
    const { currentStreak, bestStreak } = calculateCheckInStreaks(checkIns)

    // Count unique coping tools
    const uniqueTools = new Set(copingTools.map(tool => tool.toolName)).size

    return {
        totalCheckIns: checkIns.length,
        totalGhostLetters: ghostLetters.length,
        totalCopingTools: copingTools.length,
        totalCrisisEvents: crisisEvents.length,
        currentStreak,
        bestStreak,
        uniqueTools
    }
}

/**
 * Calculate mood statistics and insights
 */
function calculateMoodStats(checkIns) {
    if (!checkIns || checkIns.length === 0) {
        return { recentMood: null, mostCommonMood: null, avgIntensity: null, moodVariety: 0, lastCheckIn: null }
    }

    const sortedCheckIns = checkIns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const recentCheckIn = sortedCheckIns[0]

    // Calculate mood frequency
    const moodCounts = {}
    let totalIntensity = 0
    let intensityCount = 0

    checkIns.forEach(checkIn => {
        moodCounts[checkIn.mood] = (moodCounts[checkIn.mood] || 0) + 1
        if (checkIn.intensity) {
            totalIntensity += checkIn.intensity
            intensityCount++
        }
    })

    const mostCommonMood = Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0]

    const avgIntensity = intensityCount > 0 ? (totalIntensity / intensityCount).toFixed(1) : null

    // Generate mood trend for recent check-ins
    const recentMoods = sortedCheckIns
        .slice(0, 5)
        .map(c => c.mood)
        .reverse()
    const moodTrend = recentMoods.length > 1 ? `${recentMoods.join(' → ')}` : null

    return {
        recentMood: recentCheckIn.mood,
        mostCommonMood,
        avgIntensity,
        moodVariety: Object.keys(moodCounts).length,
        lastCheckIn: `<t:${Math.floor(new Date(recentCheckIn.createdAt).getTime() / 1000)}:R>`,
        moodTrend
    }
}

/**
 * Calculate activity statistics
 */
function calculateActivityStats(userProfile) {
    const checkIns = userProfile.checkIns || []
    const copingTools = userProfile.copingToolUsages || []

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const thisWeek = checkIns.filter(c => new Date(c.createdAt) > oneWeekAgo).length
    const thisMonth = checkIns.filter(c => new Date(c.createdAt) > oneMonthAgo).length

    // Find most active day of week
    const dayOfWeekCounts = {}
    checkIns.forEach(checkIn => {
        const dayOfWeek = new Date(checkIn.createdAt).toLocaleDateString('en-US', { weekday: 'long' })
        dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1
    })

    const mostActiveDay = Object.entries(dayOfWeekCounts).sort(([, a], [, b]) => b - a)[0]?.[0]

    // Find favorite coping tool
    const toolCounts = {}
    copingTools.forEach(tool => {
        toolCounts[tool.toolName] = (toolCounts[tool.toolName] || 0) + 1
    })

    const favoriteTool = Object.entries(toolCounts).sort(([, a], [, b]) => b - a)[0]?.[0]

    return {
        thisWeek,
        thisMonth,
        mostActiveDay,
        favoriteTool
    }
}

/**
 * Get color based on profile theme
 */
function getProfileThemeColor(theme) {
    const colors = {
        blue: 0x0099ff,
        purple: 0x9966ff,
        green: 0x00ff66,
        orange: 0xff9900,
        pink: 0xff66cc
    }
    return colors[theme] || colors.blue
}

/**
 * Calculate journey progress description
 */
function getJourneyProgress(stats) {
    if (stats.totalCheckIns === 0) return 'Just starting'
    if (stats.totalCheckIns < 5) return 'Getting started'
    if (stats.totalCheckIns < 20) return 'Building habits'
    if (stats.totalCheckIns < 50) return 'Making progress'
    if (stats.totalCheckIns < 100) return 'Committed journey'
    return 'Mental health champion'
}

/**
 * Calculate wellness score based on various factors
 */
function calculateWellnessScore(stats, moodStats) {
    let score = 0

    // Check-in consistency (30 points)
    score += Math.min(30, stats.currentStreak * 3)

    // Activity engagement (25 points)
    score += Math.min(25, stats.totalCopingTools)

    // Mood variety and self-awareness (20 points)
    score += Math.min(20, moodStats.moodVariety * 3)

    // Overall engagement (15 points)
    score += Math.min(15, Math.floor(stats.totalCheckIns / 5))

    // Crisis management (10 points - having tools is good, needing them less is better)
    if (stats.totalCrisisEvents === 0) {
        score += 10
    } else if (stats.totalCrisisEvents < 3) {
        score += 5
    }

    return Math.min(100, score)
}
