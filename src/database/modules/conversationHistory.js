import { DbEncryptionHelper } from '../../helpers/db-encryption.helper.js'
import { log } from '../../functions/logger.js'

/**
 * ConversationHistoryModule - Database operations for conversation history
 *
 * This module provides a flexible interface for managing conversation history data in the database.
 * It handles message logging, retrieval, and conversation tracking between users and AI.
 *
 * @class ConversationHistoryModule
 */
export class ConversationHistoryModule {
    /**
     * Creates a new ConversationHistoryModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
        this.sensitiveFields = ['content']
    }

    /**
     * Creates a new conversation history record
     *
     * @param {string|number} userId - Discord user ID
     * @param {Object} data - Conversation data
     * @param {string} data.content - Message content
     * @param {boolean} [data.isAiResponse] - Whether this is an AI response (default: false)
     * @param {Date} [data.timestamp] - Message timestamp (default: current time)
     * @param {string} [data.channelId] - Discord channel ID
     * @param {string} [data.guildId] - Discord guild ID
     * @param {string} [data.messageId] - Discord message ID
     * @param {string} [data.contextType] - Type of context (default: "conversation")
     * @param {number} [data.parentId] - Parent message ID for threading
     * @returns {Promise<Object>} The created conversation history record
     *
     * @example
     * // Log a user message
     * await conversationHistoryModule.create('123456789', {
     *   content: 'I\'m feeling anxious today',
     *   isAiResponse: false,
     *   channelId: '987654321',
     *   guildId: '111222333'
     * })
     *
     * // Log an AI response
     * await conversationHistoryModule.create('123456789', {
     *   content: 'I understand you\'re feeling anxious. Let\'s talk about it.',
     *   isAiResponse: true,
     *   parentId: 123
     * })
     */
    async create(userId, data) {
        // Encrypt sensitive fields
        const encryptedData = DbEncryptionHelper.encryptFields(data, this.sensitiveFields)

        // Create data object without userId since we're using the user relation
        const { userId: _, ...createData } = encryptedData

        return this.prisma.conversationHistory.create({
            data: {
                // Connect to the user record
                user: {
                    connect: { id: BigInt(String(userId)) }
                },
                timestamp: data.timestamp || new Date(),
                ...createData
            }
        })
    }

    /**
     * Adds a conversation history record (alias for create)
     *
     * @param {string|number} userId - Discord user ID
     * @param {string} content - Message content
     * @param {boolean} isAiResponse - Whether this is an AI response
     * @returns {Promise<Object>} The created conversation history record
     *
     * @example
     * // Log a user message
     * await conversationHistoryModule.add('123456789', 'I\'m feeling anxious today', false)
     *
     * // Log an AI response
     * await conversationHistoryModule.add('123456789', 'I understand you\'re feeling anxious.', true)
     */
    async add(userId, content, isAiResponse = false) {
        return this.create(userId, {
            content,
            isAiResponse
        })
    }

    /**
     * Creates or updates a conversation history record
     *
     * @param {number} id - Conversation history record ID
     * @param {Object} data - Conversation data to update
     * @returns {Promise<Object>} The created or updated conversation history record
     *
     * @example
     * await conversationHistoryModule.upsert(1, {
     *   content: 'Updated message content'
     * })
     */
    async upsert(id, data) {
        // Encrypt sensitive fields
        const encryptedData = DbEncryptionHelper.encryptFields(data, this.sensitiveFields)

        // Remove userId if present, as it's not a direct field
        const { userId, ...updateData } = encryptedData

        // If userId is provided, handle the user relationship
        const createData = { id, ...updateData }
        if (userId) {
            createData.user = {
                connect: { id: BigInt(String(userId)) }
            }
        }

        return this.prisma.conversationHistory.upsert({
            where: { id },
            update: updateData,
            create: createData
        })
    }

