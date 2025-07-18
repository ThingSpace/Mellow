/**
 * SystemLogModule - Database operations for system logs
 *
 * This module provides a flexible interface for managing system log data in the database.
 * It handles logging of system events, command usage, moderation actions, and other events.
 *
 * @class SystemLogModule
 */
export class SystemLogModule {
    /**
     * Creates a new SystemLogModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
    }

    /**
     * Creates a new system log record
     *
     * @param {Object} data - System log data
     * @param {string|number} [data.guildId] - Discord guild ID (null for global logs)
     * @param {string|number} [data.userId] - Discord user ID (if applicable)
     * @param {string} data.logType - Type of log (command, crisis, moderation, system, user, support, startup, error)
     * @param {string} data.title - Log event title
     * @param {string} [data.description] - Detailed description
     * @param {Object} [data.metadata] - Additional metadata (will be JSON stringified)
     * @param {string} [data.severity] - Log severity (info, warning, error, critical)
     * @returns {Promise<Object>} The created system log record
     *
     * @example
     * // Log a command usage
     * await systemLogModule.create({
     *   guildId: '123456789',
     *   userId: '987654321',
     *   logType: 'command',
     *   title: 'Command Executed',
     *   description: '/checkin command executed successfully',
     *   metadata: { command: 'checkin', category: 'Coping', success: true },
     *   severity: 'info'
     * })
     *
     * // Log a crisis event
     * await systemLogModule.create({
     *   guildId: '123456789',
     *   userId: '987654321',
     *   logType: 'crisis',
     *   title: 'Crisis Event Detected',
     *   description: 'High severity crisis detected in user message',
     *   metadata: { severity: 'high', keywords: ['help', 'crisis'] },
     *   severity: 'warning'
     * })
     */
    async create(data) {
        return this.prisma.systemLog.create({
            data: {
                guildId: data.guildId ? BigInt(String(data.guildId)) : null,
                userId: data.userId ? BigInt(String(data.userId)) : null,
                logType: data.logType,
                title: data.title,
                description: data.description || null,
                metadata: data.metadata ? JSON.stringify(data.metadata) : null,
                severity: data.severity || 'info'
            }
        })
    }

    /**
     * Retrieves multiple system log records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of system log records
     *
     * @example
     * // Get recent logs for a guild
     * const logs = await systemLogModule.findMany({
     *   where: { guildId: BigInt('123456789') },
     *   orderBy: { createdAt: 'desc' },
     *   take: 10
     * })
     *
     * // Get crisis logs only
     * const crisisLogs = await systemLogModule.findMany({
     *   where: { logType: 'crisis' },
     *   include: { user: true, guild: true },
     *   orderBy: { createdAt: 'desc' }
     * })
     */
    async findMany(args = {}) {
        return this.prisma.systemLog.findMany(args)
    }

    /**
     * Retrieves a single system log record by ID
     *
     * @param {number} id - System log record ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} System log record or null if not found
     *
     * @example
     * // Get basic log info
     * const log = await systemLogModule.findById(1)
     *
     * // Get log with user and guild info included
     * const log = await systemLogModule.findById(1, {
     *   include: { user: true, guild: true }
     * })
     */
    async findById(id, options = {}) {
        return this.prisma.systemLog.findUnique({
            where: { id },
            ...options
        })
    }

    /**
     * Deletes a system log record from the database
     *
     * @param {number} id - System log record ID
     * @returns {Promise<Object>} The deleted system log record
     *
     * @example
     * await systemLogModule.delete(1)
     */
    async delete(id) {
        return this.prisma.systemLog.delete({
            where: { id }
        })
    }

