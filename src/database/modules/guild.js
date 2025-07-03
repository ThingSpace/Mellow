/**
 * GuildModule - Database operations for Discord guilds/servers
 *
 * This module provides a flexible interface for managing guild data in the database.
 * It uses Prisma's upsert functionality to handle both creation and updates seamlessly.
 *
 * @class GuildModule
 */
export class GuildModule {
    /**
     * Creates a new GuildModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
    }

    /**
     * Creates or updates a guild record
     *
     * If a guild with the given ID exists, it updates the record with the provided data.
     * If no guild exists, it creates a new record with the ID and data.
     *
     * @param {string|number} id - Discord guild ID
     * @param {Object} data - Guild data to create/update
     * @param {boolean} [preserveState] - Whether to preserve the guilds ban state and settings
     * @param {string} [data.name] - Guild name
     * @param {string|number} [data.ownerId] - Guild owner's Discord ID
     * @param {string} [data.modAlertChannelId] - Channel ID for crisis alerts and urgent mental health situations
     * @param {string} [data.modLogChannelId] - Channel ID for routine moderation logs and auto-mod actions
     * @param {string} [data.checkInChannelId] - Channel ID for check-in logs
     * @param {string} [data.copingToolLogId] - Channel ID for coping tool logs
     * @param {boolean} [data.enableCheckIns] - Whether check-ins are enabled
     * @param {boolean} [data.enableGhostLetters] - Whether ghost letters are enabled
     * @param {boolean} [data.enableCrisisAlerts] - Whether crisis alerts are enabled
     * @param {string} [data.moderatorRoleId] - Role ID for moderators
     * @param {boolean} [data.autoModEnabled] - Whether auto-moderation is enabled
     * @param {number} [data.autoModLevel] - Auto-moderation level (1-5)
     * @param {string} [data.language] - Preferred language for the guild
     * @returns {Promise<Object>} The created or updated guild record
     */
    async upsert(id, data, preserveState = true) {
        // Convert ID to String for database consistency
        const guildId = String(id)

        // For creation, we need at minimum the guild name and owner ID
        // These should ALWAYS be provided from Discord's guild object
        const createData = {
            id: guildId,
            name: data.name,
            ownerId: String(data.ownerId),
            ...data
        }

        if (preserveState) {
            // Only update "safe" fields that can change on rejoin
            const safeFields = [
                'name',
                'ownerId',
                'language',
                'modAlertChannelId',
                'modLogChannelId',
                'checkInChannelId',
                'copingToolLogId',
                'systemChannelId',
                'auditLogChannelId',
                'enableCheckIns',
                'enableGhostLetters',
                'enableCrisisAlerts',
                'systemLogsEnabled',
                'moderatorRoleId',
                'systemRoleId',
                'autoModEnabled',
                'autoModLevel'
            ]

            const safeData = {}

            for (const field of safeFields) {
                if (data[field] !== undefined) {
                    safeData[field] = data[field]
                }
            }

            return this.prisma.guild.upsert({
                where: { id: guildId },
                create: createData,
                update: safeData
            })
        } else {
            return this.prisma.guild.upsert({
                where: { id: guildId },
                create: createData,
                update: data
            })
        }
    }

    /**
     * Retrieves multiple guild records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of guild records
     *
     * @example
     * // Get all guilds with check-ins enabled
     * const guilds = await guildModule.findMany({
     *   where: { enableCheckIns: true }
     * })
     *
     * // Get first 10 guilds with mod actions included
     * const guilds = await guildModule.findMany({
     *   take: 10,
     *   include: { modActions: true }
     * })
     */
    async findMany(args = {}) {
        return this.prisma.guild.findMany(args)
    }

    /**
     * Retrieves a single guild record by ID
     *
     * @param {string|number} id - Discord guild ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} Guild record or null if not found
     *
     * @example
     * // Get basic guild info
     * const guild = await guildModule.findById('123456789')
     *
     * // Get guild with mod actions included
     * const guild = await guildModule.findById('123456789', {
     *   include: { modActions: true }
     * })
     *
     * // Get only specific fields
     * const guild = await guildModule.findById('123456789', {
     *   select: { name: true, modAlertChannelId: true }
     * })
     */
    async findById(id, options = {}) {
        return this.prisma.guild.findUnique({
            where: { id: String(id) },
            ...options
        })
    }

