import { ChannelType } from 'discord.js'

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
        const mellowConfig = await client.db.mellow.get()
        if (!mellowConfig.enabled) return false

        // Check guild settings if in a guild
        if (message.guild) {
            const guildSettings = await client.db.guilds.findById(message.guild.id)
            if (guildSettings?.isBanned) return false
        }

        // Get user preferences
        const userPrefs = await client.db.userPreferences.findById(message.author.id)

        // Start typing indicator
        await message.channel.sendTyping()

        // Prepare context for AI service
        const context = {
            messageId: message.id,
            channelId: message.channel.id
        }

        // Add guild context for guild messages
        if (message.guild) {
            context.guildId = message.guild.id
        }

        // Generate AI response with enhanced context
        let aiResponse

        // Use smart DM response for direct messages to be less overwhelming
        if (message.channel.type === ChannelType.DM) {
            aiResponse = await client.ai.generateSmartDMResponse(message.content, message.author.id, context)
        } else {
            aiResponse = await client.ai.generateResponse(message.content, message.author.id, context)
        }

        await message.reply({
            content: aiResponse,
            allowedMentions: { repliedUser: true }
        })

        // Log AI interaction to system logger
        if (client.systemLogger) {
            await client.systemLogger.logUserEvent(
                message.author.id,
                message.author.username,
                'ai_conversation',
                `User had AI conversation in ${message.guild ? message.guild.name : 'DM'}`
            )
        }

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
    const mellowConfig = await client.db.mellow.get()
    if (!mellowConfig.enabled) return false

    // Check if user is banned
    const user = await client.db.users.findById(message.author.id)
    if (user?.isBanned) return false

    // Always respond to ALL DMs (except bot messages and banned users) - RETURN IMMEDIATELY
    if (message.channel.type === ChannelType.DM) {
        return true
    }

    // Check guild settings if in a guild (only for guild messages now)
    if (message.guild) {
        const guildSettings = await client.db.guilds.findById(message.guild.id)
        if (guildSettings?.isBanned) return false
    }

    // For guild messages, check if message is a reply to the bot
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
