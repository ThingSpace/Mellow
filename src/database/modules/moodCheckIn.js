/**
 * MoodCheckInModule - Database operations for user mood check-ins
 *
 * This module provides a flexible interface for managing mood check-in data in the database.
 * It handles mood tracking, reminders, and user mood history.
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
     * Creates a new mood check-in record
     *
     * @param {string|number} userId - Discord user ID
     * @param {Object} data - Mood check-in data
     * @param {string} data.mood - User's mood (e.g., 'happy', 'sad', 'anxious')
     * @param {number} [data.intensity] - Mood intensity on 1-5 scale (default: 3)
     * @param {string} [data.activity] - Current activity or context
     * @param {string} [data.note] - Additional notes about the mood
     * @param {Date} [data.nextCheckIn] - Next scheduled check-in time
     * @returns {Promise<Object>} The created mood check-in record
     *
     * @example
     * // Create a basic mood check-in
     * await moodCheckInModule.create('123456789', {
     *   mood: 'happy',
     *   intensity: 4,
     *   activity: 'working on projects'
     * })
     *
     * // Create check-in with next reminder
     * const nextCheckIn = new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours
     * await moodCheckInModule.create('123456789', {
     *   mood: 'stressed',
     *   intensity: 3,
     *   note: 'Feeling overwhelmed with work',
     *   nextCheckIn: nextCheckIn
     * })
     */
    async create(userId, data) {
        return this.prisma.moodCheckIn.create({
            data: {
                userId: BigInt(userId),
                ...data
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
}
