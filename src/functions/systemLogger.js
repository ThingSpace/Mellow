import { log } from './logger.js'

/**
 * Centralized system logging utility for Mellow
 * Handles logging of system events, command usage, errors, etc.
 */
export class SystemLogger {
    constructor(client) {
        this.client = client
        this.enabled = false
        this.channels = new Map()
        // In-memory log storage
        this.logs = new Map() // guildId -> array of logs
        this.globalLogs = [] // for global logs (startup, etc.)
        this.maxLogsPerGuild = 100 // Keep last 100 logs per guild
        this.maxGlobalLogs = 200 // Keep last 200 global logs
    }

    /**
     * Initialize system logger - defer channel fetching until needed
     */
    async initialize() {
        try {
            // Mark as ready for lazy initialization
            this.enabled = true
            log('System logger initialized - channels will be loaded on demand', 'info')
        } catch (error) {
            console.error('Failed to initialize system logger:', error)
        }
    }

    /**
     * Log command usage
     */
    async logCommandUsage(interaction, commandName, category, success = true) {
        if (!this.enabled) return

        const embed = new this.client.Gateway.EmbedBuilder()
            .setTitle('📝 Command Usage')
            .setColor(success ? this.client.colors.primary : this.client.colors.error)
            .addFields(
                {
                    name: 'Command',
                    value: `\`/${commandName}\``,
                    inline: true
                },
                {
                    name: 'Category',
                    value: category,
                    inline: true
                },
                {
                    name: 'Status',
                    value: success ? '✅ Success' : '❌ Failed',
                    inline: true
                },
                {
                    name: 'User',
                    value: `<@${interaction.user.id}> (${interaction.user.tag})`,
                    inline: false
                },
                {
                    name: 'Guild',
                    value: interaction.guild ? `${interaction.guild.name} (${interaction.guild.id})` : 'DM',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: this.client.footer, iconURL: this.client.logo })

        // Log to database
        await this.logToDatabase(
            'command',
            'Command Usage',
            `/${commandName} command ${success ? 'executed successfully' : 'failed'}`,
            {
                guildId: interaction.guild?.id,
                userId: interaction.user.id,
                metadata: {
                    command: commandName,
                    category: category,
                    success: success,
                    guild: interaction.guild
                        ? {
                              id: interaction.guild.id,
                              name: interaction.guild.name
                          }
                        : null
                },
                severity: success ? 'info' : 'warning'
            }
        )

        await this.sendToChannels(embed, {
            logType: 'command',
            guildId: interaction.guild?.id
        })
    }

    /**
     * Log guild join/leave events
     */
    async logGuildEvent(guild, type) {
        if (!this.enabled) return

        const isJoin = type === 'join'
        const embed = new this.client.Gateway.EmbedBuilder()
            .setTitle(isJoin ? '🎉 Guild Joined' : '👋 Guild Left')
            .setColor(isJoin ? this.client.colors.success : this.client.colors.warning)
            .addFields(
                {
                    name: 'Guild Name',
                    value: guild.name,
                    inline: true
                },
                {
                    name: 'Guild ID',
                    value: guild.id,
                    inline: true
                },
                {
                    name: 'Member Count',
                    value: guild.memberCount?.toString() || 'Unknown',
                    inline: true
                },
                {
                    name: 'Owner',
                    value: guild.ownerId ? `<@${guild.ownerId}>` : 'Unknown',
                    inline: true
                }
            )
            .setThumbnail(guild.iconURL())
            .setTimestamp()
            .setFooter({ text: this.client.footer, iconURL: this.client.logo })

        // Log to database
        await this.logToDatabase(
            'system',
            isJoin ? 'Guild Joined' : 'Guild Left',
            `Bot ${isJoin ? 'joined' : 'left'} guild: ${guild.name}`,
            {
                guildId: isJoin ? guild.id : null, // Don't associate with guild if we left it
                metadata: {
                    guild: {
                        id: guild.id,
                        name: guild.name,
                        memberCount: guild.memberCount,
                        ownerId: guild.ownerId
                    },
                    action: type
                },
                severity: 'info'
            }
        )

        await this.sendToChannels(embed, {
            logType: 'system',
            supportOnly: true
        })
    }

