/**
 * UserModule - Database operations for Discord users
 *
 * This module provides a flexible interface for managing user data in the database.
 * It handles user creation, updates, permissions, and moderation actions.
 *
 * @class UserModule
 */
export class UserModule {
    /**
     * Creates a new UserModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
    }

    /**
     * Creates or updates a user record
     *
     * If a user with the given ID exists, it updates the record with the provided data.
     * If no user exists, it creates a new record with the ID and data.
     *
     * @param {string|number} id - Discord user ID
     * @param {Object} data - User data to create/update
     * @param {string} [data.username] - Discord username
     * @param {string} [data.role] - User role: 'OWNER', 'ADMIN', 'MOD', 'USER' (default: 'USER')
     * @param {boolean} [data.isBanned] - Whether user is banned (default: false)
     * @param {Date} [data.bannedUntil] - Ban expiration date
     * @param {string} [data.banReason] - Reason for ban
     * @returns {Promise<Object>} The created or updated user record
     *
     * @example
     * // Create a new user
     * await userModule.upsert('123456789', {
     *   username: 'JohnDoe',
     *   role: 'USER'
     * })
     *
     * // Update existing user
     * await userModule.upsert('123456789', {
     *   username: 'JohnDoeUpdated',
     *   role: 'MOD'
     * })
     */
    async upsert(id, data) {
        return this.prisma.user.upsert({
            where: { id: BigInt(String(id)) },
            update: data,
            create: { id: BigInt(String(id)), ...data }
        })
    }

    /**
     * Retrieves multiple user records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of user records
     *
     * @example
     * // Get all banned users
     * const users = await userModule.findMany({
     *   where: { isBanned: true }
     * })
     *
     * // Get first 10 users with their preferences
     * const users = await userModule.findMany({
     *   take: 10,
     *   include: { preferences: true }
     * })
     */
    async findMany(args = {}) {
        return this.prisma.user.findMany(args)
    }

    /**
     * Retrieves a single user record by ID
     *
     * @param {string|number} id - Discord user ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} User record or null if not found
     *
     * @example
     * // Get basic user info
     * const user = await userModule.findById('123456789')
     *
     * // Get user with all relations included
     * const user = await userModule.findById('123456789', {
     *   include: {
     *     preferences: true,
     *     checkIns: true,
     *     ghostLetters: true
     *   }
     * })
     *
     * // Get only specific fields
     * const user = await userModule.findById('123456789', {
     *   select: { username: true, role: true, isBanned: true }
     * })
     */
    async findById(id, options = {}) {
        return this.prisma.user.findUnique({
            where: { id: BigInt(String(id)) },
            ...options
        })
    }

    /**
     * Deletes a user record from the database
     *
     * @param {string|number} id - Discord user ID
     * @returns {Promise<Object>} The deleted user record
     *
     * @example
     * await userModule.delete('123456789')
     */
    async delete(id) {
        return this.prisma.user.delete({
            where: { id: BigInt(String(id)) }
        })
    }

    /**
     * Bans a user with optional expiration and reason
     *
     * @param {string|number} id - Discord user ID
     * @param {string} reason - Reason for the ban
     * @param {Date} [until] - Ban expiration date (null for permanent)
     * @returns {Promise<Object>} The updated user record
     *
     * @example
     * // Permanent ban
     * await userModule.ban('123456789', 'Violation of community guidelines')
     *
     * // Temporary ban (7 days)
     * const banUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
     * await userModule.ban('123456789', 'Temporary suspension', banUntil)
     */
    async ban(id, reason, until = null) {
        return this.prisma.user.update({
            where: { id: BigInt(String(id)) },
            data: {
                isBanned: true,
                banReason: reason,
                bannedUntil: until
            }
        })
    }

    /**
     * Unbans a user by clearing ban status
     *
     * @param {string|number} id - Discord user ID
     * @returns {Promise<Object>} The updated user record
     *
     * @example
     * await userModule.unban('123456789')
     */
    async unban(id) {
        return this.prisma.user.update({
            where: { id: BigInt(String(id)) },
            data: {
                isBanned: false,
                banReason: null,
                bannedUntil: null
            }
        })
    }

    async findBySnowflake(snowflakeId, include = {}) {
        return this.prisma.user.findFirst({
            where: { snowflakeId },
            include
        })
    }

    async updatePermissions(id, permissions) {
        return this.prisma.user.update({
            where: { id },
            data: { permissions }
        })
    }

    /**
     * Count total users in a specific guild
     * Note: This is a simplified count. In a real implementation,
     * you might want to track guild memberships more explicitly.
     *
     * @param {string|number} guildId - Discord guild ID
     * @returns {Promise<number>} Number of users associated with this guild
     */
    async countGuildUsers(guildId) {
        // This is a simplified implementation
        // In practice, you might want to track guild memberships more explicitly
        // For now, we'll return the total user count as a placeholder
        return this.prisma.user.count({
            where: {
                // Add guild-specific filtering if you have guild membership tracking
                // For now, just return general user count
            }
        })
    }

    /**
     * Get user roles for authorization checks
     *
     * @param {string|number} userId - Discord user ID
     * @returns {Promise<string[]>} Array of user roles
     */
    async getUserRoles(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(String(userId)) },
            select: { role: true }
        })

        return user?.role ? [user.role] : []
    }
}
