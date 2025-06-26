export class MessageHistoryTool {
    constructor(db) {
        this.db = db
    }

    async saveMessage(userId, messageContent, isAiResponse = false) {
        if (!userId) {
            console.error('No userId provided to saveMessage')
            return
        }

        try {
            // Use the conversation history module
            await this.db.conversationHistory.add(userId, messageContent, isAiResponse)
        } catch (error) {
            console.error('Failed to save message history:', error)
            throw error // Propagate error to handle it in the AI service
        }
    }

    async getRecentHistory(userId, limit = 50) {
        if (!userId) {
            console.error('No userId provided to getRecentHistory')
            return []
        }

        try {
            const history = await this.db.conversationHistory.getAllForUser(userId, limit)

            // Convert to format expected by AI service
            return history.map(msg => ({
                role: msg.isAiResponse ? 'assistant' : 'user',
                content: msg.content
            }))
        } catch (error) {
            console.error('Failed to get message history:', error)
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
            throw error // Propagate error to handle it in the AI service
        }
    }
}
