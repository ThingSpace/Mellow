/**
 * Calculate streak data from usage records
 * @param {Array} usageData - Array of usage records with usedAt/createdAt timestamps
 * @param {string} dateField - Field name containing the date ('usedAt', 'createdAt', etc.)
 * @param {string} toolField - Field name containing the tool/activity name ('toolName', 'mood', etc.)
 * @returns {Object} Streak calculation results
 */
export function calculateStreaks(usageData, dateField = 'usedAt', toolField = 'toolName') {
    const toolStreaks = {}
    let overallStreak = 0
    const totalUsage = usageData.length

    if (totalUsage === 0) {
        return { overallStreak: 0, toolStreaks: {}, totalUsage: 0 }
    }

    // Group by date and tool
    const dailyUsage = {}

    usageData.forEach(usage => {
        const date = new Date(usage[dateField]).toISOString().split('T')[0]
        const tool = usage[toolField]

        if (!dailyUsage[date]) {
            dailyUsage[date] = new Set()
        }
        dailyUsage[date].add(tool)

        // Initialize tool tracking
        if (!toolStreaks[tool]) {
            toolStreaks[tool] = { current: 0, best: 0, lastDate: null }
        }
    })

    // Calculate overall streak (consecutive days with any activity)
    const sortedDates = Object.keys(dailyUsage).sort().reverse()
    const today = new Date().toISOString().split('T')[0]

    for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i]
        const daysDiff = Math.floor((new Date(today) - new Date(date)) / (1000 * 60 * 60 * 24))

        if (i === 0 && daysDiff <= 1) {
            overallStreak = 1
        } else if (i > 0) {
            const prevDate = sortedDates[i - 1]
            const daysBetween = Math.floor((new Date(prevDate) - new Date(date)) / (1000 * 60 * 60 * 24))

            if (daysBetween === 1) {
                overallStreak++
            } else {
                break
            }
        } else {
            break
        }
    }

    // Calculate individual tool streaks
    Object.keys(toolStreaks).forEach(tool => {
        const toolUsage = usageData.filter(u => u[toolField] === tool)
        const toolDates = [...new Set(toolUsage.map(u => new Date(u[dateField]).toISOString().split('T')[0]))]
            .sort()
            .reverse()

        let currentStreak = 0
        let bestStreak = 0

        for (let i = 0; i < toolDates.length; i++) {
            const date = toolDates[i]
            const daysDiff = Math.floor((new Date(today) - new Date(date)) / (1000 * 60 * 60 * 24))

            if (i === 0 && daysDiff <= 1) {
                currentStreak = 1
            } else if (i > 0) {
                const prevDate = toolDates[i - 1]
                const daysBetween = Math.floor((new Date(prevDate) - new Date(date)) / (1000 * 60 * 60 * 24))

                if (daysBetween === 1) {
                    currentStreak++
                } else {
                    bestStreak = Math.max(bestStreak, currentStreak)
                    currentStreak = 1
                }
            }
        }

        bestStreak = Math.max(bestStreak, currentStreak)
        toolStreaks[tool] = { current: currentStreak, best: bestStreak }
    })

    return { overallStreak, toolStreaks, totalUsage }
}

/**
 * Calculate check-in streaks specifically for mood check-ins
 * @param {Array} checkIns - Array of check-in records
 * @returns {Object} Check-in streak data
 */
export function calculateCheckInStreaks(checkIns) {
    if (!checkIns || checkIns.length === 0) {
        return { currentStreak: 0, bestStreak: 0 }
    }

    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0

    const sortedCheckIns = checkIns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const today = new Date()

    for (let i = 0; i < sortedCheckIns.length; i++) {
        const checkInDate = new Date(sortedCheckIns[i].createdAt)
        const daysDiff = Math.floor((today - checkInDate) / (1000 * 60 * 60 * 24))

        if (i === 0 && daysDiff <= 1) {
            currentStreak = 1
            tempStreak = 1
        } else if (i > 0) {
            const prevCheckIn = new Date(sortedCheckIns[i - 1].createdAt)
            const daysBetween = Math.floor((prevCheckIn - checkInDate) / (1000 * 60 * 60 * 24))

            if (daysBetween <= 1) {
                tempStreak++
                if (i === 1) currentStreak = tempStreak
            } else {
                bestStreak = Math.max(bestStreak, tempStreak)
                tempStreak = 1
            }
        }
    }

    bestStreak = Math.max(bestStreak, tempStreak, currentStreak)

    return { currentStreak, bestStreak }
}
