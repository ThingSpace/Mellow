import { DbEncryptionHelper } from '../../helpers/db-encryption.helper.js'
import { log } from '../../functions/logger.js'

/**
 * ReportModule - Database operations for user reports
 *
 * This module provides a flexible interface for managing user report data in the database.
 * It handles report submission, retrieval, and management, with support for staff
 * replies and status tracking.
 *
 * @class ReportModule
 */
export class ReportModule {
    /**
     * Creates a new ReportModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
        this.sensitiveFields = ['message']
        this.validStatuses = ['open', 'investigating', 'resolved', 'closed']
    }

    /**
     * Creates a new report record
     *
     * @param {Object} data - Report data
     * @param {string} data.message - Report message content
     * @param {string|number} [data.userId] - Discord user ID (optional for anonymous reports)
     * @param {string} [data.status='open'] - Report status
     * @returns {Promise<Object>} The created report record
     */
    async create(data) {
        // Encrypt sensitive fields
        const encryptedData = DbEncryptionHelper.encryptFields(data, this.sensitiveFields)

        // Validate status
        const status = data.status && this.validStatuses.includes(data.status) ? data.status : 'open'

        return this.prisma.report.create({
            data: {
                message: encryptedData.message,
                userId: data.userId ? BigInt(data.userId) : undefined,
                status
            }
        })
    }

    /**
     * Creates or updates a report record
     *
     * @param {number} id - Report record ID
     * @param {Object} data - Report data to update
     * @returns {Promise<Object>} The created or updated report record
     */
    async upsert(id, data) {
        // Encrypt sensitive fields
        const encryptedData = DbEncryptionHelper.encryptFields(data, this.sensitiveFields)

        return this.prisma.report.upsert({
            where: { id },
            update: encryptedData,
            create: { id, ...encryptedData }
        })
    }

    /**
     * Retrieves multiple report records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @returns {Promise<Array>} Array of report records
     */
    async findMany(args = {}) {
        const result = await this.prisma.report.findMany({
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
            decryptedResults.forEach(report => {
                if (report.replies) {
                    report.replies = DbEncryptionHelper.processData(report.replies, this.sensitiveFields)
                }
            })
        }

        return decryptedResults
    }

    /**
     * Retrieves a single report record by ID
     *
     * @param {number} id - Report record ID
     * @param {Object} [options={}] - Additional Prisma options
     * @returns {Promise<Object|null>} Report record or null if not found
     */
    async findById(id, options = {}) {
        const result = await this.prisma.report.findUnique({
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
     * Retrieves all reports for a specific user
     *
     * @param {string|number} userId - Discord user ID
     * @param {Object} [options={}] - Additional Prisma options
     * @returns {Promise<Array>} Array of report records for the user
     */
    async findByUserId(userId, options = {}) {
        return this.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { createdAt: 'desc' },
            ...options
        })
    }

    /**
     * Deletes a report record from the database
     *
     * @param {number} id - Report record ID
     * @returns {Promise<Object>} The deleted report record
     */
    async delete(id) {
        return this.prisma.report.delete({
            where: { id }
        })
    }

    /**
     * Updates the status of a report
     *
     * @param {number} id - Report record ID
     * @param {string} status - New status ('open', 'investigating', 'resolved', 'closed')
     * @returns {Promise<Object>} The updated report record
     */
    async updateStatus(id, status) {
        if (!this.validStatuses.includes(status)) {
            throw new Error(`Invalid status: ${status}. Valid statuses are: ${this.validStatuses.join(', ')}`)
        }

        return this.prisma.report.update({
            where: { id },
            data: { status }
        })
    }

    /**
     * Adds a staff reply to a report
     *
     * @param {number} reportId - Report record ID
     * @param {string|number} staffId - Staff Discord ID
     * @param {string} message - Reply message content
     * @returns {Promise<Object>} The created report reply
     */
    async addReply(reportId, staffId, message) {
        // Encrypt message
        const encryptedMessage = encryptionService.encrypt(message)

        return this.prisma.reportReply.create({
            data: {
                reportId,
                staffId: BigInt(staffId),
                message: encryptedMessage
            }
        })
    }

    /**
     * Get all report replies for a specific report
     *
     * @param {number} reportId - Report record ID
     * @returns {Promise<Array>} Array of report replies
     */
    async getReplies(reportId) {
        const replies = await this.prisma.reportReply.findMany({
            where: { reportId },
            orderBy: { createdAt: 'asc' }
        })

        // Decrypt reply messages
        return DbEncryptionHelper.processData(replies, this.sensitiveFields)
    }

    /**
     * Get all open reports
     *
     * @param {number} [limit=10] - Maximum number of reports to return
     * @returns {Promise<Array>} Array of open report records
     */
    async getOpenReports(limit = 10) {
        return this.findMany({
            where: { status: 'open' },
            orderBy: { createdAt: 'desc' },
            take: limit
        })
    }
}
