import { supportConfig, validateSupportConfig } from '../configs/support.config.js'
import { log } from '../functions/logger.js'

/**
 * Support Service for handling guild support requests
 * Routes requests to appropriate support channels and systems
 */
export class SupportService {
    constructor(client) {
        this.client = client
        this.config = supportConfig
        this.initialized = false
        this.supportChannel = null
        this.supportGuild = null
    }

    /**
     * Initialize the support service
     */
    async initialize() {
        try {
            if (!validateSupportConfig()) {
                log('Support service disabled due to configuration issues', 'warn')
                return false
            }

            // Get support guild and channel
            if (this.config.supportGuildId) {
                this.supportGuild = await this.client.guilds.fetch(this.config.supportGuildId).catch(() => null)

                if (this.supportGuild && this.config.supportChannelId) {
                    this.supportChannel = await this.supportGuild.channels
                        .fetch(this.config.supportChannelId)
                        .catch(() => null)
                }
            }

            this.initialized = true
            log(`Support service initialized - Channel: ${this.supportChannel ? 'Connected' : 'Not Found'}`, 'info')
            return true
        } catch (error) {
            console.error('Failed to initialize support service:', error)
            return false
        }
    }

    /**
     * Submit a support request from a guild
     *
     * @param {Object} request - Support request data
     * @param {string} request.guildId - Guild ID
     * @param {string} request.guildName - Guild name
     * @param {string} request.userId - User ID
     * @param {string} request.username - Username
     * @param {string} request.severity - Request severity (critical, high, medium, low)
     * @param {string} request.issue - Issue description
     * @param {string} request.contact - Contact information
     * @param {boolean} request.hasAdminPerms - Whether user has admin permissions
     * @param {Object} request.guildInfo - Additional guild information
     * @returns {Promise<Object>} Result of the submission
     */
    async submitRequest(request) {
        if (!this.initialized) {
            return { success: false, error: 'Support service not initialized' }
        }

        try {
            // Check rate limits
            const rateLimitCheck = await this.checkRateLimit(request.guildId, request.userId)
            if (!rateLimitCheck.allowed) {
                return { success: false, error: rateLimitCheck.reason }
            }

            // Create support request embed
            const requestEmbed = this.createSupportEmbed(request)

            let messageLink = null
            let threadId = null

            // Send to support channel if available
            if (this.supportChannel) {
                const message = await this.supportChannel.send({
                    content: this.shouldPingSupport(request.severity) ? `<@&${this.config.supportRoleId}>` : undefined,
                    embeds: [requestEmbed]
                })

                messageLink = `https://discord.com/channels/${this.supportGuild.id}/${this.supportChannel.id}/${message.id}`

                // Create thread for the request if enabled
                if (this.config.settings.createThreads && this.supportChannel.isTextBased()) {
                    try {
                        const thread = await message.startThread({
                            name: `Support: ${request.guildName} - ${request.severity.toUpperCase()}`,
                            autoArchiveDuration: 1440 // 24 hours
                        })
                        threadId = thread.id

                        // Add some context to the thread
                        await thread.send({
                            content: [
                                `**Guild Support Request**`,
                                `**Guild:** ${request.guildName} (\`${request.guildId}\`)`,
                                `**Requester:** ${request.username} (\`${request.userId}\`)`,
                                `**Contact:** ${request.contact}`,
                                `**Admin Permissions:** ${request.hasAdminPerms ? 'Yes' : 'No'}`,
                                '',
                                '**Quick Actions:**',
                                `• Check guild logs: \`/guilddebug logs guild:${request.guildId}\``,
                                `• View guild settings: \`/guilddebug settings guild:${request.guildId}\``,
                                `• Debug guild: \`/guilddebug diagnostics guild:${request.guildId}\``
                            ].join('\n')
                        })
                    } catch (error) {
                        console.error('Failed to create support thread:', error)
                    }
                }
            }

            // Send to webhook if configured
            if (this.config.supportWebhookUrl) {
                await this.sendToWebhook(request, requestEmbed).catch(console.error)
            }

            // Send email for critical issues if enabled
            if (request.severity === 'critical' && this.config.supportEmail.enabled) {
                await this.sendEmailAlert(request).catch(console.error)
            }

            // Log the request in database
            await this.logSupportRequest(request, messageLink, threadId)

            // Update rate limits
            await this.updateRateLimit(request.guildId, request.userId)

            return {
                success: true,
                messageLink,
                threadId,
                expectedResponseTime: this.config.settings.responseTime[request.severity] || 4320,
                requestId: request.guildId + '-' + Date.now()
            }
        } catch (error) {
            console.error('Failed to submit support request:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Create support request embed
     */
    createSupportEmbed(request) {
        const severityEmoji = {
            critical: '🔴',
            high: '🟡',
            medium: '🟢',
            low: '🔵'
        }

        const severityColors = {
            critical: this.client.colors.error,
            high: this.client.colors.warning,
            medium: this.client.colors.secondary,
            low: this.client.colors.primary
        }

        return new this.client.Gateway.EmbedBuilder()
            .setTitle(`🎫 Guild Support Request - ${request.severity.toUpperCase()}`)
            .setColor(severityColors[request.severity] || this.client.colors.primary)
            .setDescription(`**${severityEmoji[request.severity]} ${request.severity.toUpperCase()} Priority Request**`)
            .addFields(
                {
                    name: '🏠 Guild Information',
                    value: [
                        `**Name:** ${request.guildName}`,
                        `**ID:** \`${request.guildId}\``,
                        `**Members:** ${request.guildInfo?.memberCount?.toLocaleString() || 'Unknown'}`,
                        `**Owner:** <@${request.guildInfo?.ownerId || 'Unknown'}>`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '👤 Requester Details',
                    value: [
                        `**User:** ${request.username} (<@${request.userId}>)`,
                        `**ID:** \`${request.userId}\``,
                        `**Admin Perms:** ${request.hasAdminPerms ? '✅ Yes' : '❌ No'}`,
                        `**Contact:** ${request.contact}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📝 Issue Description',
                    value: request.issue.length > 1000 ? request.issue.substring(0, 997) + '...' : request.issue,
                    inline: false
                },
                {
                    name: '⏱️ Response Time Target',
                    value: this.formatResponseTime(this.config.settings.responseTime[request.severity] || 4320),
                    inline: true
                },
                {
                    name: '🔗 Quick Links',
                    value: [
                        `[Documentation](${this.config.resources.documentationUrl})`,
                        `[Support Server](${this.config.resources.supportServerInvite})`,
                        `[Troubleshooting](${this.config.resources.troubleshootingGuide})`
                    ].join(' • '),
                    inline: true
                }
            )
            .setFooter({
                text: 'Request ID: ' + request.guildId + '-' + Date.now() + ' • ' + this.client.footer,
                iconURL: this.client.logo
            })
            .setTimestamp()
    }

    /**
     * Check if we should ping support team
     */
    shouldPingSupport(severity) {
        return severity === 'critical' && this.config.settings.pingOnCritical && this.config.supportRoleId
    }

    /**
     * Format response time in human readable format
     */
    formatResponseTime(minutes) {
        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`
        } else if (minutes < 1440) {
            const hours = Math.floor(minutes / 60)
            return `${hours} hour${hours !== 1 ? 's' : ''}`
        } else {
            const days = Math.floor(minutes / 1440)
            return `${days} day${days !== 1 ? 's' : ''}`
        }
    }

    /**
     * Check rate limits for support requests
     */
    async checkRateLimit(guildId, userId) {
        // Implementation depends on your rate limiting strategy
        // For now, return allowed
        return { allowed: true }
    }

    /**
     * Update rate limits after successful request
     */
    async updateRateLimit(guildId, userId) {
        // Implementation depends on your rate limiting strategy
        // Log the request for rate limiting purposes
    }

    /**
     * Send request to external webhook
     */
    async sendToWebhook(request, embed) {
        if (!this.config.supportWebhookUrl) return

        const response = await fetch(this.config.supportWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [embed.toJSON()],
                content: `New ${request.severity} support request from ${request.guildName}`
            })
        })

        if (!response.ok) {
            throw new Error(`Webhook failed: ${response.status}`)
        }
    }

    /**
     * Send email alert for critical issues
     */
    async sendEmailAlert(request) {
        if (!this.config.supportEmail.enabled) return

        // Email implementation would go here
        // You can use nodemailer or your preferred email service
        log(`Email alert would be sent for critical request from ${request.guildName}`, 'info')
    }

    /**
     * Log support request to database
     */
    async logSupportRequest(request, messageLink, threadId) {
        try {
            // You can extend this to store support requests in database
            if (this.client.systemLogger) {
                await this.client.systemLogger.logSupportRequest(
                    request.guildId,
                    request.guildName,
                    request.userId,
                    request.username,
                    request.severity,
                    request.issue,
                    request.contact,
                    request.hasAdminPerms
                )
            }
        } catch (error) {
            console.error('Failed to log support request:', error)
        }
    }
}

/**
 * Create and export support service instance
 */
export const createSupportService = client => {
    return new SupportService(client)
}
