import { ActivityType } from 'discord.js'
import { isLateNight, isEarlyMorning, getTimePeriod, isValidTimezone } from '../functions/timeHelper.js'

export const setClientPresence = async client => {
    // Get a sample of timezones from recent users to determine appropriate presence
    const getTimeBasedPresences = async () => {
        try {
            // Get some recent user timezones to determine general time period
            const recentUsers = await client.db.userPreferences.findMany({
                where: {
                    timezone: { not: null },
                    updatedAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                    }
                },
                select: { timezone: true },
                take: 10
            })

            let lateNightCount = 0
            let earlyMorningCount = 0
            let totalUsers = recentUsers.length

            if (totalUsers === 0) {
                // Fallback to system time
                const hour = new Date().getHours()
                if (hour >= 22 || hour < 6) lateNightCount = 1
                else if (hour >= 6 && hour < 10) earlyMorningCount = 1
                totalUsers = 1
            } else {
                // Check each user's timezone
                recentUsers.forEach(user => {
                    // Only process valid timezones
                    if (user.timezone && isValidTimezone(user.timezone)) {
                        if (isLateNight(user.timezone)) lateNightCount++
                        if (isEarlyMorning(user.timezone)) earlyMorningCount++
                    }
                })
            }

            // Determine if we should show late-night or morning presences
            const lateNightRatio = lateNightCount / totalUsers
            const earlyMorningRatio = earlyMorningCount / totalUsers

            if (lateNightRatio > 0.3) {
                // Many users in late-night hours
                return [
                    { name: 'Providing late-night comfort 🌙', type: ActivityType.Custom },
                    { name: 'Gentle support for night owls', type: ActivityType.Custom },
                    { name: 'Listening in the quiet hours', type: ActivityType.Custom },
                    { name: 'Peaceful late-night conversations', type: ActivityType.Custom },
                    { name: 'Being here when sleep is elusive', type: ActivityType.Custom },
                    { name: 'Calming midnight thoughts', type: ActivityType.Custom }
                ]
            } else if (earlyMorningRatio > 0.3) {
                // Many users in early morning hours
                return [
                    { name: 'Morning support & encouragement ☀️', type: ActivityType.Custom },
                    { name: 'Starting days with kindness', type: ActivityType.Custom },
                    { name: 'Early morning check-ins', type: ActivityType.Custom },
                    { name: 'Gentle wake-up support', type: ActivityType.Custom },
                    { name: 'Sunrise conversations', type: ActivityType.Custom }
                ]
            }

            return null // Use default presences
        } catch (error) {
            console.error('Error determining time-based presences:', error)
            return null
        }
    }

    const defaultPresences = [
        { name: 'Watching athing.space', type: ActivityType.Custom },
        { name: 'Watching for check-ins', type: ActivityType.Custom },
        { name: 'Listening to your feelings', type: ActivityType.Custom },
        { name: 'Enjoying late night chats', type: ActivityType.Custom },
        { name: 'Looking for someone to talk to', type: ActivityType.Custom },
        { name: 'Providing gentle support', type: ActivityType.Custom },
        { name: 'Executing coping tools', type: ActivityType.Custom },
        { name: 'Competing with kindness', type: ActivityType.Custom },
        { name: 'Mellow moments', type: ActivityType.Custom },
        { name: 'Providing mental health tips', type: ActivityType.Custom },
        { name: 'Watching for crisis keywords', type: ActivityType.Custom },
        { name: 'Responding to your DMs', type: ActivityType.Custom }
    ]

    // Get time-based presences or fall back to default
    const timeBasedPresences = await getTimeBasedPresences()
    const presences = timeBasedPresences || defaultPresences

    client.user.setStatus('online')

    setInterval(() => {
        const presence = presences[Math.floor(Math.random() * presences.length)]

        client.user.setActivity({
            name: presence.name,
            type: presence.type
        })
    }, 30000)
}
