/**
 * Twitter/X Configuration for Mellow Bot
 *
 * This file configures Twitter/X integration settings and posting capabilities.
 * Update these settings to match your Twitter/X app credentials and preferences.
 */

export const twitterConfig = {
    // Twitter/X API credentials (required for posting)
    credentials: {
        apiKey: process.env.TWITTER_API_KEY || null,
        apiSecret: process.env.TWITTER_API_SECRET || null,
        accessToken: process.env.TWITTER_ACCESS_TOKEN || null,
        accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || null,
        bearerToken: process.env.TWITTER_BEARER_TOKEN || null
    },

    // Bot account username (for mentions and replies)
    botUsername: process.env.TWITTER_BOT_USERNAME || 'MellowMentalBot',

    // Posting settings
    posting: {
        // Enable/disable automatic posting
        enabled: process.env.TWITTER_POSTING_ENABLED === 'true',

        // Maximum characters per tweet (Twitter limit is 280)
        maxLength: 280,

        // Cooldown between posts (in minutes)
        postCooldown: parseInt(process.env.TWITTER_POST_COOLDOWN) || 60,

        // Maximum posts per day
        dailyLimit: parseInt(process.env.TWITTER_DAILY_LIMIT) || 10,

        // Hashtags to include in posts
        defaultHashtags: ['#MentalHealth', '#Wellness', '#SelfCare', '#Support', '#MentalHealthMatters'],

        // Whether to include hashtags in posts
        includeHashtags: process.env.TWITTER_INCLUDE_HASHTAGS !== 'false'
    },

    // Content types that can be posted
    contentTypes: {
        // Daily mental health tips
        dailyTips: {
            enabled: true,
            schedule: '09:00', // Time in HH:MM format (UTC)
            frequency: 'daily'
        },

        // Weekly progress updates
        weeklyUpdates: {
            enabled: true,
            schedule: 'monday 12:00', // Day and time
            frequency: 'weekly'
        },

        // Mental health awareness posts
        awarenessPost: {
            enabled: true,
            frequency: 'as-needed' // Manual or AI-triggered
        },

        // Crisis support resources
        crisisResources: {
            enabled: true,
            frequency: 'as-needed'
        },

        // Bot updates and announcements
        botUpdates: {
            enabled: true,
            frequency: 'manual' // Only manual posting
        }
    },

    // AI prompt settings for tweet generation
    aiPrompts: {
        dailyTip: {
            systemPrompt: `You are Mellow, a supportive mental health Discord bot. Generate a helpful, empathetic mental health tip for Twitter/X. 

Requirements:
- Keep it under 240 characters to leave room for hashtags
- Be supportive and encouraging
- Include actionable advice
- Use warm, friendly tone
- Avoid medical advice or diagnosis
- Focus on general wellness and coping strategies
- Make it accessible to everyone

Generate only the tweet text, no quotes or additional formatting.`,

            temperature: 0.7,
            maxTokens: 100
        },

        weeklyUpdate: {
            systemPrompt: `You are Mellow, a supportive mental health Discord bot. Generate a weekly update tweet about mental health awareness or community support.

Requirements:
- Keep it under 240 characters
- Share encouraging statistics, facts, or community highlights
- Be positive and hopeful
- Include a call to action or engagement
- Focus on community and support
- Make it inspiring

Generate only the tweet text, no quotes or additional formatting.`,

            temperature: 0.6,
            maxTokens: 100
        },

        awarenessPost: {
            systemPrompt: `You are Mellow, a supportive mental health Discord bot. Generate an educational mental health awareness tweet.

Requirements:
- Keep it under 240 characters
- Share important mental health information
- Be informative but not overwhelming
- Include hope and support
- Encourage seeking help when needed
- Be inclusive and accessible

Generate only the tweet text, no quotes or additional formatting.`,

            temperature: 0.5,
            maxTokens: 100
        }
    },

    // Monitoring and analytics
    monitoring: {
        // Track engagement metrics
        trackEngagement: true,

        // Log all posting activity
        logActivity: true,

        // Monitor for mentions and replies
        monitorMentions: process.env.TWITTER_MONITOR_MENTIONS === 'true',

        // Webhook for external analytics (optional)
        analyticsWebhook: process.env.TWITTER_ANALYTICS_WEBHOOK || null
    },

    // Rate limiting and safety
    rateLimiting: {
        // Posts per hour limit
        postsPerHour: 5,

        // Minimum time between posts (minutes)
        minInterval: 15,

        // Retry attempts for failed posts
        retryAttempts: 3,

        // Backoff multiplier for retries
        retryBackoff: 2
    },

    // Content filtering
    contentFiltering: {
        // Enable content moderation before posting
        moderateContent: true,

        // Block sensitive topics
        blockedTopics: ['suicide', 'self-harm', 'violence', 'political', 'controversial'],

        // Require manual approval for certain content
        requireApproval: process.env.TWITTER_REQUIRE_APPROVAL === 'true'
    }
}

/**
 * Validate Twitter configuration
 * @returns {Object} Validation result with status and issues
 */
export function validateTwitterConfig() {
    const issues = []
    const warnings = []

    // Check required credentials
    if (!twitterConfig.credentials.apiKey) {
        issues.push('TWITTER_API_KEY environment variable is required')
    }

    if (!twitterConfig.credentials.apiSecret) {
        issues.push('TWITTER_API_SECRET environment variable is required')
    }

    if (!twitterConfig.credentials.accessToken) {
        issues.push('TWITTER_ACCESS_TOKEN environment variable is required')
    }

    if (!twitterConfig.credentials.accessTokenSecret) {
        issues.push('TWITTER_ACCESS_TOKEN_SECRET environment variable is required')
    }

    // Check optional but recommended settings
    if (!twitterConfig.credentials.bearerToken) {
        warnings.push('TWITTER_BEARER_TOKEN not set - some features may be limited')
    }

    if (!twitterConfig.botUsername) {
        warnings.push('TWITTER_BOT_USERNAME not set - using default')
    }

    // Validate posting settings
    if (twitterConfig.posting.postCooldown < 5) {
        warnings.push('Post cooldown is very low - consider increasing to avoid rate limits')
    }

    if (twitterConfig.posting.dailyLimit > 50) {
        warnings.push('Daily limit is high - Twitter may flag excessive posting')
    }

    const isValid = issues.length === 0

    if (!isValid) {
        console.warn('Twitter configuration issues:')
        issues.forEach(issue => console.warn(`  - ${issue}`))
    }

    if (warnings.length > 0) {
        console.warn('Twitter configuration warnings:')
        warnings.forEach(warning => console.warn(`  - ${warning}`))
    }

    return {
        isValid,
        issues,
        warnings,
        enabled: twitterConfig.posting.enabled && isValid
    }
}

/**
 * Get Twitter API v2 configuration
 * @returns {Object} Twitter API v2 client configuration
 */
export function getTwitterClientConfig() {
    return {
        appKey: twitterConfig.credentials.apiKey,
        appSecret: twitterConfig.credentials.apiSecret,
        accessToken: twitterConfig.credentials.accessToken,
        accessSecret: twitterConfig.credentials.accessTokenSecret,
        bearerToken: twitterConfig.credentials.bearerToken
    }
}
