import { encryptionService } from '../services/encryption.service.js'
import { log } from '../functions/logger.js'

/**
 * Database Encryption Helper
 *
 * Provides utilities to handle encryption and decryption of database fields
 */
export class DbEncryptionHelper {
    /**
     * Initialize the encryption helper
     * @returns {Promise<boolean>} Whether initialization was successful
     */
    static async initialize() {
        return await encryptionService.initialize()
    }

    /**
     * Encrypt sensitive fields in an object
     * @param {Object} data - Object containing data to be stored
     * @param {Array<string>} sensitiveFields - Array of field names to encrypt
     * @returns {Object} Object with sensitive fields encrypted
     */
    static encryptFields(data, sensitiveFields) {
        if (!data || typeof data !== 'object') return data

        const result = { ...data }

        for (const field of sensitiveFields) {
            // Skip fields that are already encrypted
            if (result[field] && typeof result[field] === 'string' && encryptionService.isEncrypted(result[field])) {
                log(`Field ${field} is already encrypted, skipping encryption`, 'debug')
                continue
            }

            // Set default value for null/undefined content
            if (result[field] === null || result[field] === undefined) {
                result[field] = '[No content]'
                continue
            }

            // Handle arrays (like conversation history)
            if (Array.isArray(result[field])) {
                result[field] = result[field].map(item => {
                    if (item === null || item === undefined) return '[No content]'

                    // Skip already encrypted items
                    if (typeof item === 'string' && encryptionService.isEncrypted(item)) {
                        return item
                    }

                    if (typeof item === 'string') {
                        return encryptionService.encrypt(item)
                    } else if (typeof item === 'object') {
                        // For objects in arrays, convert to string first
                        return encryptionService.encrypt(JSON.stringify(item))
                    }
                    return encryptionService.encrypt(String(item))
                })
            }
            // Handle objects
            else if (typeof result[field] === 'object') {
                result[field] = encryptionService.encrypt(JSON.stringify(result[field]))
            }
            // Handle strings
            else if (typeof result[field] === 'string') {
                result[field] = encryptionService.encrypt(result[field])
            }
            // Handle other types by converting to string
            else {
                result[field] = encryptionService.encrypt(String(result[field]))
            }
        }

        return result
    }

    /**
     * Decrypt sensitive fields in an object
     * @param {Object} data - Object containing data retrieved from database
     * @param {Array<string>} sensitiveFields - Array of field names to decrypt
     * @returns {Object} Object with sensitive fields decrypted
     */
    static decryptFields(data, sensitiveFields) {
        if (!data || typeof data !== 'object') return data

        const result = { ...data }

        for (const field of sensitiveFields) {
            if (result[field] !== undefined && result[field] !== null) {
                // Handle arrays (like conversation history)
                if (Array.isArray(result[field])) {
                    result[field] = result[field].map(item => {
                        // Only attempt to decrypt if it appears to be encrypted
                        if (typeof item === 'string' && encryptionService.isEncrypted(item)) {
                            const decrypted = encryptionService.decrypt(item)
                            // Try to parse JSON if it's a serialized object
                            try {
                                return JSON.parse(decrypted)
                            } catch {
                                return decrypted
                            }
                        }
                        return item
                    })
                }
                // Handle encrypted strings
                else if (typeof result[field] === 'string' && encryptionService.isEncrypted(result[field])) {
                    const decrypted = encryptionService.decrypt(result[field])
                    // Try to parse JSON if it's a serialized object
                    try {
                        result[field] = JSON.parse(decrypted)
                    } catch {
                        result[field] = decrypted
                    }
                }
            }
        }

        return result
    }

    /**
     * Process a database record or array of records with encryption/decryption
     * @param {Object|Array} data - Data to process
     * @param {Array<string>} sensitiveFields - Fields to encrypt/decrypt
     * @param {string} operation - 'encrypt' or 'decrypt'
     * @returns {Object|Array} Processed data
     */
    static processData(data, sensitiveFields, operation = 'decrypt') {
        if (!data) return data

        // Handle arrays of records
        if (Array.isArray(data)) {
            return data.map(item => this.processData(item, sensitiveFields, operation))
        }

        // Handle single record
        if (operation === 'encrypt') {
            return this.encryptFields(data, sensitiveFields)
        } else {
            return this.decryptFields(data, sensitiveFields)
        }
    }
}