    /**
     * Log crisis events
     */
    async logCrisisEvent(userId, guildId, severity, handled = true) {
        if (!this.enabled) return

        const embed = new this.client.Gateway.EmbedBuilder()
            .setTitle('🚨 Crisis Event Detected')
            .setColor(severity === 'critical' ? this.client.colors.error : this.client.colors.warning)
            .addFields(
                {
                    name: 'User',
                    value: `<@${userId}>`,
                    inline: true
                },
                {
                    name: 'Severity',
                    value: severity.toUpperCase(),
                    inline: true
                },
                {
                    name: 'Status',
                    value: handled ? '✅ Handled' : '⚠️ Pending',
                    inline: true
                },
                {
                    name: 'Guild',
                    value: guildId !== 'DM' ? `Guild: ${guildId}` : 'Direct Message',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: this.client.footer, iconURL: this.client.logo })

        // Log to database
        await this.logToDatabase(
            'crisis',
            'Crisis Event Detected',
            `${severity.toUpperCase()} severity crisis event detected`,
            {
                guildId: guildId !== 'DM' ? guildId : null,
                userId: userId,
                metadata: {
                    severity: severity,
                    handled: handled,
                    location: guildId !== 'DM' ? 'guild' : 'dm'
                },
                severity: severity === 'critical' ? 'error' : 'warning'
            }
        )

        // Send to guild's crisis management channel (if configured)
        if (guildId && guildId !== 'DM') {
            await this.sendToChannels(embed, {
                logType: 'crisis',
                guildId: guildId
            })
        }

        // Also send to support server for monitoring and backup response
        await this.sendToChannels(embed, {
            logType: 'crisis',
            supportOnly: true
        })
    }

    /**
     * Log moderation actions
     */
    async logModerationAction(action, targetUserId, moderatorId, guildId, reason = null) {
        if (!this.enabled) return

        const embed = new this.client.Gateway.EmbedBuilder()
            .setTitle('🛡️ Moderation Action')
            .setColor(this.client.colors.warning)
            .addFields(
                {
                    name: 'Action',
                    value: action.toUpperCase(),
                    inline: true
                },
                {
                    name: 'Target User',
                    value: `<@${targetUserId}>`,
                    inline: true
                },
                {
                    name: 'Moderator',
                    value: `<@${moderatorId}>`,
                    inline: true
                },
                {
                    name: 'Guild',
                    value: guildId,
                    inline: true
                }
            )
            .setTimestamp()
            .setFooter({ text: this.client.footer, iconURL: this.client.logo })

        if (reason) {
            embed.addFields({
                name: 'Reason',
                value: reason,
                inline: false
            })
        }

        // Log to database
        await this.logToDatabase(
            'moderation',
            'Moderation Action',
            `${action.toUpperCase()} action taken against user`,
            {
                guildId: guildId,
                userId: targetUserId,
                metadata: {
                    action: action,
                    targetUserId: targetUserId,
                    moderatorId: moderatorId,
                    reason: reason
                },
                severity: 'warning'
            }
        )

        await this.sendToChannels(embed, {
            logType: 'moderation',
            guildId: guildId
        })
    }

    /**
     * Enhanced error logging with additional context
     */
    async logError(type, message, context = {}) {
        if (!this.enabled) return

        // Handle both old and new error signature
        let errorType, errorMessage, errorContext

        if (typeof type === 'string' && typeof message === 'string') {
            // New signature: logError(type, message, context)
            errorType = type
            errorMessage = message
            errorContext = context
        } else {
            // Old signature: logError(error, context)
            const error = type
            const contextStr = message || 'Unknown'
            errorType = 'System Error'
            errorMessage = error.message || error.toString()
            errorContext = {
                error: error.stack,
                context: contextStr,
                ...context
            }
        }

        const embed = new this.client.Gateway.EmbedBuilder()
            .setTitle('❌ System Error')
            .setColor(this.client.colors.error)
            .addFields(
                {
                    name: 'Error Type',
                    value: errorType,
                    inline: true
                },
                {
                    name: 'Message',
                    value: errorMessage.substring(0, 1000),
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: this.client.footer, iconURL: this.client.logo })

        if (errorContext.guildId) {
            embed.addFields({
                name: 'Guild',
                value: errorContext.guildId,
                inline: true
            })
        }

        if (errorContext.userId) {
            embed.addFields({
                name: 'User',
                value: `<@${errorContext.userId}>`,
                inline: true
            })
        }

        if (errorContext.error) {
            embed.addFields({
                name: 'Stack Trace',
                value: `\`\`\`${errorContext.error.substring(0, 1000)}\`\`\``,
                inline: false
            })
        }

        // Log to database
        await this.logToDatabase('error', errorType, errorMessage, {
            guildId: errorContext.guildId || null,
            userId: errorContext.userId || null,
            metadata: {
                errorType: errorType,
                stack: errorContext.error,
                context: errorContext
            },
            severity: 'error'
        })

        await this.sendToChannels(embed, {
            logType: 'error',
            supportOnly: true
        })

        // Also log to console
        log(`${errorType}: ${errorMessage}`, 'error')
    }

