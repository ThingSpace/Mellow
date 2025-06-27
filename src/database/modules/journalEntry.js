/**
 * JournalEntryModule - Database operations for journal entries
 *
 * This module provides a flexible interface for managing journal entry data in the database.
 * It respects user preferences for privacy and journal settings.
 *
 * @class JournalEntryModule
 */
export class JournalEntryModule {
    /**
     * Creates a new JournalEntryModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
    }

    /**
     * Creates a new journal entry respecting user privacy preferences
     *
     * @param {Object} data - Journal entry data
     * @param {string|number} data.userId - Discord user ID
     * @param {string} data.content - Journal content
     * @param {boolean} [data.private] - Override privacy setting
     * @returns {Promise<Object>} Created journal entry record
     */
    async create(data) {
        // Get user privacy preferences
        const userPrefs = await this.prisma.userPreferences.findUnique({
            where: { id: BigInt(data.userId) },
            select: { journalPrivacy: true }
        })

        // Use user preference or provided privacy setting
        const isPrivate = data.private !== undefined ? data.private : (userPrefs?.journalPrivacy ?? true)

        return this.prisma.journalEntry.create({
            data: {
                userId: BigInt(data.userId),
                content: data.content,
                private: isPrivate
            }
        })
    }

    /**
     * Creates or updates a journal entry record
     *
     * @param {number} id - Journal entry record ID
     * @param {Object} data - Journal entry data to update
     * @returns {Promise<Object>} The created or updated journal entry record
     *
     * @example
     * await journalEntryModule.upsert(1, {
     *   content: 'Updated journal content',
     *   private: false
     * })
     */
    async upsert(id, data) {
        return this.prisma.journalEntry.upsert({
            where: { id },
            update: data,
            create: { id, ...data }
        })
    }

    /**
     * Retrieves multiple journal entry records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of journal entry records
     *
     * @example
     * // Get all journal entries for a specific user
     * const entries = await journalEntryModule.findMany({
     *   where: { userId: BigInt('123456789') },
     *   orderBy: { createdAt: 'desc' }
     * })
     *
     * // Get public journal entries
     * const publicEntries = await journalEntryModule.findMany({
     *   where: { private: false },
     *   take: 10,
     *   include: { user: true },
     *   orderBy: { createdAt: 'desc' }
     * })
     */
    async findMany(args = {}) {
        return this.prisma.journalEntry.findMany(args)
    }

    /**
     * Retrieves a single journal entry record by ID
     *
     * @param {number} id - Journal entry record ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} Journal entry record or null if not found
     *
     * @example
     * // Get basic journal entry info
     * const entry = await journalEntryModule.findById(1)
     *
     * // Get journal entry with user info included
     * const entry = await journalEntryModule.findById(1, {
     *   include: { user: true }
     * })
     */
    async findById(id, options = {}) {
        return this.prisma.journalEntry.findUnique({
            where: { id },
            ...options
        })
    }

    /**
     * Deletes a journal entry record from the database
     *
     * @param {number} id - Journal entry record ID
     * @returns {Promise<Object>} The deleted journal entry record
     *
     * @example
     * await journalEntryModule.delete(1)
     */
    async delete(id) {
        return this.prisma.journalEntry.delete({
            where: { id }
        })
    }

    /**
     * Retrieves journal entries respecting privacy settings
     *
     * @param {string|number} userId - Discord user ID
     * @param {string|number} [requesterId] - ID of user requesting entries
     * @param {Object} [options={}] - Additional query options
     * @returns {Promise<Array>} Journal entries the requester can access
     */
    async findByUserId(userId, requesterId = null, options = {}) {
        const isOwner = !requesterId || BigInt(userId) === BigInt(requesterId)

        // Non-owners can only see public entries
        const whereClause = isOwner ? { userId: BigInt(userId) } : { userId: BigInt(userId), private: false }

        return this.prisma.journalEntry.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            ...options
        })
    }

    /**
     * Updates journal entry privacy respecting user preferences
     *
     * @param {number} entryId - Journal entry ID
     * @param {string|number} userId - User ID (for ownership verification)
     * @param {Object} data - Update data
     * @returns {Promise<Object|null>} Updated entry or null if unauthorized
     */
    async updatePrivacy(entryId, userId, data) {
        // Verify ownership
        const entry = await this.prisma.journalEntry.findFirst({
            where: { id: entryId, userId: BigInt(userId) }
        })

        if (!entry) {
            return null // Not found or not owned by user
        }

        return this.prisma.journalEntry.update({
            where: { id: entryId },
            data: { private: data.private }
        })
    }
}
