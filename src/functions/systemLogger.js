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
    }

    /**
     * Initialize system logger with guild configurations
     */
    async initialize() {
        try {
            // Get all guilds with system logging enabled
            const guilds = await this.client.db.guilds.findMany({
                where: {
                    systemLogsEnabled: true,
                    systemChannelId: { not: null }
                }
            })

            for (const guild of guilds) {
                try {
                    const guildInstance = await this.client.guilds.fetch(guild.id.toString())
                    const channel = await guildInstance.channels.fetch(guild.systemChannelId).catch(() => null)

                    if (channel && channel.isTextBased()) {
                        this.channels.set(guild.id.toString(), channel)
                    }
                } catch (error) {
                    console.error(`Failed to initialize system logging for guild ${guild.id}:`, error)
                }
            }

            this.enabled = this.channels.size > 0
            log(`System logger initialized with ${this.channels.size} channels`, 'info')
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

        await this.sendToChannels(embed)
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

        await this.sendToChannels(embed)
    }

    /**
     * Log guild settings updates
     */
    async logGuildSettingsUpdate(guildId, guildName, updates, moderatorId) {
        if (!this.enabled) return

        const embed = new this.client.Gateway.EmbedBuilder()
            .setTitle('⚙️ Guild Settings Updated')
            .setColor(this.client.colors.primary)
            .addFields(
                {
                    name: 'Guild',
                    value: `${guildName} (${guildId})`,
                    inline: false
                },
                {
                    name: 'Updated By',
                    value: `<@${moderatorId}>`,
                    inline: true
                },
                {
                    name: 'Changes',
                    value: Object.entries(updates)
                        .map(([key, value]) => {
                            if (key.includes('ChannelId') && value) {
                                return `**${key}:** <#${value}>`
                            }
                            if (key.includes('RoleId') && value) {
                                return `**${key}:** <@&${value}>`
                            }
                            if (typeof value === 'boolean') {
                                return `**${key}:** ${value ? '✅ Enabled' : '❌ Disabled'}`
                            }
                            return `**${key}:** ${value}`
                        })
                        .join('\n'),
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: this.client.footer, iconURL: this.client.logo })

        await this.sendToChannels(embed)
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

        await this.sendToChannels(embed)
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

        await this.sendToChannels(embed)
    }

    /**
     * Log system errors
     */
    async logError(error, context = 'Unknown') {
        if (!this.enabled) return

        const embed = new this.client.Gateway.EmbedBuilder()
            .setTitle('❌ System Error')
            .setColor(this.client.colors.error)
            .addFields(
                {
                    name: 'Context',
                    value: context,
                    inline: true
                },
                {
                    name: 'Error Message',
                    value: error.message.substring(0, 1000),
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: this.client.footer, iconURL: this.client.logo })

        if (error.stack) {
            embed.addFields({
                name: 'Stack Trace',
                value: `\`\`\`${error.stack.substring(0, 1000)}\`\`\``,
                inline: false
            })
        }

        await this.sendToChannels(embed)
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

        await this.sendToChannels(embed)
    }

    /**
     * Send embed to all configured system log channels
     */
    async sendToChannels(embed) {
        for (const [guildId, channel] of this.channels) {
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