    /**
     * Log user registration/updates
     */
    async logUserEvent(userId, username, event, details = null) {
        if (!this.enabled) return

        const embed = new this.client.Gateway.EmbedBuilder()
            .setTitle(`👤 User ${event.charAt(0).toUpperCase() + event.slice(1)}`)
            .setColor(this.client.colors.primary)
            .addFields(
                {
                    name: 'User',
                    value: `<@${userId}> (${username})`,
                    inline: true
                },
                {
                    name: 'Event',
                    value: event,
                    inline: true
                }
            )
            .setTimestamp()
            .setFooter({ text: this.client.footer, iconURL: this.client.logo })

        if (details) {
            embed.addFields({
                name: 'Details',
                value: details,
                inline: false
            })
        }

        // Log to database
        await this.logToDatabase(
            'user',
            `User ${event.charAt(0).toUpperCase() + event.slice(1)}`,
            details || `User ${event} event`,
            {
                userId: userId,
                metadata: {
                    username: username,
                    event: event,
                    details: details
                },
                severity: 'info'
            }
        )

        await this.sendToChannels(embed, {
            logType: 'user',
            supportOnly: true
        })
    }

    /**
     * Log support requests from guilds
     */
    async logSupportRequest(guildId, guildName, userId, username, severity, issue, contact, hasAdminPerms) {
        if (!this.enabled) return

        const severityEmoji = {
            critical: '🔴',
            high: '🟡',
            medium: '🟢',
            low: '🔵'
        }

        const embed = new this.client.Gateway.EmbedBuilder()
            .setTitle('🎫 Guild Support Request')
            .setColor(
                severity === 'critical'
                    ? this.client.colors.error
                    : severity === 'high'
                      ? this.client.colors.warning
                      : severity === 'medium'
                        ? this.client.colors.secondary
                        : this.client.colors.primary
            )
            .addFields(
                {
                    name: '🏠 Guild',
                    value: `${guildName} (\`${guildId}\`)`,
                    inline: true
                },
                {
                    name: '👤 Requester',
                    value: `<@${userId}> (${username})`,
                    inline: true
                },
                {
                    name: '🔒 Admin Perms',
                    value: hasAdminPerms ? '✅ Yes' : '❌ No',
                    inline: true
                },
                {
                    name: '⚠️ Severity',
                    value: `${severityEmoji[severity]} ${severity.toUpperCase()}`,
                    inline: true
                },
                {
                    name: '📞 Contact',
                    value: contact,
                    inline: true
                },
                {
                    name: '📝 Issue',
                    value: issue.length > 1000 ? issue.substring(0, 997) + '...' : issue,
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: this.client.footer, iconURL: this.client.logo })

        // Log to database
        await this.logToDatabase(
            'support',
            'Guild Support Request',
            `${severity.toUpperCase()} support request from ${guildName}`,
            {
                guildId: guildId,
                userId: userId,
                metadata: {
                    guildName: guildName,
                    username: username,
                    severity: severity,
                    issue: issue,
                    contact: contact,
                    hasAdminPerms: hasAdminPerms
                },
                severity: severity === 'critical' ? 'error' : severity === 'high' ? 'warning' : 'info'
            }
        )

        await this.sendToChannels(embed, {
            logType: 'support',
            supportOnly: true
        })

        // Also log to console for debugging
        log(
            `Support request from ${guildName} (${guildId}) by ${username}: ${severity} - ${issue.substring(0, 100)}`,
            'info'
        )
    }

    /**
     * Log system startup events
     */
    async logStartupEvent(title, description, metadata = {}) {
        if (!this.enabled) return

        // Log to database
        await this.logToDatabase('startup', title, description, {
            metadata: metadata,
            severity: 'info'
        })
    }

    /**
     * Log guild settings updates
     * @param {string} guildId - Guild ID
     * @param {string} guildName - Guild name
     * @param {Object} updates - Settings that were updated
     * @param {string} updatedBy - User ID who made the update
     */
    async logGuildSettingsUpdate(guildId, guildName, updates, updatedBy) {
        // Create console log
        log(`Guild settings updated in ${guildName} (${guildId}) by ${updatedBy}`, 'guild')

        // Store in database
        await this.logToDatabase('system', `Guild Settings Updated`, `Settings updated in guild ${guildName}`, {
            guildId: guildId,
            updatedBy: updatedBy,
            metadata: {
                guildName: guildName,
                updates: updates,
                timestamp: new Date().toISOString()
            },
            severity: 'info'
        })
    }

    /**
     * Log an event to the database
     * This provides persistent storage for all log events
     */
    async logToDatabase(logType, title, description, options = {}) {
        if (!this.client.db || !this.client.db.systemLogs) {
            console.warn('Database not available for logging')
            return null
        }

        try {
            const logData = {
                guildId: options.guildId || null,
                userId: options.userId || null,
                logType: logType,
                title: title,
                description: description,
                metadata: options.metadata || null,
                severity: options.severity || 'info'
            }

            return await this.client.db.systemLogs.create(logData)
        } catch (error) {
            console.error('Failed to log to database:', error)
            return null
        }
    }