    /**
     * Deletes a guild record from the database
     *
     * @param {string|number} id - Discord guild ID
     * @returns {Promise<Object>} The deleted guild record
     *
     * @example
     * await guildModule.delete('123456789')
     */
    async delete(id) {
        return this.prisma.guild.delete({
            where: { id: String(id) }
        })
    }

    /**
     * Gets guild settings (channels, roles, feature toggles)
     *
     * @param {string|number} id - Discord guild ID
     * @returns {Promise<Object|null>} Guild settings or null if not found
     */
    async getSettings(id) {
        return this.findById(id, {
            select: {
                id: true,
                name: true,
                systemChannelId: true,
                auditLogChannelId: true,
                modAlertChannelId: true,
                modLogChannelId: true,
                checkInChannelId: true,
                copingToolLogId: true,
                moderatorRoleId: true,
                systemRoleId: true,
                enableCheckIns: true,
                enableGhostLetters: true,
                enableCrisisAlerts: true,
                systemLogsEnabled: true,
                autoModEnabled: true,
                autoModLevel: true,
                language: true,
                disableContextLogging: true
            }
        })
    }

    /**
     * Updates guild channel settings
     *
     * @param {string|number} id - Discord guild ID
     * @param {Object} channels - Channel settings to update
     * @param {string} [channels.systemChannelId] - System channel ID
     * @param {string} [channels.auditLogChannelId] - Audit log channel ID
     * @param {string} [channels.modAlertChannelId] - Mod alert channel ID
     * @param {string} [channels.modLogChannelId] - Mod log channel ID
     * @param {string} [channels.checkInChannelId] - Check-in channel ID
     * @param {string} [channels.copingToolLogId] - Coping tool log channel ID
     * @returns {Promise<Object>} Updated guild record
     */
    async updateChannels(id, channels) {
        return this.prisma.guild.update({
            where: { id: String(id) },
            data: channels
        })
    }

    /**
     * Updates guild role settings
     *
     * @param {string|number} id - Discord guild ID
     * @param {Object} roles - Role settings to update
     * @param {string} [roles.moderatorRoleId] - Moderator role ID
     * @param {string} [roles.systemRoleId] - System role ID
     * @returns {Promise<Object>} Updated guild record
     */
    async updateRoles(id, roles) {
        return this.prisma.guild.update({
            where: { id: String(id) },
            data: roles
        })
    }

    /**
     * Updates guild feature toggles
     *
     * @param {string|number} id - Discord guild ID
     * @param {Object} features - Feature settings to update
     * @param {boolean} [features.enableCheckIns] - Enable check-ins
     * @param {boolean} [features.enableGhostLetters] - Enable ghost letters
     * @param {boolean} [features.enableCrisisAlerts] - Enable crisis alerts
     * @param {boolean} [features.systemLogsEnabled] - Enable system logs
     * @param {boolean} [features.autoModEnabled] - Enable auto-moderation
     * @param {number} [features.autoModLevel] - Auto-mod level (1-5)
     * @param {boolean} [features.disableContextLogging] - Disable context logging
     * @returns {Promise<Object>} Updated guild record
     */
    async updateFeatures(id, features) {
        return this.prisma.guild.update({
            where: { id: String(id) },
            data: features
        })
    }

    /**
     * Checks if a guild exists in the database
     *
     * @param {string|number} id - Discord guild ID
     * @returns {Promise<boolean>} True if guild exists
     */
    async exists(id) {
        const guild = await this.prisma.guild.findUnique({
            where: { id: String(id) },
            select: { id: true }
        })
        return !!guild
    }

    /**
     * Gets guild ban status and info
     *
     * @param {string|number} id - Discord guild ID
     * @returns {Promise<Object|null>} Ban info or null if not found
     */
    async getBanStatus(id) {
        return this.findById(id, {
            select: {
                id: true,
                name: true,
                isBanned: true,
                bannedUntil: true,
                banReason: true
            }
        })
    }
}
