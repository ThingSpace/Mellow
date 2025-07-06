import { TwitterApi } from 'twitter-api-v2'
import { twitterConfig, validateTwitterConfig, getTwitterClientConfig } from '../configs/twitter.config.js'
import { log } from '../functions/logger.js'

/**
 * Twitter/X Service for Mellow Bot
 * Handles posting mental health content and updates to Twitter/X
 */
export class TwitterService {
    constructor(client) {
        this.client = client
        this.config = twitterConfig
        this.twitterClient = null
        this.initialized = false

        // Post tracking
        this.postHistory = new Map() // Track recent posts for rate limiting
        this.dailyPostCount = 0
        this.lastResetDate = new Date().toDateString()

        // Scheduled posting
        this.scheduledIntervals = new Map()
    }

    /**
     * Initialize the Twitter service
     */
    async initialize() {
        try {
            const validation = validateTwitterConfig()

            if (!validation.isValid) {
                const message = 'Twitter service disabled due to configuration issues'
                if (this.client.systemLogger) {
                    await this.client.systemLogger.logError('twitter_service', 'initialization_failed', message, {
                        issues: validation.issues,
                        warnings: validation.warnings
                    })
                } else {
                    log(message, 'warn')
                }
                return false
            }

            if (!validation.enabled) {
                const message = 'Twitter service disabled in configuration'
                if (this.client.systemLogger) {
                    await this.client.systemLogger.logInfo('twitter_service', 'service_disabled', message)
                } else {
                    log(message, 'info')
                }
                return false
            }

            // Initialize Twitter client
            const clientConfig = getTwitterClientConfig()
            this.twitterClient = new TwitterApi(clientConfig)

            // Test the connection
            const connectionTest = await this.testConnection()
            if (!connectionTest.success) {
                const message = `Twitter service failed connection test: ${connectionTest.error}`
                if (this.client.systemLogger) {
                    await this.client.systemLogger.logError('twitter_service', 'connection_test_failed', message, {
                        error: connectionTest.originalError,
                        statusCode: connectionTest.statusCode,
                        suggestions:
                            connectionTest.statusCode === 403
                                ? [
                                      'Check Twitter API credentials in environment variables',
                                      'Verify Twitter Developer Portal app permissions',
                                      'Ensure API v2 write access is enabled'
                                  ]
                                : []
                    })
                } else {
                    log(message, 'error')
                }
                return false
            }

            // Reset daily post count if it's a new day
            this.resetDailyCountIfNeeded()

            // Start scheduled posting if enabled
            this.startScheduledPosting()

            this.initialized = true

            const successMessage = `Twitter service initialized successfully - Connected as @${connectionTest.username}`
            if (this.client.systemLogger) {
                await this.client.systemLogger.logInfo('twitter_service', 'service_initialized', successMessage, {
                    username: connectionTest.username,
                    userId: connectionTest.userId,
                    features: Object.keys(this.config.contentTypes).filter(
                        type => this.config.contentTypes[type].enabled
                    )
                })
            } else {
                log(successMessage, 'done')
            }

            // Log initialization activity
            await this.logActivity('service_initialized', 'Twitter service started successfully', {
                username: connectionTest.username,
                features: Object.keys(this.config.contentTypes).filter(type => this.config.contentTypes[type].enabled)
            })

            return true
        } catch (error) {
            const message = `Failed to initialize Twitter service: ${error.message}`
            if (this.client.systemLogger) {
                await this.client.systemLogger.logError('twitter_service', 'initialization_error', message, {
                    error: error.message,
                    stack: error.stack
                })
            } else {
                log(message, 'error')
            }
            return false
        }
    }

    /**
     * Test Twitter API connection
     */
    async testConnection() {
        try {
            const user = await this.twitterClient.v2.me()
            return {
                success: true,
                username: user.data.username,
                userId: user.data.id
            }
        } catch (error) {
            let errorMessage = error.message

            // Provide specific guidance for common connection issues
            if (error.code === 403 || error.status === 403) {
                errorMessage = 'Twitter API access forbidden (403). Check API credentials and permissions.'
            } else if (error.code === 401 || error.status === 401) {
                errorMessage = 'Twitter API authentication failed (401). Verify API key and tokens.'
            } else if (error.code === 429 || error.status === 429) {
                errorMessage = 'Twitter API rate limit exceeded (429). Wait before retrying.'
            }

            return {
                success: false,
                error: errorMessage,
                originalError: error.message,
                statusCode: error.code || error.status
            }
        }
    }

