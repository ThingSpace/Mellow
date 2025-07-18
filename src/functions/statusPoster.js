import axios from 'axios'
import { log } from './logger.js'

/**
 * Class for posting status updates to mymellow.space API
 */
export class StatusPoster {
    /**
     * Create a new StatusPoster instance
     * @param {Object} client - Discord client instance
     * @param {Object} options - Configuration options
     */
    constructor(client, options = {}) {
        this.client = client
        this.options = {
            apiUrl: options.apiUrl || 'https://mymellow.space/api/status',
            apiKey: options.apiKey || process.env.MELLOW_STATUS_API_KEY,
            enabled: options.enabled !== false && (options.enabled || process.env.STATUS_POSTING_ENABLED === 'true'),
            interval: options.interval || parseInt(process.env.STATUS_POSTING_INTERVAL) || 300000, // 5 minutes default
            retryCount: options.retryCount || 3,
            retryDelay: options.retryDelay || 30000, // 30 seconds
            verbose: options.verbose || process.env.STATUS_POSTING_VERBOSE === 'true',
            nonRetryableStatusCodes: options.nonRetryableStatusCodes || [400, 401, 403, 404, 422],
            useDbCounts: options.useDbCounts !== false // Use database counts by default
        }

        this.stats = {
            lastPosted: null,
            totalPosts: 0,
            failedPosts: 0,
            retries: 0
        }

        this.timer = null
        this.initialized = false
    }

    /**
     * Initialize the status poster and start automatic posting if enabled
     * @returns {Promise<boolean>} Whether initialization was successful
     */
    async initialize() {
        if (!this.options.apiKey) {
            log('StatusPoster: No API key provided, status posting disabled', 'warn')
            return false
        }

        if (!this.options.enabled) {
            log('StatusPoster: Status posting is disabled by configuration', 'info')
            return false
        }

        try {
            const testResult = await this.postStatus({ test: true, status: true })

            if (testResult.success) {
                log(`StatusPoster: Successfully connected to ${this.options.apiUrl}`, 'done')
                this.startAutoPoster()
                this.initialized = true
                return true
            } else {
                log(`StatusPoster: Failed to connect to API: ${testResult.error}`, 'error')
                return false
            }
        } catch (error) {
            log(`StatusPoster: Initialization error: ${error.message}`, 'error')
            return false
        }
    }

    /**
     * Start automatic status posting based on configured interval
     */
    startAutoPoster() {
        if (this.timer) {
            clearInterval(this.timer)
        }

        // Post immediately on start
        this.postCurrentStatus().catch(err => log(`StatusPoster: Initial post failed: ${err.message}`, 'error'))

        // Set up interval for regular posting
        this.timer = setInterval(async () => {
            try {
                await this.postCurrentStatus()
            } catch (error) {
                log(`StatusPoster: Auto post failed: ${error.message}`, 'error')
            }
        }, this.options.interval)

        log(`StatusPoster: Automatic posting started (every ${this.options.interval / 60000} minutes)`, 'info')
    }

