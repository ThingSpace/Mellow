import { DbEncryptionHelper } from '../../helpers/db-encryption.helper.js'

/**
 * FeedbackModule - Database operations for user feedback
 *
 * This module provides a flexible interface for managing user feedback data in the database.
 * It handles feedback submission, retrieval, and management.
 *
 * @class FeedbackModule
 */
export class FeedbackModule {
    /**
     * Creates a new FeedbackModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
        this.sensitiveFields = ['message']
    }

    /**
     * Creates a new feedback record
     *
     * @param {Object} data - Feedback data
     * @param {string} data.message - Feedback message content
     * @param {string|number} [data.userId] - Discord user ID (optional for anonymous feedback)
     * @returns {Promise<Object>} The created feedback record
     *
     * @example
     * // Create feedback from a user
     * await feedbackModule.create({
     *   message: 'The bot is really helpful for my mental health!',
     *   userId: '123456789'
     * })
     *
     * // Create anonymous feedback
     * await feedbackModule.create({
     *   message: 'Could you add more coping tools?'
     * })
     */
    async create(data) {
        // Encrypt sensitive fields
        const encryptedData = DbEncryptionHelper.encryptFields(data, this.sensitiveFields)

        return this.prisma.feedback.create({
            data: encryptedData
        })
    }

    /**
     * Creates or updates a feedback record
     *
     * @param {number} id - Feedback record ID
     * @param {Object} data - Feedback data to update
     * @returns {Promise<Object>} The created or updated feedback record
     *
     * @example
     * await feedbackModule.upsert(1, {
     *   message: 'Updated feedback message'
     * })
     */
    async upsert(id, data) {
        // Encrypt sensitive fields
        const encryptedData = DbEncryptionHelper.encryptFields(data, this.sensitiveFields)

        return this.prisma.feedback.upsert({
            where: { id },
            update: encryptedData,
            create: { id, ...encryptedData }
        })
    }

    /**
     * Retrieves multiple feedback records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of feedback records
     *
     * @example
     * // Get all feedback from a specific user
     * const feedback = await feedbackModule.findMany({
     *   where: { userId: BigInt('123456789') },
     *   orderBy: { createdAt: 'desc' }
     * })
     *
     * // Get recent feedback with user info
     * const feedback = await feedbackModule.findMany({
     *   take: 10,
     *   include: { user: true },
     *   orderBy: { createdAt: 'desc' }
     * })
     */
    async findMany(args = {}) {
        const result = await this.prisma.feedback.findMany(args)

        // Decrypt sensitive fields in the results
        return DbEncryptionHelper.processData(result, this.sensitiveFields)
    }

    /**
     * Retrieves a single feedback record by ID
     *
     * @param {number} id - Feedback record ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} Feedback record or null if not found
     *
     * @example
     * // Get basic feedback info
     * const feedback = await feedbackModule.findById(1)
     *
     * // Get feedback with user info included
     * const feedback = await feedbackModule.findById(1, {
     *   include: { user: true }
     * })
     */
    async findById(id, options = {}) {
        const result = await this.prisma.feedback.findUnique({
            where: { id },
            ...options
        })

        // Decrypt sensitive fields in the result
        return DbEncryptionHelper.decryptFields(result, this.sensitiveFields)
    }

    /**
     * Deletes a feedback record from the database
     *
     * @param {number} id - Feedback record ID
     * @returns {Promise<Object>} The deleted feedback record
     *
     * @example
     * await feedbackModule.delete(1)
     */
    async delete(id) {
        return this.prisma.feedback.delete({
            where: { id }
        })
    }
}