    /**
     * Post a tweet with content moderation and rate limiting
     */
    async postTweet(content, options = {}) {
        if (!this.initialized) {
            return { success: false, error: 'Twitter service not initialized' }
        }

        try {
            // Check rate limits
            const rateLimitCheck = this.checkRateLimit()
            if (!rateLimitCheck.allowed) {
                return { success: false, error: rateLimitCheck.reason }
            }

            // Moderate content if enabled
            if (this.config.contentFiltering.moderateContent) {
                const moderationResult = await this.moderateContent(content)
                if (!moderationResult.approved) {
                    return { success: false, error: `Content blocked: ${moderationResult.reason}` }
                }
            }

            // Format content with hashtags if enabled
            const formattedContent = this.formatTweetContent(content, options)

            // Post the tweet
            const response = await this.twitterClient.v2.tweet(formattedContent)

            // Track the post
            this.trackPost(content, response.data.id)

            // Log the activity
            await this.logActivity('tweet_posted', content, {
                tweetId: response.data.id,
                length: formattedContent.length,
                type: options.type || 'manual'
            })

            log(`Posted tweet: ${content.substring(0, 50)}...`, 'info')

            return {
                success: true,
                tweetId: response.data.id,
                url: `https://twitter.com/${this.config.botUsername}/status/${response.data.id}`,
                content: formattedContent
            }
        } catch (error) {
            // Enhanced error handling for specific HTTP codes
            let errorMessage = error.message
            let errorDetails = {
                error: error.message,
                type: options.type || 'manual',
                content: content.substring(0, 100)
            }

            // Handle specific error codes
            if (error.code === 403 || error.status === 403) {
                errorMessage =
                    'Twitter API access forbidden (403). This usually indicates:' +
                    '\n  - Invalid or expired API credentials' +
                    '\n  - Insufficient API permissions (need Twitter API v2 write access)' +
                    '\n  - Account may be suspended or restricted' +
                    '\n  - Twitter app may need approval for posting' +
                    '\n  - Check your Twitter Developer Portal settings'

                errorDetails.errorType = 'authentication_failed'
                errorDetails.httpCode = 403
                errorDetails.suggestions = [
                    'Verify Twitter API credentials in environment variables',
                    'Check Twitter Developer Portal for app status',
                    'Ensure API v2 write permissions are enabled',
                    'Verify account is not suspended or restricted'
                ]
            } else if (error.code === 429 || error.status === 429) {
                errorMessage = 'Twitter API rate limit exceeded (429)'
                errorDetails.errorType = 'rate_limit'
                errorDetails.httpCode = 429
            } else if (error.code === 401 || error.status === 401) {
                errorMessage = 'Twitter API authentication failed (401) - check credentials'
                errorDetails.errorType = 'invalid_credentials'
                errorDetails.httpCode = 401
            }

            // Log with systemLogger if available, fallback to regular logger
            if (this.client.systemLogger) {
                await this.client.systemLogger.logError(
                    'twitter_service',
                    'tweet_posting_failed',
                    errorMessage,
                    errorDetails
                )
            } else {
                log(`Failed to post tweet: ${errorMessage}`, 'error')
            }

            await this.logActivity('tweet_failed', content, errorDetails)

            return { success: false, error: errorMessage, details: errorDetails }
        }
    }

    /**
     * Generate and post AI-powered content
     */
    async postAIContent(contentType, options = {}) {
        if (!this.client.ai || !this.client.ai.isConnected()) {
            return { success: false, error: 'AI service not available' }
        }

        try {
            // Use the AI service's Twitter content generation method
            const content = await this.client.ai.generateTwitterContent({
                type: contentType,
                maxLength: this.config.posting.maxLength - 50, // Leave room for hashtags
                ...options
            })

            if (!content || !content.trim()) {
                return { success: false, error: 'AI generated empty response' }
            }

            // Post the tweet
            const result = await this.postTweet(content, {
                type: contentType,
                aiGenerated: true,
                ...options
            })

            if (result.success) {
                log(`Posted AI-generated ${contentType}: ${content.substring(0, 50)}...`, 'info')
            }

            return result
        } catch (error) {
            log(`Failed to generate/post AI content: ${error.message}`, 'error')
            return { success: false, error: error.message }
        }
    }

