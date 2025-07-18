import { DbEncryptionHelper } from '../../helpers/db-encryption.helper.js'

/**
 * CopingPlanModule - Database operations for coping plans
 *
 * This module provides a flexible interface for managing coping plan data in the database.
 * It handles personalized coping strategies, plan creation, and user wellness planning.
 *
 * @class CopingPlanModule
 */
export class CopingPlanModule {
    /**
     * Creates a new CopingPlanModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
        this.sensitiveFields = ['plan'] // Define fields to encrypt
    }

    /**
     * Creates a new coping plan record
     *
     * @param {Object} data - Coping plan data
     * @param {string|number} data.userId - Discord user ID
     * @param {string} data.plan - Coping plan content/strategy
     * @returns {Promise<Object>} The created coping plan record
     *
     * @example
     * // Create a coping plan
     * await copingPlanModule.create({
     *   userId: '123456789',
     *   plan: 'When I feel anxious, I will: 1) Take deep breaths, 2) Call a friend, 3) Go for a walk'
     * })
     *
     * // Create another coping plan
     * await copingPlanModule.create({
     *   userId: '123456789',
     *   plan: 'My stress management plan: Exercise daily, practice mindfulness, maintain regular sleep schedule'
     * })
     */
    async create(data) {
        // Encrypt sensitive fields
        const encryptedData = DbEncryptionHelper.encryptFields(data, this.sensitiveFields)

        return this.prisma.copingPlan.create({
            data: encryptedData
        })
    }

    /**
     * Creates or updates a coping plan record
     *
     * @param {number} id - Coping plan record ID
     * @param {Object} data - Coping plan data to update
     * @returns {Promise<Object>} The created or updated coping plan record
     *
     * @example
     * await copingPlanModule.upsert(1, {
     *   plan: 'Updated coping strategy: When overwhelmed, I will practice the 5-4-3-2-1 grounding technique'
     * })
     */
    async upsert(id, data) {
        // Encrypt sensitive fields
        const encryptedData = DbEncryptionHelper.encryptFields(data, this.sensitiveFields)

        return this.prisma.copingPlan.upsert({
            where: { id },
            update: encryptedData,
            create: { id, ...encryptedData }
        })
    }

    /**
     * Retrieves multiple coping plan records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of coping plan records
     *
     * @example
     * // Get all coping plans for a specific user
     * const plans = await copingPlanModule.findMany({
     *   where: { userId: BigInt('123456789') },
     *   orderBy: { updatedAt: 'desc' }
     * })
     *
     * // Get recent coping plans with user info
     * const plans = await copingPlanModule.findMany({
     *   take: 10,
     *   include: { user: true },
     *   orderBy: { updatedAt: 'desc' }
     * })
     */
    async findMany(args = {}) {
        const results = await this.prisma.copingPlan.findMany(args)
        // Decrypt sensitive fields in the results
        return DbEncryptionHelper.processData(results, this.sensitiveFields)
    }

    /**
     * Retrieves a single coping plan record by ID
     *
     * @param {number} id - Coping plan record ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} Coping plan record or null if not found
     *
     * @example
     * // Get basic coping plan info
     * const plan = await copingPlanModule.findById(1)
     *
     * // Get coping plan with user info included
     * const plan = await copingPlanModule.findById(1, {
     *   include: { user: true }
     * })
     */
    async findById(id, options = {}) {
        const result = await this.prisma.copingPlan.findUnique({
            where: { id },
            ...options
        })
        // Decrypt sensitive fields in the result
        return DbEncryptionHelper.decryptFields(result, this.sensitiveFields)
    }

    /**
     * Deletes a coping plan record from the database
     *
     * @param {number} id - Coping plan record ID
     * @returns {Promise<Object>} The deleted coping plan record
     *
     * @example
     * await copingPlanModule.delete(1)
     */
    async delete(id) {
        return this.prisma.copingPlan.delete({
            where: { id }
        })
    }
}
