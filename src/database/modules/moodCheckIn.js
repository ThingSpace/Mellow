/**
 * MoodCheckInModule - Database operations for mood check-ins
 *
 * This module provides a flexible interface for managing mood check-in data in the database.
 * It uses Prisma's upsert functionality to handle both creation and updates seamlessly.
 * Respects Mellow configuration and user preferences for check-in features.
 *
 * @class MoodCheckInModule
 */
export class MoodCheckInModule {
    /**
     * Creates a new MoodCheckInModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
    }

    /**
     * Creates a new mood check-in record if check-ins are enabled
     *
     * @param {Object} data - Mood check-in data
     * @param {string|number} data.userId - Discord user ID
     * @param {string} data.mood - User's mood
     * @param {number} [data.intensity] - Mood intensity (1-5)
     * @param {string} [data.activity] - Current activity
     * @param {string} [data.note] - Additional notes
     * @param {Date} [data.nextCheckIn] - Next scheduled check-in
     * @returns {Promise<Object|null>} Created mood check-in record or null if disabled
     */
    async create(data) {
        // Check if check-in tools are enabled in Mellow config
        const mellowConfig = await this.prisma.mellow.findUnique({
            where: { id: 1 },
            select: { enabled: true, checkInTools: true }
        })

        if (!mellowConfig?.enabled || !mellowConfig?.checkInTools) {
            return null // Check-ins are disabled
        }

        // Get user preferences for check-in settings
        const userPrefs = await this.prisma.userPreferences.findUnique({
            where: { id: BigInt(data.userId) },
            select: { checkInInterval: true, timezone: true }
        })

        // Calculate next check-in time based on user preferences
        let nextCheckIn = data.nextCheckIn
        if (!nextCheckIn && userPrefs?.checkInInterval) {
            nextCheckIn = new Date()
            nextCheckIn.setMinutes(nextCheckIn.getMinutes() + userPrefs.checkInInterval)
        }

        return this.prisma.moodCheckIn.create({
            data: {
                userId: BigInt(data.userId),
                mood: data.mood,
                intensity: data.intensity || 3,
                activity: data.activity,
                note: data.note,
                nextCheckIn
            }
        })
    }

    /**
     * Creates or updates a mood check-in record
     *
     * @param {number} id - Mood check-in record ID
     * @param {Object} data - Mood check-in data to update
     * @returns {Promise<Object>} The created or updated mood check-in record
     *
     * @example
     * await moodCheckInModule.upsert(1, {
     *   mood: 'better',
     *   intensity: 2,
     *   note: 'Feeling much better now'
     * })
     */
    async upsert(id, data) {
        return this.prisma.moodCheckIn.upsert({
            where: { id },
            update: data,
            create: { id, ...data }
        })
    }

    /**
     * Retrieves multiple mood check-in records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of mood check-in records
     *
     * @example
     * // Get all check-ins for a specific user
     * const checkIns = await moodCheckInModule.findMany({
     *   where: { userId: BigInt('123456789') },
     *   orderBy: { createdAt: 'desc' }
     * })
     *
     * // Get recent high-intensity check-ins
     * const checkIns = await moodCheckInModule.findMany({
     *   where: { intensity: { gte: 4 } },
     *   take: 10,
     *   include: { user: true }
     * })
     */
    async findMany(args = {}) {
        return this.prisma.moodCheckIn.findMany(args)
    }

    /**
     * Retrieves a single mood check-in record by ID
     *
     * @param {number} id - Mood check-in record ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} Mood check-in record or null if not found
     *
     * @example
     * // Get basic check-in info
     * const checkIn = await moodCheckInModule.findById(1)
     *
     * // Get check-in with user info included
     * const checkIn = await moodCheckInModule.findById(1, {
     *   include: { user: true }
     * })
     */
    async findById(id, options = {}) {
        return this.prisma.moodCheckIn.findUnique({
            where: { id },
            ...options
        })
    }

    /**
     * Deletes a mood check-in record from the database
     *
     * @param {number} id - Mood check-in record ID
     * @returns {Promise<Object>} The deleted mood check-in record
     *
     * @example
     * await moodCheckInModule.delete(1)
     */
    async delete(id) {
        return this.prisma.moodCheckIn.delete({
            where: { id }
        })
    }

