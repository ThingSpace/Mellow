import { DbEncryptionHelper } from '../../helpers/db-encryption.helper.js'

/**
 * ReportModule - Database operations for user reports
 *
 * This module provides a flexible interface for managing user report data in the database.
 * It handles report submission, retrieval, and management.
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
        this.sensitiveFields = ['message'] // Define fields to encrypt
    }

    /**
     * Creates a new report record
     *
     * @param {Object} data - Report data
     * @param {string} data.message - Report message content
     * @param {string|number} [data.userId] - Discord user ID (optional for anonymous reports)
     * @returns {Promise<Object>} The created report record
     *
     * @example
     * // Create report from a user
     * await reportModule.create({
     *   message: 'I found inappropriate content in the server',
     *   userId: '123456789'
     * })
     *
     * // Create anonymous report
     * await reportModule.create({
     *   message: 'Someone is harassing other users'
     * })
     */
    async create(data) {
        // Encrypt sensitive fields
        const encryptedData = DbEncryptionHelper.encryptFields(data, this.sensitiveFields)

        return this.prisma.report.create({
            data: encryptedData
        })
    }

    /**
     * Creates or updates a report record
     *
     * @param {number} id - Report record ID
     * @param {Object} data - Report data to update
     * @returns {Promise<Object>} The created or updated report record
     *
     * @example
     * await reportModule.upsert(1, {
     *   message: 'Updated report message'
     * })
     */
    async upsert(id, data) {
        return this.prisma.report.upsert({
            where: { id },
            update: data,
            create: { id, ...data }
        })
    }

    /**
     * Retrieves multiple report records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of report records
     *
     * @example
     * // Get all reports from a specific user
     * const reports = await reportModule.findMany({
     *   where: { userId: BigInt('123456789') },
     *   orderBy: { createdAt: 'desc' }
     * })
     *
     * // Get recent reports with user info
     * const reports = await reportModule.findMany({
     *   take: 10,
     *   include: { user: true },
     *   orderBy: { createdAt: 'desc' }
     * })
     */
    async findMany(args = {}) {
        const results = await this.prisma.report.findMany(args)
        // Decrypt sensitive fields in the results
        return DbEncryptionHelper.processData(results, this.sensitiveFields)
    }

    /**
     * Retrieves a single report record by ID
     *
     * @param {number} id - Report record ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} Report record or null if not found
     *
     * @example
     * // Get basic report info
     * const report = await reportModule.findById(1)
     *
     * // Get report with user info included
     * const report = await reportModule.findById(1, {
     *   include: { user: true }
     * })
     */
    async findById(id, options = {}) {
        const result = await this.prisma.report.findUnique({
            where: { id },
            ...options
        })
        // Decrypt sensitive fields in the result
        return DbEncryptionHelper.decryptFields(result, this.sensitiveFields)
    }

    /**
     * Deletes a report record from the database
     *
     * @param {number} id - Report record ID
     * @returns {Promise<Object>} The deleted report record
     *
     * @example
     * await reportModule.delete(1)
     */
    async delete(id) {
        return this.prisma.report.delete({
            where: { id }
        })
    }
}
