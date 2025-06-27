/**
 * Generate and send AI response to user message
 * @param {Object} message - Discord message object
 * @param {Object} client - Discord client
 * @returns {Promise<boolean>} Whether response was sent successfully
 */
export async function handleAIResponse(message, client) {
    try {
        // Skip bot messages
        if (message.author.bot) return false

        // Check if Mellow is enabled globally
        const mellowConfig = await client.database.mellow.get()
        if (!mellowConfig.enabled) return false

        // Check guild settings if in a guild
        if (message.guild) {
            const guildSettings = await client.database.guild.findById(message.guild.id)
            if (guildSettings?.isBanned) return false
        }

        // Get user preferences
        const userPrefs = await client.database.userPreferences.findById(message.author.id)

        // Start typing indicator
        await message.channel.sendTyping()

        // Get AI configuration from database
        const aiConfig = await client.database.mellow.getAIConfig()

        const aiResponse = await client.ai.generateResponse(message.content, message.author.id, {
            personality: userPrefs?.aiPersonality || 'gentle',
            language: userPrefs?.language || message.guild?.preferredLocale || 'en',
            ...aiConfig
        })

        await message.reply({
            content: aiResponse,
            allowedMentions: { repliedUser: true }
        })

        // Log conversation to database
        await client.database.conversationHistory.create({
            data: {
                userId: BigInt(message.author.id),
                content: message.content,
                isAiResponse: false
            }
        })

        await client.database.conversationHistory.create({
            data: {
                userId: BigInt(message.author.id),
                content: aiResponse,
                isAiResponse: true
            }
        })

        return true
    } catch (error) {
        console.error('Error generating AI response:', error)

        try {
            await message.reply({
                content:
                    "I apologize, but I'm having trouble processing your message right now. Please try again later.",
                allowedMentions: { repliedUser: true }
            })
        } catch (replyError) {
            console.error('Error sending error message:', replyError)
        }

        return false
    }
}

/**
 * Check if message should trigger AI response
 * @param {Object} message - Discord message object
 * @param {Object} client - Discord client
 * @returns {Promise<boolean>} Whether AI should respond
 */
export async function shouldTriggerAI(message, client) {
    // Skip bot messages
    if (message.author.bot) return false

    // Check if Mellow is enabled globally
    const mellowConfig = await client.database.mellow.get()
    if (!mellowConfig.enabled) return false

    // Check if user is banned
    const user = await client.database.user.findById(message.author.id)
    if (user?.isBanned) return false

    // Check guild settings if in a guild
    if (message.guild) {
        const guildSettings = await client.database.guild.findById(message.guild.id)
        if (guildSettings?.isBanned) return false

        // Check if guild has specific AI settings disabled
        // This would need to be added to your schema if you want guild-level AI controls
    }

    // Always respond to DMs (except bot messages and banned users)
    if (message.channel.type === 'DM') {
        return true
    }

    // Check if message is a reply to the bot
    if (message.reference?.messageId) {
        const isReply = await isReplyToBot(message, client)
        if (isReply) return true
    }

    // Check if message mentions the bot
    const mention = new RegExp(`^<@!?${client.user.id}> ?`)
    if (mention.test(message.content)) {
        return true
    }

    return false
}

/**
 * Check if replied message is from the bot
 * @param {Object} message - Discord message object
 * @param {Object} client - Discord client
 * @returns {Promise<boolean>} Whether replied message is from bot
 */
export async function isReplyToBot(message, client) {
    try {
        if (!message.reference?.messageId) return false

        const repliedTo = await message.channel.messages.fetch(message.reference.messageId)
        return repliedTo.author.id === client.user.id
    } catch (error) {
        console.error('Error checking reply target:', error)
        return false
    }
}