    /**
     * Retrieves logs for a specific guild with filtering options
     *
     * @param {string|number} guildId - Discord guild ID
     * @param {string} [logType='all'] - Type of logs to retrieve ('all', 'command', 'crisis', etc.)
     * @param {number} [limit=10] - Maximum number of records to return
     * @param {Object} [options={}] - Additional options
     * @returns {Promise<Array>} Array of system log records for the guild
     *
     * @example
     * // Get all recent logs for a guild
     * const logs = await systemLogModule.getGuildLogs('123456789', 'all', 20)
     *
     * // Get only crisis logs for a guild
     * const crisisLogs = await systemLogModule.getGuildLogs('123456789', 'crisis', 5)
     */
    async getGuildLogs(guildId, logType = 'all', limit = 10, options = {}) {
        const where = {
            guildId: BigInt(guildId)
        }

        // Add log type filter if not 'all'
        if (logType !== 'all') {
            where.logType = logType
        }

        return this.prisma.systemLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Math.min(limit, 50), // Cap at 50 to prevent excessive queries
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        role: true
                    }
                }
            },
            ...options
        })
    }

    /**
     * Retrieves logs for a specific user
     *
     * @param {string|number} userId - Discord user ID
     * @param {string} [logType='all'] - Type of logs to retrieve
     * @param {number} [limit=10] - Maximum number of records to return
     * @returns {Promise<Array>} Array of system log records for the user
     *
     * @example
     * // Get all recent logs for a user
     * const logs = await systemLogModule.getUserLogs('987654321', 'all', 10)
     *
     * // Get only command logs for a user
     * const commandLogs = await systemLogModule.getUserLogs('987654321', 'command', 5)
     */
    async getUserLogs(userId, logType = 'all', limit = 10) {
        const where = {
            userId: BigInt(userId)
        }

        // Add log type filter if not 'all'
        if (logType !== 'all') {
            where.logType = logType
        }

        return this.prisma.systemLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Math.min(limit, 50), // Cap at 50 to prevent excessive queries
            include: {
                guild: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })
    }

    /**
     * Retrieves global system logs (not associated with any guild)
     *
     * @param {string} [logType='all'] - Type of logs to retrieve
     * @param {number} [limit=10] - Maximum number of records to return
     * @returns {Promise<Array>} Array of global system log records
     *
     * @example
     * // Get global startup/system logs
     * const globalLogs = await systemLogModule.getGlobalLogs('system', 20)
     */
    async getGlobalLogs(logType = 'all', limit = 10) {
        const where = {
            guildId: null // Global logs have no guild association
        }

        // Add log type filter if not 'all'
        if (logType !== 'all') {
            where.logType = logType
        }

        return this.prisma.systemLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Math.min(limit, 50),
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        role: true
                    }
                }
            }
        })
    }

    /**
     * Count logs by type for analytics
     *
     * @param {string|number} [guildId] - Discord guild ID (optional, null for global)
     * @param {string} [logType] - Type of logs to count (optional)
     * @param {Date} [since] - Count logs since this date (optional)
     * @returns {Promise<number>} Number of matching logs
     *
     * @example
     * // Count all logs for a guild
     * const count = await systemLogModule.countLogs('123456789')
     *
     * // Count crisis logs for a guild in the last 24 hours
     * const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
     * const crisisCount = await systemLogModule.countLogs('123456789', 'crisis', yesterday)
     */
    async countLogs(guildId = null, logType = null, since = null) {
        const where = {}

        if (guildId !== null) {
            where.guildId = BigInt(guildId)
        }

        if (logType) {
            where.logType = logType
        }

        if (since) {
            where.createdAt = {
                gte: since
            }
        }

        return this.prisma.systemLog.count({ where })
    }

    /**
     * Clean up old logs (for maintenance)
     *
     * @param {number} [daysOld=90] - Delete logs older than this many days
     * @param {string} [logType] - Only delete logs of this type (optional)
     * @returns {Promise<Object>} Result containing count of deleted records
     *
     * @example
     * // Delete logs older than 90 days
     * const result = await systemLogModule.cleanupOldLogs(90)
     *
     * // Delete only error logs older than 30 days
     * const result = await systemLogModule.cleanupOldLogs(30, 'error')
     */
    async cleanupOldLogs(daysOld = 90, logType = null) {
        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
        const where = {
            createdAt: {
                lt: cutoffDate
            }
        }

        if (logType) {
            where.logType = logType
        }

        return this.prisma.systemLog.deleteMany({ where })
    }
}