    /**
     * Retrieves all mood check-ins for a specific user
     *
     * @param {string|number} userId - Discord user ID
     * @param {number} [limit=30] - Maximum number of records to return
     * @param {Object} [options={}] - Additional Prisma options
     * @returns {Promise<Array>} Array of mood check-in records for the user
     *
     * @example
     * // Get last 30 check-ins for user
     * const checkIns = await moodCheckInModule.getAllForUser('123456789')
     *
     * // Get last 10 check-ins with user info
     * const checkIns = await moodCheckInModule.getAllForUser('123456789', 10, {
     *   include: { user: true }
     * })
     */
    async getAllForUser(userId, limit = 30, options = {}) {
        return this.prisma.moodCheckIn.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { createdAt: 'desc' },
            take: limit,
            ...options
        })
    }

    /**
     * Retrieves all mood check-ins that are due for reminders
     *
     * @returns {Promise<Array>} Array of mood check-in records with due reminders
     *
     * @example
     * const dueReminders = await moodCheckInModule.getDueReminders()
     * for (const reminder of dueReminders) {
     *   // Send reminder to user
     *   console.log(`Sending reminder to ${reminder.user.username}`)
     * }
     */
    async getDueReminders() {
        const now = new Date()
        return this.prisma.moodCheckIn.findMany({
            where: {
                nextCheckIn: {
                    lte: now
                }
            },
            include: {
                user: {
                    include: {
                        preferences: true
                    }
                }
            },
            orderBy: {
                nextCheckIn: 'asc'
            }
        })
    }

    /**
     * Gets users who need reminder check-ins based on their preferences
     *
     * @returns {Promise<Array>} Users who need check-in reminders
     */
    async getUsersNeedingReminders() {
        // Only proceed if check-ins are enabled
        const mellowConfig = await this.prisma.mellow.findUnique({
            where: { id: 1 },
            select: { enabled: true, checkInTools: true }
        })

        if (!mellowConfig?.enabled || !mellowConfig?.checkInTools) {
            return []
        }

        const now = new Date()

        return this.prisma.userPreferences.findMany({
            where: {
                remindersEnabled: true,
                nextCheckIn: {
                    lte: now
                }
            },
            include: {
                user: {
                    select: { id: true, username: true }
                }
            }
        })
    }

    /**
     * Updates next check-in time based on user preferences
     *
     * @param {string|number} userId - Discord user ID
     * @returns {Promise<Object|null>} Updated preferences or null
     */
    async scheduleNextCheckIn(userId) {
        const userPrefs = await this.prisma.userPreferences.findUnique({
            where: { id: BigInt(userId) },
            select: { checkInInterval: true, remindersEnabled: true }
        })

        if (!userPrefs?.remindersEnabled) {
            return null
        }

        const nextCheckIn = new Date()
        nextCheckIn.setMinutes(nextCheckIn.getMinutes() + (userPrefs.checkInInterval || 720))

        return this.prisma.userPreferences.update({
            where: { id: BigInt(userId) },
            data: {
                nextCheckIn,
                lastReminder: new Date()
            }
        })
    }

    /**
     * Get a simple mood trend summary for a user (e.g., last 7 check-ins)
     * @param {string|number} userId
     * @returns {Promise<string|null>}
     */
    async getMoodTrendForUser(userId) {
        const checkIns = await this.prisma.moodCheckIn.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { createdAt: 'desc' },
            take: 7
        })
        if (!checkIns.length) return null
        // Example: summarize as a comma-separated list of moods
        return checkIns
            .map(c => c.mood)
            .reverse()
            .join(' → ')
    }

    /**
     * Get a simple check-in trend summary for a user (e.g., frequency in last week)
     * @param {string|number} userId
     * @returns {Promise<string|null>}
     */
    async getCheckInTrendForUser(userId) {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const count = await this.prisma.moodCheckIn.count({
            where: {
                userId: BigInt(userId),
                createdAt: { gte: oneWeekAgo }
            }
        })
        return `Check-ins in last 7 days: ${count}`
    }
}
