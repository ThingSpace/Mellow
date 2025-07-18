/**
 * Support Configuration for Mellow Bot
 *
 * This file configures where support requests are routed and how they're handled.
 * Update these settings to match your support infrastructure.
 */

export const supportConfig = {
    // Main support server guild ID
    supportGuildId: process.env.SUPPORT_GUILD_ID || null,

    // Support channel ID where requests are sent
    supportChannelId: process.env.SUPPORT_CHANNEL_ID || null,

    // Support team role ID for notifications
    supportRoleId: process.env.SUPPORT_ROLE_ID || null,

    // Webhook URL for external support systems (optional)
    supportWebhookUrl: process.env.SUPPORT_WEBHOOK_URL || null,

    // Email settings for critical issues (optional)
    supportEmail: {
        enabled: process.env.SUPPORT_EMAIL_ENABLED === 'true',
        address: process.env.SUPPORT_EMAIL_ADDRESS || 'support@athing.space',
        smtpConfig: {
            host: process.env.SMTP_HOST || null,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER || null,
                pass: process.env.SMTP_PASS || null
            }
        }
    },

    // Support request settings
    settings: {
        // Automatically ping support role for critical issues
        pingOnCritical: true,

        // Auto-create threads for support requests
        createThreads: true,

        // Expected response times by severity (in minutes)
        responseTime: {
            critical: 120, // 2 hours
            high: 480, // 8 hours
            medium: 1440, // 24 hours
            low: 4320 // 3 days
        },

        // Maximum support requests per guild per day
        dailyLimit: 10,

        // Cooldown between requests from same user (in minutes)
        userCooldown: 60
    },

    // Support links and resources
    resources: {
        documentationUrl: 'https://mymellow.space/docs',
        supportServerInvite: 'https://discord.gg/C3ZuXPP7Hc',
        emailAddress: 'support@athing.space',
        statusPage: 'https://status.athing.space',
        troubleshootingGuide: 'https://mymellow.space/docs/troubleshooting',
        twitter: 'https://twitter.com/HeyItsMellow'
    }
}

/**
 * Validate support configuration
 * @returns {boolean} Whether the configuration is valid
 */
export function validateSupportConfig() {
    const errors = []

    if (!supportConfig.supportGuildId) {
        errors.push('SUPPORT_GUILD_ID environment variable is not set')
    }

    if (!supportConfig.supportChannelId) {
        errors.push('SUPPORT_CHANNEL_ID environment variable is not set')
    }

    if (supportConfig.supportEmail.enabled) {
        if (!supportConfig.supportEmail.smtpConfig.host) {
            errors.push('SMTP_HOST is required when email support is enabled')
        }
        if (!supportConfig.supportEmail.smtpConfig.auth.user) {
            errors.push('SMTP_USER is required when email support is enabled')
        }
        if (!supportConfig.supportEmail.smtpConfig.auth.pass) {
            errors.push('SMTP_PASS is required when email support is enabled')
        }
    }

    if (errors.length > 0) {
        console.warn('Support configuration warnings:')
        errors.forEach(error => console.warn(`  - ${error}`))
        return false
    }

    return true
}
