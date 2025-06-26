/**
 * FavoriteCopingToolModule - Database operations for favorite coping tools
 *
 * This module provides a flexible interface for managing favorite coping tool data in the database.
 * It handles user preferences for coping tools, quick access to preferred strategies, and personalization.
 *
 * @class FavoriteCopingToolModule
 */
export class FavoriteCopingToolModule {
    /**
     * Creates a new FavoriteCopingToolModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
    }

    /**
     * Creates a new favorite coping tool record
     *
     * @param {Object} data - Favorite coping tool data
     * @param {string|number} data.userId - Discord user ID
     * @param {string} data.tool - Name of the coping tool (e.g., 'breathing', 'journaling', 'grounding')
     * @returns {Promise<Object>} The created favorite coping tool record
     *
     * @example
     * // Add breathing as a favorite coping tool
     * await favoriteCopingToolModule.create({
     *   userId: '123456789',
     *   tool: 'breathing'
     * })
     *
     * // Add journaling as a favorite coping tool
     * await favoriteCopingToolModule.create({
     *   userId: '123456789',
     *   tool: 'journaling'
     * })
     */
    async create(data) {
        return this.prisma.favoriteCopingTool.create({ data })
    }

    /**
     * Creates or updates a favorite coping tool record
     *
     * @param {number} id - Favorite coping tool record ID
     * @param {Object} data - Favorite coping tool data to update
     * @returns {Promise<Object>} The created or updated favorite coping tool record
     *
     * @example
     * await favoriteCopingToolModule.upsert(1, {
     *   tool: 'updated_tool_name'
     * })
     */
    async upsert(id, data) {
        return this.prisma.favoriteCopingTool.upsert({
            where: { id },
            update: data,
            create: { id, ...data }
        })
    }

    /**
     * Retrieves multiple favorite coping tool records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of favorite coping tool records
     *
     * @example
     * // Get all favorite coping tools for a specific user
     * const favorites = await favoriteCopingToolModule.findMany({
     *   where: { userId: BigInt('123456789') }
     * })
     *
     * // Get all users who favorited breathing exercises
     * const breathingFans = await favoriteCopingToolModule.findMany({
     *   where: { tool: 'breathing' },
     *   include: { user: true }
     * })
     */
    async findMany(args = {}) {
        return this.prisma.favoriteCopingTool.findMany(args)
    }

    /**
     * Retrieves a single favorite coping tool record by ID
     *
     * @param {number} id - Favorite coping tool record ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} Favorite coping tool record or null if not found
     *
     * @example
     * // Get basic favorite coping tool info
     * const favorite = await favoriteCopingToolModule.findById(1)
     *
     * // Get favorite coping tool with user info included
     * const favorite = await favoriteCopingToolModule.findById(1, {
     *   include: { user: true }
     * })
     */
    async findById(id, options = {}) {
        return this.prisma.favoriteCopingTool.findUnique({
            where: { id },
            ...options
        })
    }

    /**
     * Deletes a favorite coping tool record from the database
     *
     * @param {number} id - Favorite coping tool record ID
     * @returns {Promise<Object>} The deleted favorite coping tool record
     *
     * @example
     * await favoriteCopingToolModule.delete(1)
     */
    async delete(id) {
        return this.prisma.favoriteCopingTool.delete({
            where: { id }
        })
    }
}
