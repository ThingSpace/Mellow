import crypto from 'crypto'
import { log } from '../functions/logger.js'

/**
 * Encryption Service
 *
 * Provides encryption and decryption for sensitive data stored in the database
 * Uses AES-256-GCM encryption with a master key derived from environment variables
 */
export class EncryptionService {
    constructor() {
        this._initialized = false
        this._algorithm = 'aes-256-gcm'
        this._keyLength = 32 // 256 bits
        this._ivLength = 16 // 128 bits
        this._tagLength = 16 // 128 bits
        this._salt = process.env.ENCRYPTION_SALT || 'mellow-encryption-salt'
        this._masterKey = null
    }

    /**
     * Initialize the encryption service
     * @returns {Promise<boolean>} Whether initialization was successful
     */
    async initialize() {
        if (this._initialized) return true

        try {
            const encryptionKey = process.env.ENCRYPTION_KEY

            if (!encryptionKey) {
                log('No encryption key provided. Encryption service not initialized.', 'warn')
                return false
            }

            // Derive a 256-bit key from the encryption key
            this._masterKey = crypto.pbkdf2Sync(encryptionKey, this._salt, 10000, this._keyLength, 'sha512')

            this._initialized = true
            log('Encryption service initialized successfully.', 'info')
            return true
        } catch (error) {
            log(`Failed to initialize encryption service: ${error.message}`, 'error')
            return false
        }
    }

    /**
     * Encrypt a string
     * @param {string} text - Text to encrypt
     * @returns {string|null} Encrypted text as base64 string or null if encryption failed
     */
    encrypt(text) {
        if (!this._initialized) return text

        // Handle null or undefined values
        if (text === null || text === undefined) {
            return '[No content]' // Return a placeholder instead of null
        }

        // Convert non-string values to string
        if (typeof text !== 'string') {
            text = String(text)
        }

        // Don't encrypt empty strings
        if (text.trim() === '') {
            return '[Empty content]'
        }

        try {
            // Generate a random initialization vector
            const iv = crypto.randomBytes(this._ivLength)

            // Create cipher
            const cipher = crypto.createCipheriv(this._algorithm, this._masterKey, iv)

            // Encrypt the text
            let encrypted = cipher.update(text, 'utf8', 'base64')
            encrypted += cipher.final('base64')

            // Get the authentication tag
            const authTag = cipher.getAuthTag()

            // Combine IV, encrypted text, and auth tag into a single string
            // Format: base64(iv):base64(authTag):base64(encryptedText)
            const result = `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`

            return result
        } catch (error) {
            log(`Encryption error: ${error.message}`, 'error')
            return text // Return original text instead of null on error
        }
    }

    /**
     * Decrypt an encrypted string
     * @param {string} encrypted - Encrypted text
     * @returns {string|null} Decrypted text or null if decryption failed
     */
    decrypt(encrypted) {
        if (!this._initialized) return encrypted

        // Handle null or undefined values
        if (encrypted === null || encrypted === undefined) {
            return '[No content]'
        }

        // Check if it's an encrypted string
        if (!this.isEncrypted(encrypted)) {
            return encrypted
        }

        try {
            // Split the encrypted string into its components
            const [ivBase64, authTagBase64, encryptedText] = encrypted.split(':')

            if (!ivBase64 || !authTagBase64 || !encryptedText) {
                throw new Error('Invalid encrypted format')
            }

            // Convert components from base64
            const iv = Buffer.from(ivBase64, 'base64')
            const authTag = Buffer.from(authTagBase64, 'base64')

            // Create decipher
            const decipher = crypto.createDecipheriv(this._algorithm, this._masterKey, iv)
            decipher.setAuthTag(authTag)

            // Decrypt the text
            let decrypted = decipher.update(encryptedText, 'base64', 'utf8')
            decrypted += decipher.final('utf8')

            return decrypted
        } catch (error) {
            log(`Decryption error: ${error.message}`, 'error')
            return encrypted // Return original text instead of null on error
        }
    }

    /**
     * Check if a string is encrypted
     * @param {string} text - Text to check
     * @returns {boolean} Whether the text appears to be encrypted
     */
    isEncrypted(text) {
        if (!text || typeof text !== 'string') return false

        // Check if the string matches our encryption format
        // Format: base64(iv):base64(authTag):base64(encryptedText)
        const parts = text.split(':')
        if (parts.length !== 3) return false

        // Try to decode the base64 parts
        try {
            Buffer.from(parts[0], 'base64')
            Buffer.from(parts[1], 'base64')
            Buffer.from(parts[2], 'base64')
            return true
        } catch {
            return false
        }
    }
}

// Export singleton instance
export const encryptionService = new EncryptionService()
