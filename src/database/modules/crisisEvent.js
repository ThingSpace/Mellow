/**
 * CrisisEventModule - Database operations for crisis events
 *
 * This module provides a flexible interface for managing crisis event data in the database.
 * Crisis events are serious situations that require immediate attention and escalation.
 * Respects Mellow configuration for crisis detection and alert features.
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
     * Creates a new crisis event record if crisis tools are enabled
     *
     * @param {Object} data - Crisis event data
     * @param {string|number} data.userId - Discord user ID
     * @param {string} [data.details] - Details about the crisis
     * @param {boolean} [data.escalated] - Whether the crisis was escalated
     * @returns {Promise<Object|null>} Created crisis event record or null if disabled
     */
    async create(data) {
        // Check if crisis tools are enabled in Mellow config
        const mellowConfig = await this.prisma.mellow.findUnique({
            where: { id: 1 },
            select: { enabled: true, crisisTools: true }
        })

        if (!mellowConfig?.enabled || !mellowConfig?.crisisTools) {
            return null // Crisis tools are disabled
        }

        return this.prisma.crisisEvent.create({
            data: {
                userId: BigInt(data.userId),
                details: data.details,
                escalated: data.escalated || false
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

    /**
     * Checks if crisis detection is available
     *
     * @returns {Promise<boolean>} Whether crisis tools are available
     */
    async isAvailable() {
        const mellowConfig = await this.prisma.mellow.findUnique({
            where: { id: 1 },
            select: { enabled: true, crisisTools: true }
        })

        return mellowConfig?.enabled && mellowConfig?.crisisTools
    }

    /**
     * Gets crisis events that need escalation based on guild settings
     *
     * @param {string|number} guildId - Discord guild ID
     * @returns {Promise<Array>} Crisis events needing escalation
     */
    async getEventsNeedingEscalation(guildId) {
        if (!(await this.isAvailable())) {
            return []
        }

        // Check if crisis alerts are enabled for the guild
        const guild = await this.prisma.guild.findUnique({
            where: { id: BigInt(guildId) },
            select: { enableCrisisAlerts: true }
        })

        if (!guild?.enableCrisisAlerts) {
            return []
        }

        return this.prisma.crisisEvent.findMany({
            where: {
                escalated: false,
                // Add time-based criteria for escalation
                detectedAt: {
                    gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
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
     * Get recent crisis events for a specific guild
     *
     * @param {string|number} guildId - Discord guild ID
     * @param {number} days - Number of days to look back (default: 7)
     * @returns {Promise<Array>} Array of recent crisis events
     */
    async getRecentByGuild(guildId, days = 7) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

        // Note: Since CrisisEvent doesn't have guildId, return all recent events
        // The calling code should filter by guild membership if needed
        return this.prisma.crisisEvent.findMany({
            where: {
                detectedAt: { gte: since }
            },
            orderBy: { detectedAt: 'desc' },
            take: 50,
            include: {
                user: {
                    select: { id: true, username: true }
                }
            }
        })
    }

    /**
     * Count crisis events for a specific guild
     *
     * @param {string|number} guildId - Discord guild ID
     * @returns {Promise<number>} Number of crisis events for this guild
     */
    async countByGuild(guildId) {
        // Note: Since CrisisEvent doesn't have guildId, return total count for now.
        // The calling code should filter by guild membership if needed.
        return this.prisma.crisisEvent.count()
    }
}