    /**
     * Retrieves multiple conversation history records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of conversation history records
     *
     * @example
     * // Get all conversations for a specific user
     * const conversations = await conversationHistoryModule.findMany({
     *   where: { userId: BigInt('123456789') },
     *   orderBy: { timestamp: 'asc' }
     * })
     *
     * // Get recent AI responses
     * const aiResponses = await conversationHistoryModule.findMany({
     *   where: { isAiResponse: true },
     *   take: 10,
     *   include: { user: true },
     *   orderBy: { timestamp: 'desc' }
     * })
     */
    async findMany(args = {}) {
        const results = await this.prisma.conversationHistory.findMany(args)
        // Decrypt sensitive fields in the results
        return DbEncryptionHelper.processData(results, this.sensitiveFields)
    }

    /**
     * Retrieves a single conversation history record by ID
     *
     * @param {number} id - Conversation history record ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} Conversation history record or null if not found
     *
     * @example
     * // Get basic conversation info
     * const conversation = await conversationHistoryModule.findById(1)
     *
     * // Get conversation with user info included
     * const conversation = await conversationHistoryModule.findById(1, {
     *   include: { user: true }
     * })
     */
    async findById(id, options = {}) {
        const result = await this.prisma.conversationHistory.findUnique({
            where: { id },
            ...options
        })
        // Decrypt sensitive fields in the result
        return DbEncryptionHelper.decryptFields(result, this.sensitiveFields)
    }

    /**
     * Deletes a conversation history record from the database
     *
     * @param {number} id - Conversation history record ID
     * @returns {Promise<Object>} The deleted conversation history record
     *
     * @example
     * await conversationHistoryModule.delete(1)
     */
    async delete(id) {
        return this.prisma.conversationHistory.delete({
            where: { id }
        })
    }

    /**
     * Retrieves all conversation history for a specific user
     *
     * @param {string|number} userId - Discord user ID
     * @param {number} [limit=50] - Maximum number of records to return
     * @param {Object} [options={}] - Additional Prisma options
     * @returns {Promise<Array>} Array of conversation history records for the user
     *
     * @example
     * // Get last 50 conversations for user
     * const conversations = await conversationHistoryModule.getAllForUser('123456789')
     *
     * // Get last 20 conversations with user info
     * const conversations = await conversationHistoryModule.getAllForUser('123456789', 20, {
     *   include: { user: true }
     * })
     */
    async getAllForUser(userId, limit = 50, options = {}) {
        const results = await this.prisma.conversationHistory.findMany({
            where: {
                user: { id: BigInt(String(userId)) }
            },
            orderBy: { timestamp: 'desc' },
            take: limit,
            ...options
        })
        // Decrypt sensitive fields in the results
        return DbEncryptionHelper.processData(results, this.sensitiveFields)
    }

    /**
     * Deletes all conversation history for a specific user
     *
     * @param {string|number} userId - Discord user ID
     * @returns {Promise<Object>} Deletion result with count of deleted records
     *
     * @example
     * const result = await conversationHistoryModule.clearForUser('123456789')
     * console.log(`Deleted ${result.count} conversation records`)
     */
    async clearForUser(userId) {
        return this.prisma.conversationHistory.deleteMany({
            where: {
                user: { id: BigInt(String(userId)) }
            }
        })
    }

    /**
     * Get conversation history with channel context for better AI understanding
     *
     * @param {string|number} userId - Discord user ID
     * @param {string} [channelId] - Discord channel ID (optional)
     * @param {number} [limit=100] - Maximum number of records to return
     * @param {Object} [options={}] - Additional Prisma options
     * @returns {Promise<Array>} Array of conversation history records
     */
    async getConversationWithContext(userId, channelId = null, limit = 100, options = {}) {
        const whereClause = {
            user: { id: BigInt(String(userId)) }
        }

        // If channelId is provided, include channel context
        if (channelId) {
            whereClause.OR = [
                { channelId: String(channelId) },
                { channelId: null } // Include DM conversations
            ]
        }

        const results = await this.prisma.conversationHistory.findMany({
            where: whereClause,
            orderBy: { timestamp: 'desc' },
            take: limit,
            include: {
                parent: true,
                replies: {
                    take: 5,
                    orderBy: { timestamp: 'asc' }
                }
            },
            ...options
        })

        // Decrypt sensitive fields in the results, including nested relations
        return DbEncryptionHelper.processData(results, this.sensitiveFields)
    }

