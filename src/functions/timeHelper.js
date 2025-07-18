/**
 * Time Helper - Utilities for timezone-aware time detection
 * Used for late-night companion mode and time-sensitive features
 */

/**
 * Get the current time in the user's timezone
 * @param {string} timezone - User's timezone (e.g., 'America/New_York')
 * @returns {Date} Current time in user's timezone
 */
export function getUserTime(timezone) {
    if (!timezone || typeof timezone !== 'string') {
        // Fallback to system time if not a string
        return new Date()
    }

    // If timezone is a number or numeric string, treat as invalid
    if (/^\d+$/.test(timezone)) {
        console.warn(`[getUserTime] Invalid timezone value (numeric):`, timezone)
        return new Date()
    }

    try {
        // Validate timezone before using
        Intl.DateTimeFormat(undefined, { timeZone: timezone })
    } catch (error) {
        console.warn(`[getUserTime] Invalid timezone identifier:`, timezone)
        return new Date()
    }

    try {
        // Create a date formatter for the user's timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        })

        const parts = formatter.formatToParts(new Date())
        const partsObj = {}
        parts.forEach(part => {
            partsObj[part.type] = part.value
        })

        // Construct a date in the user's timezone
        const userDate = new Date(
            parseInt(partsObj.year),
            parseInt(partsObj.month) - 1, // Month is 0-indexed
            parseInt(partsObj.day),
            parseInt(partsObj.hour),
            parseInt(partsObj.minute),
            parseInt(partsObj.second)
        )

        return userDate
    } catch (error) {
        console.error('Error getting user time:', error)
        return new Date() // Fallback to system time
    }
}

/**
 * Validate if a timezone string is a valid IANA timezone identifier
 * @param {string} timezone - Timezone string to validate
 * @returns {boolean} True if valid timezone
 */
export function isValidTimezone(timezone) {
    if (!timezone || typeof timezone !== 'string') {
        return false
    }

    // Convert to string to handle any numeric inputs
    const timezoneStr = String(timezone)

    try {
        // Try to create a DateTimeFormat with the timezone
        Intl.DateTimeFormat(undefined, { timeZone: timezoneStr })
        return true
    } catch (error) {
        return false
    }
}

/**
 * Check if it's currently late night in the user's timezone
 * Late night is defined as 10 PM to 6 AM
 * @param {string} timezone - User's timezone
 * @returns {boolean} True if it's late night
 */
export function isLateNight(timezone) {
    const userTime = getUserTime(timezone)
    const hour = userTime.getHours()

    // Late night: 22:00 (10 PM) to 06:00 (6 AM)
    return hour >= 22 || hour < 6
}

/**
 * Check if it's early morning in the user's timezone
 * Early morning is defined as 6 AM to 10 AM
 * @param {string} timezone - User's timezone
 * @returns {boolean} True if it's early morning
 */
export function isEarlyMorning(timezone) {
    const userTime = getUserTime(timezone)
    const hour = userTime.getHours()

    // Early morning: 06:00 (6 AM) to 10:00 (10 AM)
    return hour >= 6 && hour < 10
}

/**
 * Check if it's late evening in the user's timezone
 * Late evening is defined as 8 PM to 10 PM
 * @param {string} timezone - User's timezone
 * @returns {boolean} True if it's late evening
 */
export function isLateEvening(timezone) {
    const userTime = getUserTime(timezone)
    const hour = userTime.getHours()

    // Late evening: 20:00 (8 PM) to 22:00 (10 PM)
    return hour >= 20 && hour < 22
}

/**
 * Get a time period description for the user
 * @param {string} timezone - User's timezone
 * @returns {string} Time period description
 */
export function getTimePeriod(timezone) {
    const userTime = getUserTime(timezone)
    const hour = userTime.getHours()

    if (hour >= 6 && hour < 12) {
        return 'morning'
    } else if (hour >= 12 && hour < 17) {
        return 'afternoon'
    } else if (hour >= 17 && hour < 20) {
        return 'evening'
    } else if (hour >= 20 && hour < 22) {
        return 'late evening'
    } else {
        return 'late night'
    }
}

/**
 * Get a time-appropriate greeting
 * @param {string} timezone - User's timezone
 * @returns {string} Time-appropriate greeting
 */
export function getTimeGreeting(timezone) {
    const period = getTimePeriod(timezone)

    switch (period) {
        case 'morning':
            return 'Good morning'
        case 'afternoon':
            return 'Good afternoon'
        case 'evening':
            return 'Good evening'
        case 'late evening':
            return 'Good evening'
        case 'late night':
            return 'Good evening' // Gentle, not acknowledging the late hour directly
        default:
            return 'Hello'
    }
}

/**
 * Get sleep hygiene suggestions based on time
 * @param {string} timezone - User's timezone
 * @returns {string|null} Sleep suggestion or null if not applicable
 */
export function getSleepSuggestion(timezone) {
    const userTime = getUserTime(timezone)
    const hour = userTime.getHours()

    if (hour >= 23 || hour < 2) {
        return "It's getting quite late. Consider winding down for better sleep quality. 🌙"
    } else if (hour >= 2 && hour < 6) {
        return "It's very late - your body might appreciate some rest soon. Sleep is important for mental health. 💤"
    } else if (hour >= 6 && hour < 8) {
        return "Early morning can be a peaceful time. If you're up early, remember to get some sunlight to help your circadian rhythm. ☀️"
    }

    return null
}

/**
 * Format time in user's timezone for display
 * @param {string} timezone - User's timezone
 * @param {Date} date - Date to format (defaults to now)
 * @returns {string} Formatted time string
 */
export function formatUserTime(timezone, date = new Date()) {
    if (!timezone) {
        return date.toLocaleTimeString()
    }

    try {
        const timezoneStr = String(timezone)
        return date.toLocaleTimeString('en-US', {
            timeZone: timezoneStr,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    } catch (error) {
        console.error('Error formatting user time:', error)
        return date.toLocaleTimeString()
    }
}
