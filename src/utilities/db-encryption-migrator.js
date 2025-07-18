import { encryptionService } from '../services/encryption.service.js'
import { log } from '../functions/logger.js'
import { PrismaClient } from '@prisma/client'

/**
 * Database Encryption Migration Utility
 *
 * Migrates existing unencrypted sensitive data in the database to encrypted format
 * without double-encrypting data that is already encrypted.
 */
export class DbEncryptionMigrator {
    constructor() {
        this.prisma = new PrismaClient()
        this.encryptionMappings = [
            {
                model: 'journalEntry',
                sensitiveFields: ['content'],
                userIdField: 'userId'
            },
            {
                model: 'conversationHistory',
                sensitiveFields: ['content'],
                userIdField: 'userId'
            },
            {
                model: 'moodCheckIn',
                sensitiveFields: ['mood', 'note', 'activity'],
                userIdField: 'userId'
            },
            {
                model: 'crisisEvent',
                sensitiveFields: ['details'],
                userIdField: 'userId'
            },
            {
                model: 'ghostLetter',
                sensitiveFields: ['content'],
                userIdField: 'userId'
            },
            {
                model: 'gratitudeEntry',
                sensitiveFields: ['item'],
                userIdField: 'userId'
            },
            {
                model: 'copingPlan',
                sensitiveFields: ['plan'],
                userIdField: 'userId'
            },
            {
                model: 'report',
                sensitiveFields: ['message'],
                userIdField: 'userId'
            }
        ]
    }

    /**
     * Initialize the migrator
     * @returns {Promise<boolean>} Whether initialization was successful
     */
    async initialize() {
        // Initialize encryption service
        const initialized = await encryptionService.initialize()
        if (!initialized) {
            log('Failed to initialize encryption service for migration', 'error')
            return false
        }

        return true
    }

    /**
     * Check if a field needs encryption
     * @param {any} value - Field value to check
     * @returns {boolean} Whether the field needs encryption
     */
    needsEncryption(value) {
        // Skip null or undefined values
        if (value === null || value === undefined) {
            return false
        }

        // Only encrypt string values
        if (typeof value !== 'string') {
            return false
        }

        // Skip empty strings
        if (value.trim() === '') {
            return false
        }

        // Check if it's already encrypted
        return !encryptionService.isEncrypted(value)
    }

    /**
     * Process and encrypt a single record
     * @param {Object} record - Database record
     * @param {Array<string>} sensitiveFields - Fields that should be encrypted
     * @returns {Object} Updated record with encrypted fields
     */
    processRecord(record, sensitiveFields) {
        const updates = {}
        let needsUpdate = false

        for (const field of sensitiveFields) {
            if (record[field] !== undefined && this.needsEncryption(record[field])) {
                updates[field] = encryptionService.encrypt(record[field])
                needsUpdate = true
            }
        }

        return { needsUpdate, updates }
    }

    /**
     * Migrate a specific model
     * @param {string} modelName - Prisma model name
     * @param {Array<string>} sensitiveFields - Fields that should be encrypted
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Migration results
     */
    async migrateModel(modelName, sensitiveFields, options = {}) {
        const { batchSize = 100, dryRun = false } = options

        try {
            log(`Starting migration for ${modelName}...`, 'info')

            // Get total count for progress tracking
            const totalCount = await this.prisma[modelName].count()
            log(`Found ${totalCount} ${modelName} records to process`, 'info')

            let processedCount = 0
            let updatedCount = 0
            let currentBatch = 0
            let hasMore = true

            // Process in batches to avoid memory issues
            while (hasMore) {
                // Fetch a batch of records
                const records = await this.prisma[modelName].findMany({
                    skip: currentBatch * batchSize,
                    take: batchSize
                })

                if (records.length === 0) {
                    hasMore = false
                    break
                }

                // Process each record in the batch
                for (const record of records) {
                    const { needsUpdate, updates } = this.processRecord(record, sensitiveFields)

                    if (needsUpdate) {
                        if (!dryRun) {
                            // Update the record with encrypted fields
                            await this.prisma[modelName].update({
                                where: { id: record.id },
                                data: updates
                            })
                        }
                        updatedCount++
                    }

                    processedCount++
                }

                currentBatch++
                log(
                    `Processed ${processedCount}/${totalCount} records (${((processedCount / totalCount) * 100).toFixed(2)}%)`,
                    'info'
                )
            }

            return {
                model: modelName,
                totalRecords: totalCount,
                processedRecords: processedCount,
                encryptedRecords: updatedCount,
                dryRun
            }
        } catch (error) {
            log(`Error migrating ${modelName}: ${error.message}`, 'error')
            return {
                model: modelName,
                error: error.message,
                success: false
            }
        }
    }

    /**
     * Run the migration for all configured models
     * @param {Object} options - Migration options
     * @param {boolean} [options.dryRun=false] - Whether to perform a dry run without making changes
     * @param {number} [options.batchSize=100] - Number of records to process in each batch
     * @returns {Promise<Array<Object>>} Migration results for each model
     */
    async migrateAll(options = { dryRun: false, batchSize: 100 }) {
        const results = []

        // Initialize the encryption service
        const initialized = await this.initialize()
        if (!initialized) {
            return [{ error: 'Failed to initialize encryption service', success: false }]
        }

        // Process each model in sequence
        for (const mapping of this.encryptionMappings) {
            log(`Migrating ${mapping.model}...`, 'info')
            const result = await this.migrateModel(mapping.model, mapping.sensitiveFields, options)
            results.push(result)
        }

        return results
    }

    /**
     * Closes the database connection
     */
    async close() {
        await this.prisma.$disconnect()
    }
}
