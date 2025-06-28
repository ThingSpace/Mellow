/**
 * CopingToolUsageModule - Database operations for coping tool usage tracking
 *
 * This module provides a flexible interface for managing coping tool usage data in the database.
 * It tracks when users interact with various coping tools and mechanisms.
 * Respects Mellow configuration for coping tool features.
 *
 * @class CopingToolUsageModule
 */
export class CopingToolUsageModule {
    /**
     * Creates a new CopingToolUsageModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
    }

    /**
     * Records coping tool usage if coping tools are enabled
     *
     * @param {Object} data - Coping tool usage data
     * @param {string|number} data.userId - Discord user ID
     * @param {string} data.toolName - Name of the coping tool used
     * @returns {Promise<Object|null>} Created usage record or null if disabled
     */
    async create(data) {
        // Check if coping tools are enabled in Mellow config
        const mellowConfig = await this.prisma.mellow.findUnique({
            where: { id: 1 },
            select: { enabled: true, copingTools: true }
        })

        if (!mellowConfig?.enabled || !mellowConfig?.copingTools) {
            return null // Coping tools are disabled
        }

        return this.prisma.copingToolUsage.create({
            data: {
                userId: BigInt(data.userId),
                toolName: data.toolName
            }
        })
    }

    /**
     * Creates or updates a coping tool usage record
     *
     * @param {number} id - Coping tool usage record ID
     * @param {Object} data - Coping tool usage data to update
     * @returns {Promise<Object>} The created or updated coping tool usage record
     *
     * @example
     * await copingToolUsageModule.upsert(1, {
     *   toolName: 'updated_tool_name'
     * })
     */
    async upsert(id, data) {
        return this.prisma.copingToolUsage.upsert({
            where: { id },
            update: data,
            create: { id, ...data }
        })
    }

    /**
     * Retrieves multiple coping tool usage records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of coping tool usage records
     *
     * @example
     * // Get all usage for a specific user
     * const usage = await copingToolUsageModule.findMany({
     *   where: { userId: BigInt('123456789') },
     *   orderBy: { usedAt: 'desc' }
     * })
     *
     * // Get recent usage of specific tool
     * const breathingUsage = await copingToolUsageModule.findMany({
     *   where: { toolName: 'breathing' },
     *   take: 10,
     *   include: { user: true },
     *   orderBy: { usedAt: 'desc' }
     * })
     */
    async findMany(args = {}) {
        return this.prisma.copingToolUsage.findMany(args)
    }

    /**
     * Retrieves a single coping tool usage record by ID
     *
     * @param {number} id - Coping tool usage record ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} Coping tool usage record or null if not found
     *
     * @example
     * // Get basic usage info
     * const usage = await copingToolUsageModule.findById(1)
     *
     * // Get usage with user info included
     * const usage = await copingToolUsageModule.findById(1, {
     *   include: { user: true }
     * })
     */
    async findById(id, options = {}) {
        return this.prisma.copingToolUsage.findUnique({
            where: { id },
            ...options
        })
    }

    /**
     * Deletes a coping tool usage record from the database
     *
     * @param {number} id - Coping tool usage record ID
     * @returns {Promise<Object>} The deleted coping tool usage record
     *
     * @example
     * await copingToolUsageModule.delete(1)
     */
    async delete(id) {
        return this.prisma.copingToolUsage.delete({
            where: { id }
        })
    }

    /**
     * Retrieves all coping tool usage for a specific user
     *
     * @param {string|number} userId - Discord user ID
     * @param {number} [limit=30] - Maximum number of records to return
     * @param {Object} [options={}] - Additional Prisma options
     * @returns {Promise<Array>} Array of coping tool usage records for the user
     *
     * @example
     * // Get last 30 tool usages for user
     * const usage = await copingToolUsageModule.getAllForUser('123456789')
     *
     * // Get last 10 usages with user info
     * const usage = await copingToolUsageModule.getAllForUser('123456789', 10, {
     *   include: { user: true }
     * })
     */
    async getAllForUser(userId, limit = 30, options = {}) {
        return this.prisma.copingToolUsage.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { usedAt: 'desc' },
            take: limit,
            ...options
        })
    }

    /**
     * Checks if coping tools are available for a user
     *
     * @returns {Promise<boolean>} Whether coping tools are available
     */
    async isAvailable() {
        const mellowConfig = await this.prisma.mellow.findUnique({
            where: { id: 1 },
            select: { enabled: true, copingTools: true }
        })

        return mellowConfig?.enabled && mellowConfig?.copingTools
    }

    /**
     * Gets usage statistics respecting user preferences
     *
     * @param {string|number} userId - Discord user ID
     * @param {Object} [options={}] - Query options
     * @returns {Promise<Array|null>} Usage statistics or null if disabled
     */
    async getUserStats(userId, options = {}) {
        if (!(await this.isAvailable())) {
            return null
        }

        // Check user privacy preferences
        const userPrefs = await this.prisma.userPreferences.findUnique({
            where: { id: BigInt(userId) },
            select: { journalPrivacy: true }
        })

        // If user has privacy enabled, only return basic stats
        const selectFields = userPrefs?.journalPrivacy ? { toolName: true, usedAt: true } : undefined

        return this.prisma.copingToolUsage.findMany({
            where: { userId: BigInt(userId) },
            select: selectFields,
            ...options
        })
    }

    /**
     * Get the most commonly used coping tools for a user (top 3)
     * @param {string|number} userId
     * @returns {Promise<string[]>}
     */
    async getCommonToolsForUser(userId) {
        const usages = await this.prisma.copingToolUsage.groupBy({
            by: ['toolName'],
            where: { userId: BigInt(userId) },
            _count: { toolName: true },
            orderBy: { _count: { toolName: 'desc' } },
            take: 3
        })
        return usages.map(u => u.toolName)
    }
}
