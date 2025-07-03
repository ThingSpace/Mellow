/**
 * ModActionModule - Database operations for moderation actions
 *
 * This module provides a flexible interface for managing moderation action data in the database.
 * It handles logging of moderation actions, tracking moderator activities, and guild-specific actions.
 *
 * @class ModActionModule
 */
export class ModActionModule {
    /**
     * Creates a new ModActionModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
    }

    /**
     * Creates a new moderation action record
     *
     * @param {Object} data - Moderation action data
     * @param {string|number} data.guildId - Discord guild ID where action occurred
     * @param {string|number} data.moderatorId - Discord user ID of the moderator
     * @param {string|number} data.targetUserId - Discord user ID of the target user
     * @param {string} data.action - Type of moderation action (e.g., 'ban', 'kick', 'warn')
     * @param {string} [data.reason] - Reason for the moderation action
     * @param {string|number} [data.roleId] - Discord role ID if action involves role management
     * @returns {Promise<Object>} The created moderation action record
     *
     * @example
     * // Log a ban action
     * await modActionModule.log({
     *   guildId: '123456789',
     *   moderatorId: '987654321',
     *   targetUserId: '555666777',
     *   action: 'ban',
     *   reason: 'Violation of community guidelines'
     * })
     *
     * // Log a role assignment
     * await modActionModule.log({
     *   guildId: '123456789',
     *   moderatorId: '987654321',
     *   targetUserId: '555666777',
     *   action: 'role_add',
     *   reason: 'Promoted to moderator',
     *   roleId: '111222333'
     * })
     */
    async log(data) {
        return this.prisma.modAction.create({
            data: {
                guildId: BigInt(data.guildId),
                moderatorId: BigInt(data.moderatorId),
                targetUserId: BigInt(data.targetUserId),
                action: data.action,
                reason: data.reason,
                roleId: data.roleId ? BigInt(data.roleId) : null
            }
        })
    }

    /**
     * Creates or updates a moderation action record
     *
     * @param {number} id - Moderation action record ID
     * @param {Object} data - Moderation action data to update
     * @returns {Promise<Object>} The created or updated moderation action record
     *
     * @example
     * await modActionModule.upsert(1, {
     *   reason: 'Updated reason for action'
     * })
     */
    async upsert(id, data) {
        return this.prisma.modAction.upsert({
            where: { id },
            update: data,
            create: { id, ...data }
        })
    }

    /**
     * Retrieves multiple moderation action records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of moderation action records
     *
     * @example
     * // Get all actions for a specific guild
     * const actions = await modActionModule.findMany({
     *   where: { guildId: BigInt('123456789') },
     *   orderBy: { createdAt: 'desc' }
     * })
     *
     * // Get recent ban actions with moderator info
     * const bans = await modActionModule.findMany({
     *   where: { action: 'ban' },
     *   take: 10,
     *   include: { moderator: true, guild: true },
     *   orderBy: { createdAt: 'desc' }
     * })
     */
    async findMany(args = {}) {
        return this.prisma.modAction.findMany(args)
    }

    /**
     * Retrieves a single moderation action record by ID
     *
     * @param {number} id - Moderation action record ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} Moderation action record or null if not found
     *
     * @example
     * // Get basic action info
     * const action = await modActionModule.findById(1)
     *
     * // Get action with all relations included
     * const action = await modActionModule.findById(1, {
     *   include: { moderator: true, guild: true }
     * })
     */
    async findById(id, options = {}) {
        return this.prisma.modAction.findUnique({
            where: { id },
            ...options
        })
    }

    /**
     * Deletes a moderation action record from the database
     *
     * @param {number} id - Moderation action record ID
     * @returns {Promise<Object>} The deleted moderation action record
     *
     * @example
     * await modActionModule.delete(1)
     */
    async delete(id) {
        return this.prisma.modAction.delete({
            where: { id }
        })
    }

    /**
     * Retrieves recent moderation actions for a specific guild
     *
     * @param {string|number} guildId - Discord guild ID
     * @param {number} [limit=10] - Maximum number of records to return
     * @param {Object} [options={}] - Additional Prisma options
     * @returns {Promise<Array>} Array of moderation action records for the guild
     *
     * @example
     * // Get last 10 actions for guild
     * const actions = await modActionModule.getRecentForGuild('123456789')
     *
     * // Get last 20 actions with moderator info
     * const actions = await modActionModule.getRecentForGuild('123456789', 20, {
     *   include: { moderator: true }
     * })
     */
    async getRecentForGuild(guildId, limit = 10, options = {}) {
        return this.prisma.modAction.findMany({
            where: { guildId: BigInt(guildId) },
            orderBy: { createdAt: 'desc' },
            take: limit,
            ...options
        })
    }

    /**
     * Get recent moderation actions for a guild within specified days
     *
     * @param {string|number} guildId - Discord guild ID
     * @param {number} days - Number of days to look back (default: 7)
     * @returns {Promise<Array>} Array of recent moderation actions
     */
    async getRecentByGuild(guildId, days = 7) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

        return this.prisma.modAction.findMany({
            where: {
                guildId: BigInt(guildId),
                createdAt: { gte: since }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        })
    }

    /**
     * Count moderation actions for a specific guild
     *
     * @param {string|number} guildId - Discord guild ID
     * @returns {Promise<number>} Number of moderation actions for this guild
     */
    async countByGuild(guildId) {
        return this.prisma.modAction.count({
            where: {
                guildId: BigInt(guildId)
            }
        })
    }
}
