import { DbEncryptionHelper } from '../../helpers/db-encryption.helper.js'

/**
 * GratitudeEntryModule - Database operations for gratitude entries
 *
 * This module provides a flexible interface for managing gratitude entry data in the database.
 * It handles user gratitude journaling and retrieval of positive reflections.
 *
 * @class GratitudeEntryModule
 */
export class GratitudeEntryModule {
    /**
     * Creates a new GratitudeEntryModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
        this.sensitiveFields = ['item'] // Define fields to encrypt
    }

    /**
     * Creates a new gratitude entry record
     *
     * @param {Object} data - Gratitude entry data
     * @param {string|number} data.userId - Discord user ID
     * @param {string} data.item - Item or thing the user is grateful for
     * @returns {Promise<Object>} The created gratitude entry record
     *
     * @example
     * // Create a gratitude entry
     * await gratitudeEntryModule.create({
     *   userId: '123456789',
     *   item: 'My supportive family'
     * })
     *
     * // Create another gratitude entry
     * await gratitudeEntryModule.create({
     *   userId: '123456789',
     *   item: 'A beautiful sunny day'
     * })
     */
    async create(data) {
        // Encrypt sensitive fields
        const encryptedData = DbEncryptionHelper.encryptFields(data, this.sensitiveFields)

        return this.prisma.gratitudeEntry.create({
            data: encryptedData
        })
    }

    /**
     * Creates or updates a gratitude entry record
     *
     * @param {number} id - Gratitude entry record ID
     * @param {Object} data - Gratitude entry data to update
     * @returns {Promise<Object>} The created or updated gratitude entry record
     *
     * @example
     * await gratitudeEntryModule.upsert(1, {
     *   item: 'Updated gratitude item'
     * })
     */
    async upsert(id, data) {
        // Encrypt sensitive fields
        const encryptedData = DbEncryptionHelper.encryptFields(data, this.sensitiveFields)

        return this.prisma.gratitudeEntry.upsert({
            where: { id },
            update: encryptedData,
            create: { id, ...encryptedData }
        })
    }

    /**
     * Retrieves multiple gratitude entry records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of gratitude entry records
     *
     * @example
     * // Get all gratitude entries for a specific user
     * const entries = await gratitudeEntryModule.findMany({
     *   where: { userId: BigInt('123456789') },
     *   orderBy: { createdAt: 'desc' }
     * })
     *
     * // Get recent gratitude entries with user info
     * const entries = await gratitudeEntryModule.findMany({
     *   take: 10,
     *   include: { user: true },
     *   orderBy: { createdAt: 'desc' }
     * })
     */
    async findMany(args = {}) {
        const results = await this.prisma.gratitudeEntry.findMany(args)
        // Decrypt sensitive fields in the results
        return DbEncryptionHelper.processData(results, this.sensitiveFields)
    }

    /**
     * Retrieves a single gratitude entry record by ID
     *
     * @param {number} id - Gratitude entry record ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} Gratitude entry record or null if not found
     *
     * @example
     * // Get basic gratitude entry info
     * const entry = await gratitudeEntryModule.findById(1)
     *
     * // Get gratitude entry with user info included
     * const entry = await gratitudeEntryModule.findById(1, {
     *   include: { user: true }
     * })
     */
    async findById(id, options = {}) {
        const result = await this.prisma.gratitudeEntry.findUnique({
            where: { id },
            ...options
        })
        // Decrypt sensitive fields in the result
        return DbEncryptionHelper.decryptFields(result, this.sensitiveFields)
    }

    /**
     * Gets gratitude entries for a specific user
     *
     * @param {string|number} userId - Discord user ID
     * @param {number} [limit=50] - Maximum number of entries to retrieve
     * @returns {Promise<Array>} Array of gratitude entry records for the user
     *
     * @example
     * // Get the latest 10 gratitude entries for a user
     * const entries = await gratitudeEntryModule.getEntriesForUser('123456789', 10)
     */
    async getEntriesForUser(userId, limit = 50) {
        const results = await this.prisma.gratitudeEntry.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { createdAt: 'desc' },
            take: limit
        })
        // Decrypt sensitive fields in the results
        return DbEncryptionHelper.processData(results, this.sensitiveFields)
    }

    /**
     * Deletes a gratitude entry record from the database
     *
     * @param {number} id - Gratitude entry record ID
     * @returns {Promise<Object>} The deleted gratitude entry record
     *
     * @example
     * await gratitudeEntryModule.delete(1)
     */
    async delete(id) {
        return this.prisma.gratitudeEntry.delete({
            where: { id }
        })
    }
}