    /**
     * Stop automatic status posting
     */
    stopAutoPoster() {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
            log('StatusPoster: Automatic posting stopped', 'info')
        }
    }

    /**
     * Get current bot status statistics
     * @returns {Object} Current bot status
     */
    async getCurrentStatus() {
        let shardCount = this.client.shard?.count || 1
        let guildCount, userCount

        if (this.options.useDbCounts && this.client.db) {
            try {
                // Get counts from database for more accurate statistics
                const [dbGuildCount, dbUserCount] = await Promise.all([
                    this.client.db.prisma.guild.count(),
                    this.client.db.prisma.user.count()
                ])

                guildCount = dbGuildCount
                userCount = dbUserCount

                if (this.options.verbose) {
                    log(
                        `StatusPoster: Fetched counts from database - Guilds: ${guildCount}, Users: ${userCount}`,
                        'info'
                    )
                }
            } catch (error) {
                log(`StatusPoster: Error getting DB counts: ${error.message}, falling back to cache`, 'warn')
                // Fall back to cache counts if database query fails
                guildCount = this.client.guilds.cache.size
                userCount = this.getUserCount()
            }
        } else {
            // Use cache counts if database option is disabled
            guildCount = this.client.guilds.cache.size
            userCount = this.getUserCount()
        }

        const version = this.getVersion()

        return {
            status: true,
            shardCount,
            guildCount,
            userCount,
            version,
            message: 'All systems operational',
            timestamp: new Date().toISOString()
        }
    }

    /**
     * Get total user count across all guilds
     * @returns {number} Total user count
     */
    getUserCount() {
        try {
            // This is an approximation since users might be in multiple guilds
            return this.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
        } catch (error) {
            log(`StatusPoster: Error getting user count: ${error.message}`, 'error')
            return 0
        }
    }

    /**
     * Get current bot version from package.json
     * @returns {string} Current version
     */
    getVersion() {
        try {
            // Try to get version from client if available
            if (this.client.github) {
                return 'v' + this.client.github.getCurrentVersion()
            }

            // Fall back to package version if set by client
            if (this.client.version) {
                return this.client.version
            }

            return 'v1.0.0' // Default fallback
        } catch (error) {
            log(`StatusPoster: Error getting version: ${error.message}`, 'warn')
            return 'unknown'
        }
    }

    /**
     * Post current bot status to the API
     * @returns {Promise<Object>} Result of the operation
     */
    async postCurrentStatus() {
        const statusData = await this.getCurrentStatus()
        return this.postStatus(statusData)
    }

    /**
     * Post status data to the API with retry logic
     * @param {Object} statusData - Status data to post
     * @param {number} retryAttempt - Current retry attempt (internal use)
     * @returns {Promise<Object>} Result of the operation
     */
    async postStatus(statusData, retryAttempt = 0) {
        try {
            if (!this.options.apiKey) {
                return { success: false, error: 'No API key configured' }
            }

            // Always include API key in the payload as required by the API docs
            const payload = {
                ...statusData,
                apiKey: this.options.apiKey
            }

            // Prepare headers
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': `MellowBot/${statusData.version || 'unknown'}`
            }

            if (this.options.verbose) {
                log(`StatusPoster: Posting status update to ${this.options.apiUrl}`, 'info')
            }

            const response = await axios.post(this.options.apiUrl, payload, {
                headers,
                timeout: 10000 // 10 second timeout
            })

            // Update stats
            this.stats.lastPosted = new Date()
            this.stats.totalPosts++

            if (this.options.verbose) {
                log(`StatusPoster: Status posted successfully (${response.status})`, 'done')
            }

            return {
                success: true,
                status: response.status,
                data: response.data
            }
        } catch (error) {
            this.stats.failedPosts++

            const statusCode = error.response?.status || 0
            const errorMessage = error.response
                ? `API Error: ${statusCode} - ${error.response.statusText}`
                : `Network Error: ${error.message}`

            log(`StatusPoster: Failed to post status: ${errorMessage}`, 'error')

            // Log additional error details if available
            if (error.response?.data) {
                const errorData =
                    typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data
                log(`StatusPoster: Error details: ${errorData}`, 'error')
            }

            // Check if the error is non-retryable
            const isNonRetryableError = statusCode > 0 && this.options.nonRetryableStatusCodes.includes(statusCode)

            // Implement retry logic only for retryable errors
            if (!isNonRetryableError && retryAttempt < this.options.retryCount) {
                this.stats.retries++
                const nextRetry = retryAttempt + 1
                const delay = this.options.retryDelay * Math.pow(2, retryAttempt) // Exponential backoff

                log(
                    `StatusPoster: Retrying in ${delay / 1000} seconds (attempt ${nextRetry}/${this.options.retryCount})`,
                    'warn'
                )

                return new Promise(resolve => {
                    setTimeout(async () => {
                        const retryResult = await this.postStatus(statusData, nextRetry)
                        resolve(retryResult)
                    }, delay)
                })
            }

            // Add more specific error messaging for non-retryable errors
            let errorDetails = errorMessage
            if (isNonRetryableError) {
                log(`StatusPoster: Not retrying - ${statusCode} indicates a client-side error`, 'warn')
                if (statusCode === 400) {
                    errorDetails += ' - Check your payload format and API key'
                } else if (statusCode === 401) {
                    errorDetails += ' - Invalid or missing API key'
                }
            }

            return {
                success: false,
                error: errorDetails,
                statusCode: statusCode,
                retryable: !isNonRetryableError,
                errorData: error.response?.data
            }
        }
    }

    /**
     * Get statistics about status posting
     * @returns {Object} Status posting statistics
     */
    getStats() {
        return {
            ...this.stats,
            enabled: this.options.enabled,
            initialized: this.initialized,
            apiUrl: this.options.apiUrl,
            hasApiKey: !!this.options.apiKey,
            interval: this.options.interval,
            autoPostActive: !!this.timer
        }
    }

    /**
     * Update configuration options
     * @param {Object} newOptions - New configuration options
     */
    updateOptions(newOptions) {
        this.options = {
            ...this.options,
            ...newOptions
        }

        // Restart auto-poster if running and interval changed
        if (this.timer && newOptions.interval) {
            this.stopAutoPoster()
            this.startAutoPoster()
        }
    }
}

/**
 * Create and initialize a status poster instance
 * @param {Object} client - Discord client
 * @param {Object} options - Configuration options
 * @returns {Promise<StatusPoster>} Initialized status poster
 */
export async function createStatusPoster(client, options = {}) {
    const poster = new StatusPoster(client, options)
    await poster.initialize()
    return poster
}

/**
 * Post a one-time status update without initializing the full system
 * @param {Object} client - Discord client
 * @param {string} apiKey - API key for authentication
 * @param {string} apiUrl - API endpoint URL
 * @returns {Promise<Object>} Result of the operation
 */
export async function postOneTimeStatus(
    client,
    apiKey = process.env.MELLOW_STATUS_API_KEY,
    apiUrl = 'https://mymellow.space/api/status'
) {
    const poster = new StatusPoster(client, {
        apiKey,
        apiUrl,
        enabled: true,
        verbose: true
    })

    const result = await poster.postCurrentStatus()
    return result
}
