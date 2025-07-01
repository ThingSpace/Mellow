export class MessageHistoryTool {
    constructor(db) {
        this.db = db
    }

    async saveMessage(userId, messageContent, isAiResponse = false, context = {}) {
        if (!userId) {
            console.error('No userId provided to saveMessage')
            return
        }

        try {
            // Use the conversation history module with enhanced context
            const data = {
                content: messageContent,
                isAiResponse,
                ...context // Include channelId, guildId, messageId, etc.
            }

            await this.db.conversationHistory.create(userId, data)
        } catch (error) {
            console.error('Failed to save message history:', error)
            throw error
        }
    }

    async getRecentHistory(userId, limit = 50, channelId = null) {
        if (!userId) {
            console.error('No userId provided to getRecentHistory')
            return []
        }

        try {
            // Build more inclusive query for better context
            const whereClause = {
                userId: BigInt(userId),
                // Include both conversation and channel context types
                contextType: { in: ['conversation', 'channel_context'] }
            }

            // If channelId is provided, prioritize that channel but also include DMs
            if (channelId) {
                whereClause.OR = [
                    { channelId: channelId },
                    { channelId: null } // Include DM conversations
                ]
            }

            const history = await this.db.conversationHistory.findMany({
                where: whereClause,
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

            // Convert to format expected by AI service and reverse to chronological order
            return history.reverse().map(msg => ({
                role: msg.isAiResponse ? 'assistant' : 'user',
                content: msg.content,
                timestamp: msg.timestamp,
                channelId: msg.channelId,
                contextType: msg.contextType
            }))
        } catch (error) {
            console.error('Failed to get message history:', error)
            return []
        }
    }

    /**
     * Get conversation context including recent channel messages for better AI understanding
     * @param {string} userId - User ID
     * @param {string} channelId - Channel ID (optional)
     * @param {number} userHistoryLimit - Limit for user conversation history
     * @param {number} channelContextLimit - Limit for channel context
     * @returns {Promise<Array>} Combined conversation context
     */
    async getEnhancedContext(userId, channelId = null, userHistoryLimit = 30, channelContextLimit = 10) {
        try {
            const promises = [
                // Get user's conversation history
                this.getRecentHistory(userId, userHistoryLimit, channelId)
            ]

            // If in a guild channel, also get recent channel context from other users
            if (channelId) {
                promises.push(this.db.conversationHistory.getChannelContext(channelId, channelContextLimit))
            }

            const [userHistory, channelContext] = await Promise.all(promises)

            // Start with user's conversation history (already in chronological order)
            let combinedContext = [...userHistory]

            // Add recent channel context from other users for better understanding
            if (channelContext && channelContext.length > 0) {
                const contextMessages = channelContext
                    .filter(msg => {
                        // Include messages from other users (not AI responses, not from current user)
                        return (
                            !msg.isAiResponse &&
                            msg.userId !== BigInt(userId) &&
                            // Only include recent messages (within last hour for context)
                            Date.now() - new Date(msg.timestamp).getTime() < 3600000
                        )
                    })
                    .slice(0, Math.min(channelContextLimit, 8)) // Limit channel context
                    .reverse() // Chronological order
                    .map(msg => ({
                        role: 'system',
                        content: `[Recent channel message from ${msg.user.username}]: ${msg.content}`,
                        timestamp: msg.timestamp,
                        contextType: 'channel_context'
                    }))

                // Insert channel context at the beginning for better context awareness
                if (contextMessages.length > 0) {
                    combinedContext = [
                        ...contextMessages,
                        { role: 'system', content: '--- Your conversation history continues below ---' },
                        ...combinedContext
                    ]
                }
            }

            return combinedContext
        } catch (error) {
            console.error('Failed to get enhanced context:', error)
            return []
        }
    }

    async clearHistory(userId) {
        if (!userId) {
            console.error('No userId provided to clearHistory')
            return
        }

        try {
            await this.db.conversationHistory.clearForUser(userId)
        } catch (error) {
            console.error('Failed to clear message history:', error)
            throw error
        }
    }

    /**
     * Log a Discord message with full context
     * @param {Object} message - Discord message object
     * @param {boolean} isAiResponse - Whether this is an AI response
     * @param {number} parentId - Parent message ID for threading
     * @returns {Promise<Object>} Created history record
     */
    async logDiscordMessage(message, isAiResponse = false, parentId = null) {
        try {
            return await this.db.conversationHistory.logMessageWithContext(
                message,
                isAiResponse,
                'conversation',
                parentId
            )
        } catch (error) {
            console.error('Failed to log Discord message:', error)
            throw error
        }
    }

    /**
     * Get conversation summary for long-term context
     * @param {string} userId - User ID
     * @param {number} daysBack - How many days to look back for summary
     * @returns {Promise<string>} Conversation summary
     */
    async getConversationSummary(userId, daysBack = 7) {
        try {
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - daysBack)

            const history = await this.db.conversationHistory.findMany({
                where: {
                    userId: BigInt(userId),
                    timestamp: { gte: cutoffDate },
                    contextType: 'conversation'
                },
                orderBy: { timestamp: 'desc' },
                take: 50
            })

            if (history.length === 0) return null

            // Create a summary of key topics and user concerns
            const userMessages = history
                .filter(msg => !msg.isAiResponse)
                .slice(0, 20) // Focus on recent user messages
                .map(msg => msg.content)
                .join(' ')

            // Extract key topics (this could be enhanced with AI summarization)
            const keyTopics = []
            if (userMessages.toLowerCase().includes('anxious') || userMessages.toLowerCase().includes('anxiety')) {
                keyTopics.push('anxiety management')
            }
            if (userMessages.toLowerCase().includes('depressed') || userMessages.toLowerCase().includes('depression')) {
                keyTopics.push('depression support')
            }
            if (userMessages.toLowerCase().includes('stress')) {
                keyTopics.push('stress management')
            }
            if (userMessages.toLowerCase().includes('sleep')) {
                keyTopics.push('sleep concerns')
            }

            if (keyTopics.length > 0) {
                return `Recent conversation themes: ${keyTopics.join(', ')}`
            }

            return null
        } catch (error) {
            console.error('Failed to get conversation summary:', error)
            return null
        }
    }
}