    /**
     * Post daily mental health tip
     */
    async postDailyTip() {
        if (!this.config.contentTypes.dailyTips.enabled) {
            return { success: false, error: 'Daily tips disabled' }
        }

        return await this.postAIContent('dailyTip')
    }

    /**
     * Post weekly update
     */
    async postWeeklyUpdate() {
        if (!this.config.contentTypes.weeklyUpdates.enabled) {
            return { success: false, error: 'Weekly updates disabled' }
        }

        return await this.postAIContent('weeklyUpdate')
    }

    /**
     * Post mental health awareness content
     */
    async postAwarenessContent() {
        if (!this.config.contentTypes.awarenessPost.enabled) {
            return { success: false, error: 'Awareness posts disabled' }
        }

        return await this.postAIContent('awarenessPost')
    }

    /**
     * Post bot update or announcement
     */
    async postBotUpdate(content) {
        if (!this.config.contentTypes.botUpdates.enabled) {
            return { success: false, error: 'Bot updates disabled' }
        }

        return await this.postTweet(content, { type: 'botUpdate' })
    }

    /**
     * Format tweet content with hashtags and length checks
     */
    formatTweetContent(content, options = {}) {
        let formattedContent = content.trim()

        // Add hashtags if enabled and not already present
        if (this.config.posting.includeHashtags && !options.skipHashtags) {
            const hashtags = options.hashtags || this.config.posting.defaultHashtags.slice(0, 3)
            const hashtagString = hashtags.join(' ')

            // Check if adding hashtags would exceed limit
            const totalLength = formattedContent.length + hashtagString.length + 2 // +2 for spaces

            if (totalLength <= this.config.posting.maxLength) {
                formattedContent += `\n\n${hashtagString}`
            }
        }

        // Truncate if too long
        if (formattedContent.length > this.config.posting.maxLength) {
            const maxContentLength = this.config.posting.maxLength - 3 // -3 for "..."
            formattedContent = formattedContent.substring(0, maxContentLength) + '...'
        }

        return formattedContent
    }

