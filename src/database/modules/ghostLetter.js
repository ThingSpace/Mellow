/**
 * GhostLetterModule - Database operations for ghost letters
 *
 * This module provides a flexible interface for managing ghost letter data in the database.
 * It handles anonymous letter creation, retrieval, and user-specific operations.
 *
 * @class GhostLetterModule
 */
export class GhostLetterModule {
    /**
     * Creates a new GhostLetterModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
    }

    /**
     * Creates a new ghost letter record
     *
     * @param {string|number} userId - Discord user ID
     * @param {Object} data - Ghost letter data
     * @param {string} data.content - Letter content
     * @returns {Promise<Object>} The created ghost letter record
     *
     * @example
     * await ghostLetterModule.create('123456789', {
     *   content: 'I want to tell you how much you mean to me...'
     * })
     */
    async create(userId, data) {
        return this.prisma.ghostLetter.create({
            data: {
                userId: BigInt(userId),
                ...data
            }
        })
    }

    /**
     * Creates or updates a ghost letter record
     *
     * @param {number} id - Ghost letter record ID
     * @param {Object} data - Ghost letter data to update
     * @returns {Promise<Object>} The created or updated ghost letter record
     *
     * @example
     * await ghostLetterModule.upsert(1, {
     *   content: 'Updated letter content'
     * })
     */
    async upsert(id, data) {
        return this.prisma.ghostLetter.upsert({
            where: { id },
            update: data,
            create: { id, ...data }
        })
    }

    /**
     * Retrieves multiple ghost letter records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of ghost letter records
     *
     * @example
     * // Get all ghost letters for a specific user
     * const letters = await ghostLetterModule.findMany({
     *   where: { userId: BigInt('123456789') },
     *   orderBy: { createdAt: 'desc' }
     * })
     *
     * // Get recent ghost letters with user info
     * const letters = await ghostLetterModule.findMany({
     *   take: 10,
     *   include: { user: true },
     *   orderBy: { createdAt: 'desc' }
     * })
     */
    async findMany(args = {}) {
        return this.prisma.ghostLetter.findMany(args)
    }

    /**
     * Retrieves a single ghost letter record by ID
     *
     * @param {number} id - Ghost letter record ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} Ghost letter record or null if not found
     *
     * @example
     * // Get basic ghost letter info
     * const letter = await ghostLetterModule.findById(1)
     *
     * // Get ghost letter with user info included
     * const letter = await ghostLetterModule.findById(1, {
     *   include: { user: true }
     * })
     */
    async findById(id, options = {}) {
        return this.prisma.ghostLetter.findUnique({
            where: { id },
            ...options
        })
    }

    /**
     * Deletes a ghost letter record from the database
     *
     * @param {number} id - Ghost letter record ID
     * @returns {Promise<Object>} The deleted ghost letter record
     *
     * @example
     * await ghostLetterModule.delete(1)
     */
    async delete(id) {
        return this.prisma.ghostLetter.delete({
            where: { id }
        })
    }

    /**
     * Retrieves all ghost letters for a specific user
     *
     * @param {string|number} userId - Discord user ID
     * @param {number} [limit=20] - Maximum number of records to return
     * @param {Object} [options={}] - Additional Prisma options
     * @returns {Promise<Array>} Array of ghost letter records for the user
     *
     * @example
     * // Get last 20 ghost letters for user
     * const letters = await ghostLetterModule.getAllForUser('123456789')
     *
     * // Get last 10 ghost letters with user info
     * const letters = await ghostLetterModule.getAllForUser('123456789', 10, {
     *   include: { user: true }
     * })
     */
    async getAllForUser(userId, limit = 20, options = {}) {
        return this.prisma.ghostLetter.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { createdAt: 'desc' },
            take: limit,
            ...options
        })
    }

    /**
     * Deletes all ghost letters for a specific user
     *
     * @param {string|number} userId - Discord user ID
     * @returns {Promise<Object>} Deletion result with count of deleted records
     *
     * @example
     * const result = await ghostLetterModule.clearForUser('123456789')
     * console.log(`Deleted ${result.count} ghost letters`)
     */
    async clearForUser(userId) {
        return this.prisma.ghostLetter.deleteMany({
            where: { userId: BigInt(userId) }
        })
    }
}