    /**
     * Get recent channel messages for AI context (non-sensitive)
     * This helps AI understand the broader conversation context
     *
     * @param {string} channelId - Discord channel ID
     * @param {number} [limit=20] - Maximum number of records to return
     * @returns {Promise<Array>} Array of recent channel messages
     */
    async getChannelContext(channelId, limit = 20) {
        const results = await this.prisma.conversationHistory.findMany({
            where: {
                channelId: String(channelId),
                contextType: { in: ['conversation', 'channel_context'] }
            },
            orderBy: { timestamp: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        username: true,
                        role: true
                    }
                }
            }
        })

        // Decrypt sensitive fields in the results
        return DbEncryptionHelper.processData(results, this.sensitiveFields)
    }

    /**
     * Log a message with full Discord context
     *
     * @param {Object} message - Discord message object
     * @param {boolean} [isAiResponse=false] - Whether this is an AI response
     * @param {string} [contextType='conversation'] - Type of context
     * @param {number} [parentId] - Parent message ID for threading
     * @returns {Promise<Object|null>} The created conversation history record or null if skipped
     */
    async logMessageWithContext(message, isAiResponse = false, contextType = 'conversation', parentId = null) {
        try {
            // Ensure we have a valid content string that's never null
            const messageContent = message.content || '[No text content]'

            // If there's no meaningful content and no attachments/embeds, add a note
            let finalContent = messageContent
            if (!message.content || message.content.trim().length === 0) {
                finalContent = '[No text content]'

                // If we have attachments or embeds, note them
                if (message.attachments?.size || message.embeds?.length) {
                    const parts = []
                    if (message.attachments?.size) {
                        parts.push(`${message.attachments.size} attachment(s)`)
                    }
                    if (message.embeds?.length) {
                        parts.push(`${message.embeds.length} embed(s)`)
                    }
                    finalContent = `[Message contains ${parts.join(' and ')}]`
                }
            }

            const data = {
                content: finalContent, // This should never be null now
                isAiResponse,
                contextType,
                timestamp: new Date(message.createdTimestamp),
                messageId: String(message.id)
            }

            // Add channel/guild context for guild messages
            if (message.guild) {
                data.channelId = String(message.channel.id)
                data.guildId = String(message.guild.id)
            }

            // Add threading context
            if (parentId) {
                data.parentId = parentId
            }

            // Use our create method which will now properly handle the content
            return this.create(String(message.author.id), data)
        } catch (error) {
            console.error('Error in logMessageWithContext:', error)
            // Create a record with error info
            const errorData = {
                content: `[Error logging message: ${error.message}]`,
                isAiResponse,
                contextType: 'error',
                timestamp: new Date(),
                messageId: message.id ? String(message.id) : 'unknown'
            }

            return this.create(String(message.author.id), errorData)
        }
    }

    /**
     * Get threaded conversation (replies to a specific message)
     *
     * @param {number} parentId - Parent message ID
     * @param {number} [limit=50] - Maximum number of replies to return
     * @returns {Promise<Array>} Array of reply messages
     */
    async getThread(parentId, limit = 50) {
        const results = await this.prisma.conversationHistory.findMany({
            where: { parentId: parentId },
            orderBy: { timestamp: 'asc' },
            take: limit,
            include: {
                user: {
                    select: {
                        username: true,
                        role: true
                    }
                }
            }
        })

        // Decrypt sensitive fields in the results
        return DbEncryptionHelper.processData(results, this.sensitiveFields)
    }

    /**
     * Clean up old conversation history (for privacy and performance)
     *
     * @param {number} [daysToKeep=90] - Number of days to keep history
     * @returns {Promise<Object>} Deletion result with count
     */
    async cleanupOldHistory(daysToKeep = 90) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

        return this.prisma.conversationHistory.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate
                },
                contextType: { not: 'system' } // Keep system messages longer
            }
        })
    }

    /**
     * Count conversation history entries for a specific guild
     *
     * @param {string|number} guildId - Discord guild ID
     * @returns {Promise<number>} Number of conversation history entries for this guild
     */
    async countByGuild(guildId) {
        return this.prisma.conversationHistory.count({
            where: {
                guildId: String(guildId)
            }
        })
    }
}