    /**
     * Clean AI response for Twitter posting
     */
    cleanAIResponse(response) {
        return response
            .trim()
            .replace(/^["']|["']$/g, '') // Remove quotes
            .replace(/^\w+:\s*/, '') // Remove "Tweet:" or similar prefixes
            .replace(/\n{2,}/g, '\n') // Collapse multiple newlines
            .trim()
    }

    /**
     * Moderate content before posting
     */
    async moderateContent(content) {
        try {
            // Check for blocked topics
            const blockedTopics = this.config.contentFiltering.blockedTopics
            const lowerContent = content.toLowerCase()

            for (const topic of blockedTopics) {
                if (lowerContent.includes(topic.toLowerCase())) {
                    return {
                        approved: false,
                        reason: `Contains blocked topic: ${topic}`
                    }
                }
            }

            // Use AI moderation if available
            if (this.client.ai) {
                // This would integrate with your existing moderation tools
                // For now, return approved
                return { approved: true }
            }

            return { approved: true }
        } catch (error) {
            log(`Content moderation error: ${error.message}`, 'error')
            return {
                approved: false,
                reason: 'Moderation check failed'
            }
        }
    }

    /**
     * Check rate limits for posting
     */
    checkRateLimit() {
        const now = Date.now()

        // Reset daily count if needed
        this.resetDailyCountIfNeeded()

        // Check daily limit
        if (this.dailyPostCount >= this.config.posting.dailyLimit) {
            return {
                allowed: false,
                reason: 'Daily posting limit reached'
            }
        }

        // Check cooldown period
        const recentPosts = Array.from(this.postHistory.values()).filter(
            post => now - post.timestamp < this.config.posting.postCooldown * 60 * 1000
        )

        if (recentPosts.length > 0) {
            const lastPost = recentPosts[recentPosts.length - 1]
            const timeRemaining = Math.ceil(
                (this.config.posting.postCooldown * 60 * 1000 - (now - lastPost.timestamp)) / 60000
            )

            return {
                allowed: false,
                reason: `Cooldown active. ${timeRemaining} minutes remaining.`
            }
        }

        // Check hourly rate limit
        const hourlyPosts = recentPosts.filter(post => now - post.timestamp < 60 * 60 * 1000)
        if (hourlyPosts.length >= this.config.rateLimiting.postsPerHour) {
            return {
                allowed: false,
                reason: 'Hourly rate limit reached'
            }
        }

        return { allowed: true }
    }

    /**
     * Track a posted tweet
     */
    trackPost(content, tweetId) {
        const postData = {
            content,
            tweetId,
            timestamp: Date.now()
        }

        this.postHistory.set(tweetId, postData)
        this.dailyPostCount++

        // Clean up old posts (keep last 100)
        if (this.postHistory.size > 100) {
            const oldestKey = this.postHistory.keys().next().value
            this.postHistory.delete(oldestKey)
        }
    }

    /**
     * Reset daily post count if it's a new day
     */
    resetDailyCountIfNeeded() {
        const today = new Date().toDateString()
        if (today !== this.lastResetDate) {
            this.dailyPostCount = 0
            this.lastResetDate = today
            log('Daily Twitter post count reset', 'info')
        }
    }

    /**
     * Start scheduled posting based on configuration
     */
    startScheduledPosting() {
        // Daily tips
        if (this.config.contentTypes.dailyTips.enabled) {
            this.scheduleDaily('dailyTips', this.config.contentTypes.dailyTips.schedule, () => {
                this.postDailyTip()
            })
        }

        // Weekly updates
        if (this.config.contentTypes.weeklyUpdates.enabled) {
            this.scheduleWeekly('weeklyUpdates', this.config.contentTypes.weeklyUpdates.schedule, () => {
                this.postWeeklyUpdate()
            })
        }

        log('Scheduled Twitter posting started', 'info')
    }

    /**
     * Schedule daily posting
     */
    scheduleDaily(name, timeString, callback) {
        const [hours, minutes] = timeString.split(':').map(Number)

        const scheduleNext = () => {
            const now = new Date()
            const target = new Date()
            target.setUTCHours(hours, minutes, 0, 0)

            // If time has passed today, schedule for tomorrow
            if (target <= now) {
                target.setUTCDate(target.getUTCDate() + 1)
            }

            const delay = target.getTime() - now.getTime()

            const timeoutId = setTimeout(() => {
                callback()
                scheduleNext() // Schedule next occurrence
            }, delay)

            this.scheduledIntervals.set(name, timeoutId)
            log(`Scheduled ${name} for ${target.toISOString()}`, 'info')
        }

        scheduleNext()
    }

    /**
     * Schedule weekly posting
     */
    scheduleWeekly(name, scheduleString, callback) {
        const [day, time] = scheduleString.split(' ')
        const [hours, minutes] = time.split(':').map(Number)

        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const targetDay = dayNames.indexOf(day.toLowerCase())

        if (targetDay === -1) {
            log(`Invalid day for weekly schedule: ${day}`, 'error')
            return
        }

        const scheduleNext = () => {
            const now = new Date()
            const target = new Date()

            // Find next occurrence of the target day
            const daysUntilTarget = (targetDay - now.getUTCDay() + 7) % 7
            target.setUTCDate(now.getUTCDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget))
            target.setUTCHours(hours, minutes, 0, 0)

            // If it's the same day but time has passed, schedule for next week
            if (daysUntilTarget === 0 && target <= now) {
                target.setUTCDate(target.getUTCDate() + 7)
            }

            const delay = target.getTime() - now.getTime()

            const timeoutId = setTimeout(() => {
                callback()
                scheduleNext() // Schedule next occurrence
            }, delay)

            this.scheduledIntervals.set(name, timeoutId)
            log(`Scheduled ${name} for ${target.toISOString()}`, 'info')
        }

        scheduleNext()
    }

    /**
     * Stop scheduled posting
     */
    stopScheduledPosting() {
        for (const [name, timeoutId] of this.scheduledIntervals) {
            clearTimeout(timeoutId)
            log(`Stopped scheduled posting for ${name}`, 'info')
        }
        this.scheduledIntervals.clear()
    }

    /**
     * Log Twitter activity
     */
    async logActivity(type, content, metadata = {}) {
        if (!this.config.monitoring.logActivity) return

        try {
            if (this.client.systemLogger) {
                const embed = new this.client.Gateway.EmbedBuilder()
                    .setTitle(`🐦 Twitter Activity: ${type.replace('_', ' ').toUpperCase()}`)
                    .setDescription(content.length > 1000 ? content.substring(0, 997) + '...' : content)
                    .setColor(this.client.colors.primary)
                    .addFields({
                        name: 'Metadata',
                        value:
                            Object.entries(metadata)
                                .map(([key, value]) => `**${key}:** ${value}`)
                                .join('\n') || 'None',
                        inline: false
                    })
                    .setTimestamp()
                    .setFooter({ text: this.client.footer, iconURL: this.client.logo })

                await this.client.systemLogger.sendToChannels(embed, { logType: 'system' })
            }
        } catch (error) {
            log(`Failed to log Twitter activity: ${error.message}`, 'error')
        }
    }

    /**
     * Get service status and statistics
     */
    getStatus() {
        return {
            initialized: this.initialized,
            enabled: this.config.posting.enabled,
            dailyPostCount: this.dailyPostCount,
            dailyLimit: this.config.posting.dailyLimit,
            recentPosts: Array.from(this.postHistory.values()).slice(-5),
            scheduledTasks: Array.from(this.scheduledIntervals.keys()),
            rateLimitStatus: this.checkRateLimit()
        }
    }

    /**
     * Get comprehensive diagnostic information
     */
    async getDiagnostics() {
        const diagnostics = {
            service: {
                initialized: this.initialized,
                enabled: this.config.posting.enabled,
                hasCredentials: this.hasValidCredentials()
            },
            connection: {
                status: 'unknown',
                username: null,
                error: null,
                statusCode: null
            },
            configuration: {
                apiKey: !!this.config.credentials.apiKey,
                apiSecret: !!this.config.credentials.apiSecret,
                accessToken: !!this.config.credentials.accessToken,
                accessTokenSecret: !!this.config.credentials.accessTokenSecret,
                botUsername: this.config.botUsername
            },
            recommendations: []
        }

        // Test connection if service is initialized
        if (this.initialized && this.twitterClient) {
            try {
                const connectionTest = await this.testConnection()
                diagnostics.connection.status = connectionTest.success ? 'connected' : 'failed'
                diagnostics.connection.username = connectionTest.username
                diagnostics.connection.error = connectionTest.error
                diagnostics.connection.statusCode = connectionTest.statusCode
            } catch (error) {
                diagnostics.connection.status = 'error'
                diagnostics.connection.error = error.message
            }
        }

        // Generate recommendations based on diagnostics
        if (!diagnostics.service.initialized) {
            diagnostics.recommendations.push('Service not initialized - check API credentials')
        }

        if (!diagnostics.service.enabled) {
            diagnostics.recommendations.push('Posting disabled - set TWITTER_POSTING_ENABLED=true')
        }

        if (!diagnostics.configuration.apiKey || !diagnostics.configuration.apiSecret) {
            diagnostics.recommendations.push('Missing API credentials - set TWITTER_API_KEY and TWITTER_API_SECRET')
        }

        if (!diagnostics.configuration.accessToken || !diagnostics.configuration.accessTokenSecret) {
            diagnostics.recommendations.push(
                'Missing access tokens - set TWITTER_ACCESS_TOKEN and TWITTER_ACCESS_TOKEN_SECRET'
            )
        }

        if (diagnostics.connection.statusCode === 403) {
            diagnostics.recommendations.push('403 Forbidden - check API permissions in Twitter Developer Portal')
            diagnostics.recommendations.push('Ensure API v2 write access is enabled')
            diagnostics.recommendations.push('Verify account is not suspended or restricted')
        }

        if (diagnostics.connection.statusCode === 401) {
            diagnostics.recommendations.push('401 Unauthorized - verify API credentials are correct')
            diagnostics.recommendations.push('Consider regenerating access tokens')
        }

        if (diagnostics.connection.statusCode === 429) {
            diagnostics.recommendations.push('429 Rate Limit - wait before retrying')
            diagnostics.recommendations.push('Consider increasing post cooldown period')
        }

        return diagnostics
    }

    /**
     * Check if valid credentials are configured
     */
    hasValidCredentials() {
        return !!(
            this.config.credentials.apiKey &&
            this.config.credentials.apiSecret &&
            this.config.credentials.accessToken &&
            this.config.credentials.accessTokenSecret
        )
    }

    /**
     * Shutdown the service
     */
    shutdown() {
        this.stopScheduledPosting()
        this.initialized = false
        log('Twitter service shut down', 'info')
    }
}

/**
 * Create and export Twitter service instance
 */
export const createTwitterService = client => {
    return new TwitterService(client)
}