    /**
     * Get recent logs for a specific guild
     * Queries the database for persistent log storage
     */
    async getGuildLogs(guildId, logType = 'all', limit = 10) {
        try {
            // Use the database module to get logs
            const logs = await this.client.db.systemLogs.getGuildLogs(guildId, logType, limit)

            // Format logs for display
            return logs.map(log => ({
                id: log.id,
                type: log.logType,
                title: log.title,
                description: log.description,
                severity: log.severity,
                timestamp: log.createdAt,
                user: log.user
                    ? {
                          id: log.user.id.toString(),
                          username: log.user.username,
                          role: log.user.role
                      }
                    : null,
                metadata: log.metadata ? JSON.parse(log.metadata) : null
            }))
        } catch (error) {
            console.error('Failed to retrieve guild logs:', error)
            return []
        }
    }

    /**
     * Send embed to appropriate log channels based on context
     */
    async sendToChannels(embed, options = {}) {
        // Determine target channels based on log type and context
        const targetChannels = await this.getTargetChannels(options)

        for (const [guildId, channel] of targetChannels) {
            try {
                await channel.send({ embeds: [embed] })
            } catch (error) {
                console.error(`Failed to send system log to guild ${guildId}:`, error)
                // Remove invalid channel
                this.channels.delete(guildId)
            }
        }
    }

    /**
     * Get target channels based on log type and context
     */
    async getTargetChannels(options = {}) {
        const { logType, guildId, supportOnly = false } = options
        const targetChannels = new Map()

        // Support requests and sensitive logs go only to support server
        if (supportOnly || logType === 'support') {
            const supportGuildId = process.env.SUPPORT_GUILD_ID
            if (supportGuildId) {
                const channel = await this.loadChannel(supportGuildId)
                if (channel) {
                    targetChannels.set(supportGuildId, channel)
                }
            }
            return targetChannels
        }

        // Crisis events can go to both guild and support server (handled separately in logCrisisEvent)
        if (logType === 'crisis' && guildId) {
            const channel = await this.loadChannel(guildId)
            if (channel) {
                targetChannels.set(guildId, channel)
            }
            return targetChannels
        }

        // Guild-specific logs go only to that guild
        if (guildId) {
            const channel = await this.loadChannel(guildId)
            if (channel) {
                targetChannels.set(guildId, channel)
            }
            return targetChannels
        }

        // Global system events (bot startup, etc.) go to support server only
        if (
            logType === 'system' ||
            logType === 'startup' ||
            logType === 'error' ||
            logType === 'command' ||
            logType === 'user'
        ) {
            const supportGuildId = process.env.SUPPORT_GUILD_ID
            if (supportGuildId) {
                const channel = await this.loadChannel(supportGuildId)
                if (channel) {
                    targetChannels.set(supportGuildId, channel)
                }
            }
        }

        return targetChannels
    }

    /**
     * Load a system log channel for a guild on demand
     */
    async loadChannel(guildId) {
        // Return cached channel if available
        if (this.channels.has(guildId)) {
            return this.channels.get(guildId)
        }

        try {
            // Fetch guild and look for system log channel
            const guild = await this.client.guilds.fetch(guildId)
            if (!guild) return null

            // Check if this guild has system logging configured
            const guildSettings = await this.client.db.guilds.findById(guildId)
            const systemChannelId = guildSettings?.systemChannelId

            if (!systemChannelId) {
                // No system channel configured for this guild
                return null
            }

            // Fetch the channel
            const channel = await guild.channels.fetch(systemChannelId)
            if (channel && channel.isTextBased()) {
                // Cache the channel
                this.channels.set(guildId, channel)
                return channel
            }
        } catch (error) {
            console.error(`Failed to load system log channel for guild ${guildId}:`, error)
        }

        return null
    }

    /**
     * Add a guild channel for system logging
     */
    async addGuildChannel(guildId, channelId) {
        try {
            const guild = await this.client.guilds.fetch(guildId)
            const channel = await guild.channels.fetch(channelId)

            if (channel && channel.isTextBased()) {
                this.channels.set(guildId, channel)
                this.enabled = true
                return true
            }
        } catch (error) {
            console.error(`Failed to add guild channel for system logging:`, error)
        }
        return false
    }

    /**
     * Remove a guild channel from system logging
     */
    removeGuildChannel(guildId) {
        this.channels.delete(guildId)
        this.enabled = this.channels.size > 0
    }
}
