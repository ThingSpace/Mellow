import crypto from 'crypto'
import { log } from '../functions/logger.js'

export class EncryptionService {
    constructor() {
        this._algorithm = 'aes-256-gcm'
        this._keyLength = 32
        this._ivLength = 16
        this._tagLength = 16
        this._initialized = false

        this._saltList = (process.env.ENCRYPTION_SALT_LIST || 'mellow-encryption-salt')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)

        this._keys = []
        this._maxDecryptDepth = 5 // prevent infinite loops
    }

    async initialize() {
        if (this._initialized) return true
        const baseKey = process.env.ENCRYPTION_KEY

        if (!baseKey) {
            log('Encryption key not set. Skipping encryption service initialization.', 'warn')
            return false
        }

        try {
            this._keys = this._saltList.map(salt => {
                const derivedKey = crypto.pbkdf2Sync(baseKey, salt, 10000, this._keyLength, 'sha512')
                log(`Derived key for salt "${salt}"`, 'debug')
                return { salt, key: derivedKey }
            })

            this._initialized = true
            log(`Encryption service initialized with ${this._keys.length} salt(s).`, 'info')
            return true
        } catch (err) {
            log(`Encryption init failed: ${err.message}`, 'error')
            return false
        }
    }

    encrypt(text) {
        if (!this._initialized) return text
        if (text === null || text === undefined) return '[No content]'
        if (typeof text !== 'string') text = String(text)
        if (text.trim() === '') return '[Empty content]'

        try {
            const iv = crypto.randomBytes(this._ivLength)
            const key = this._keys[0]?.key
            const cipher = crypto.createCipheriv(this._algorithm, key, iv)

            let encrypted = cipher.update(text, 'utf8', 'base64')
            encrypted += cipher.final('base64')
            const authTag = cipher.getAuthTag()

            const payload = [
                iv.toString('base64'),
                this._tagLength.toString(),
                authTag.toString('base64'),
                encrypted
            ].join(':')

            return payload
        } catch (err) {
            log(`Encryption failed: ${err.message}`, 'error')
            return text
        }
    }

    decrypt(payload) {
        if (!this._initialized || typeof payload !== 'string') return payload
        return this._attemptLayeredDecryption(payload, 0)
    }

    _attemptLayeredDecryption(payload, depth) {
        if (depth > this._maxDecryptDepth) {
            log('Max decryption depth reached.', 'error')
            return '[Decryption depth limit reached]'
        }

        if (!this.isEncrypted(payload)) return payload

        for (const { salt, key } of this._keys) {
            try {
                const decrypted = this._tryDecryptOnce(payload, key)
                if (decrypted && this.isEncrypted(decrypted)) {
                    return this._attemptLayeredDecryption(decrypted, depth + 1)
                }
                if (decrypted !== null) {
                    log(`Decryption succeeded with salt "${salt}" at depth ${depth}`, 'debug')
                    return decrypted
                }
            } catch (err) {
                log(`Decryption failed with salt "${salt}" at depth ${depth}: ${err.message}`, 'debug')
            }
        }

        log('All salts failed to decrypt payload.', 'error')
        return '[This content could not be decrypted. Please contact support.]'
    }

    _tryDecryptOnce(payload, key) {
        const parts = payload.split(':')
        let iv,
            authTag,
            encryptedText,
            tagLength = this._tagLength

        if (parts.length === 4) {
            const [ivBase64, tagLenStr, authTagBase64, cipherText] = parts
            tagLength = parseInt(tagLenStr)
            if (isNaN(tagLength)) throw new Error('Invalid tag length')
            iv = Buffer.from(ivBase64, 'base64')
            authTag = Buffer.from(authTagBase64, 'base64')
            encryptedText = cipherText
        } else if (parts.length === 3) {
            const [ivBase64, authTagBase64, cipherText] = parts
            iv = Buffer.from(ivBase64, 'base64')
            authTag = Buffer.from(authTagBase64, 'base64')
            encryptedText = cipherText
            tagLength = authTag.length
        } else {
            throw new Error('Unsupported format')
        }

        if (iv.length !== 16 || (tagLength !== 16 && tagLength !== 12)) {
            throw new Error(`Unexpected IV/tag length: iv=${iv.length}, tag=${tagLength}`)
        }

        const decipher = crypto.createDecipheriv(this._algorithm, key, iv, {
            authTagLength: tagLength
        })
        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(encryptedText, 'base64', 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
    }

    isEncrypted(text) {
        if (!text || typeof text !== 'string') return false

        const parts = text.split(':')
        if (parts.length !== 3 && parts.length !== 4) return false

        try {
            const [ivBase64, maybeTagLen, authTagBase64, encryptedText] = parts

            if (parts.length === 4) {
                if (isNaN(parseInt(maybeTagLen))) return false
                Buffer.from(ivBase64, 'base64')
                Buffer.from(authTagBase64, 'base64')
                Buffer.from(encryptedText, 'base64')
                return true
            }

            if (parts.length === 3) {
                Buffer.from(ivBase64, 'base64')
                Buffer.from(maybeTagLen, 'base64')
                Buffer.from(authTagBase64, 'base64')
                return true
            }

            return false
        } catch {
            return false
        }
    }
}

export const encryptionService = new EncryptionService()
