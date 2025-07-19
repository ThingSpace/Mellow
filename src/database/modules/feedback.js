import { DbEncryptionHelper } from '../../helpers/db-encryption.helper.js'
import { log } from '../../functions/logger.js'

/**
 * FeedbackModule - Database operations for user feedback
 *
 * This module provides a flexible interface for managing user feedback data in the database.
 * It handles feedback submission, retrieval, management, and now includes support for
 * staff replies and approval for testimonials.
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
     * @param {boolean} [data.public] - Whether this feedback can be shared publicly (default: false)
     * @returns {Promise<Object>} The created feedback record
     */
    async create(data) {
        // Encrypt sensitive fields
        const encryptedData = DbEncryptionHelper.encryptFields(data, this.sensitiveFields)

        return this.prisma.feedback.create({
            data: {
                message: encryptedData.message,
                userId: data.userId ? BigInt(data.userId) : undefined,
                public: data.public || false,
                approved: false // New feedback starts unapproved
            }
        })
    }

    /**
     * Creates or updates a feedback record
     *
     * @param {number} id - Feedback record ID
     * @param {Object} data - Feedback data to update
     * @returns {Promise<Object>} The created or updated feedback record
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
     * @returns {Promise<Array>} Array of feedback records
     */
    async findMany(args = {}) {
        const result = await this.prisma.feedback.findMany({
            ...args,
            include: {
                ...(args.include || {}),
                replies: args.include?.replies !== false
            }
        })

        // Decrypt sensitive fields in the results
        const decryptedResults = DbEncryptionHelper.processData(result, this.sensitiveFields)

        // If we have replies, decrypt those too
        if (decryptedResults.length > 0 && decryptedResults[0].replies) {
            decryptedResults.forEach(feedback => {
                if (feedback.replies) {
                    feedback.replies = DbEncryptionHelper.processData(feedback.replies, this.sensitiveFields)
                }
            })
        }

        return decryptedResults
    }

    /**
     * Retrieves a single feedback record by ID
     *
     * @param {number} id - Feedback record ID
     * @param {Object} [options={}] - Additional Prisma options
     * @returns {Promise<Object|null>} Feedback record or null if not found
     */
    async findById(id, options = {}) {
        const result = await this.prisma.feedback.findUnique({
            where: { id },
            ...options,
            include: {
                ...(options.include || {}),
                replies: options.include?.replies !== false
            }
        })

        if (!result) return null

        // Decrypt sensitive fields in the result
        const decryptedResult = DbEncryptionHelper.decryptFields(result, this.sensitiveFields)

        // If we have replies, decrypt those too
        if (decryptedResult.replies) {
            decryptedResult.replies = DbEncryptionHelper.processData(decryptedResult.replies, this.sensitiveFields)
        }

        return decryptedResult
    }

    /**
     * Retrieves all feedback for a specific user
     *
     * @param {string|number} userId - Discord user ID
     * @param {Object} [options={}] - Additional Prisma options
     * @returns {Promise<Array>} Array of feedback records for the user
     */
    async findByUserId(userId, options = {}) {
        return this.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { createdAt: 'desc' },
            ...options,
            include: {
                ...(options.include || {}),
                replies: options.include?.replies !== false
            }
        })
    }

    /**
     * Deletes a feedback record from the database
     *
     * @param {number} id - Feedback record ID
     * @returns {Promise<Object>} The deleted feedback record
     */
    async delete(id) {
        return this.prisma.feedback.delete({
            where: { id }
        })
    }

    /**
     * Updates the approval status of a feedback record
     *
     * @param {number} id - Feedback record ID
     * @param {boolean} approved - New approval status
     * @returns {Promise<Object>} The updated feedback record
     */
    async updateApproval(id, approved) {
        return this.prisma.feedback.update({
            where: { id },
            data: { approved }
        })
    }

    /**
     * Updates the public status of a feedback record
     *
     * @param {number} id - Feedback record ID
     * @param {boolean} isPublic - New public status
     * @returns {Promise<Object>} The updated feedback record
     */
    async updatePublicStatus(id, isPublic) {
        return this.prisma.feedback.update({
            where: { id },
            data: { public: isPublic }
        })
    }

    /**
     * Updates the featured status of a feedback record
     *
     * @param {number} id - Feedback record ID
     * @param {boolean} featured - New featured status
     * @returns {Promise<Object>} The updated feedback record
     */
    async updateFeaturedStatus(id, featured) {
        return this.prisma.feedback.update({
            where: { id },
            data: { featured }
        })
    }

    /**
     * Adds a staff reply to a feedback
     *
     * @param {number} feedbackId - Feedback record ID
     * @param {string|number} staffId - Staff Discord ID
     * @param {string} message - Reply message content
     * @returns {Promise<Object>} The created feedback reply
     */
    async addReply(feedbackId, staffId, message) {
        // Encrypt message
        const encryptedMessage = encryptionService.encrypt(message)

        return this.prisma.feedbackReply.create({
            data: {
                feedbackId,
                staffId: BigInt(staffId),
                message: encryptedMessage
            }
        })
    }

    /**
     * Get all feedback replies for a specific feedback
     *
     * @param {number} feedbackId - Feedback record ID
     * @returns {Promise<Array>} Array of feedback replies
     */
    async getReplies(feedbackId) {
        const replies = await this.prisma.feedbackReply.findMany({
            where: { feedbackId },
            orderBy: { createdAt: 'asc' }
        })

        // Decrypt reply messages
        return DbEncryptionHelper.processData(replies, this.sensitiveFields)
    }

    /**
     * Get all approved public feedback that can be used as testimonials
     *
     * @param {number} [limit=10] - Maximum number of testimonials to return
     * @returns {Promise<Array>} Array of approved public feedback records
     */
    async getTestimonials(limit = 10) {
        return this.findMany({
            where: {
                approved: true,
                public: true
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        })
    }
}
