/**
 * CrisisEventModule - Database operations for crisis events
 *
 * This module provides a flexible interface for managing crisis event data in the database.
 * It handles crisis detection, escalation tracking, and support needs analysis.
 *
 * @class CrisisEventModule
 */
export class CrisisEventModule {
    /**
     * Creates a new CrisisEventModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
    }

    /**
     * Creates a new crisis event record
     *
     * @param {string|number} userId - Discord user ID
     * @param {Object} data - Crisis event data
     * @param {string} [data.details] - Details about the crisis event
     * @param {boolean} [data.escalated] - Whether the event has been escalated (default: false)
     * @param {Date} [data.detectedAt] - When the crisis was detected (default: current time)
     * @returns {Promise<Object>} The created crisis event record
     *
     * @example
     * // Create a basic crisis event
     * await crisisEventModule.add('123456789', {
     *   details: 'User expressed suicidal thoughts',
     *   escalated: false
     * })
     *
     * // Create escalated crisis event
     * await crisisEventModule.add('123456789', {
     *   details: 'Immediate intervention required',
     *   escalated: true
     * })
     */
    async add(userId, data) {
        return this.prisma.crisisEvent.create({
            data: {
                userId: BigInt(userId),
                detectedAt: new Date(),
                ...data
            }
        })
    }

    /**
     * Creates or updates a crisis event record
     *
     * @param {number} id - Crisis event record ID
     * @param {Object} data - Crisis event data to update
     * @returns {Promise<Object>} The created or updated crisis event record
     *
     * @example
     * await crisisEventModule.upsert(1, {
     *   details: 'Updated crisis details',
     *   escalated: true
     * })
     */
    async upsert(id, data) {
        return this.prisma.crisisEvent.upsert({
            where: { id },
            update: data,
            create: { id, ...data }
        })
    }

    /**
     * Retrieves multiple crisis event records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of crisis event records
     *
     * @example
     * // Get all crisis events for a specific user
     * const events = await crisisEventModule.findMany({
     *   where: { userId: BigInt('123456789') },
     *   orderBy: { detectedAt: 'desc' }
     * })
     *
     * // Get escalated crisis events
     * const escalatedEvents = await crisisEventModule.findMany({
     *   where: { escalated: true },
     *   include: { user: true },
     *   orderBy: { detectedAt: 'desc' }
     * })
     */
    async findMany(args = {}) {
        return this.prisma.crisisEvent.findMany(args)
    }

    /**
     * Retrieves a single crisis event record by ID
     *
     * @param {number} id - Crisis event record ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} Crisis event record or null if not found
     *
     * @example
     * // Get basic crisis event info
     * const event = await crisisEventModule.findById(1)
     *
     * // Get crisis event with user info included
     * const event = await crisisEventModule.findById(1, {
     *   include: { user: true }
     * })
     */
    async findById(id, options = {}) {
        return this.prisma.crisisEvent.findUnique({
            where: { id },
            ...options
        })
    }

    /**
     * Deletes a crisis event record from the database
     *
     * @param {number} id - Crisis event record ID
     * @returns {Promise<Object>} The deleted crisis event record
     *
     * @example
     * await crisisEventModule.delete(1)
     */
    async delete(id) {
        return this.prisma.crisisEvent.delete({
            where: { id }
        })
    }

    /**
     * Retrieves all crisis events for a specific user
     *
     * @param {string|number} userId - Discord user ID
     * @param {number} [limit=10] - Maximum number of records to return
     * @param {Object} [options={}] - Additional Prisma options
     * @returns {Promise<Array>} Array of crisis event records for the user
     *
     * @example
     * // Get last 10 crisis events for user
     * const events = await crisisEventModule.getAllForUser('123456789')
     *
     * // Get last 5 events with user info
     * const events = await crisisEventModule.getAllForUser('123456789', 5, {
     *   include: { user: true }
     * })
     */
    async getAllForUser(userId, limit = 10, options = {}) {
        return this.prisma.crisisEvent.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { detectedAt: 'desc' },
            take: limit,
            ...options
        })
    }
}
