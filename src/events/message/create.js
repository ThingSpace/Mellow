import { Events, ChannelType } from 'discord.js'
import { handleMessageCrisis, sendCrisisModAlert } from '../../functions/crisisHandler.js'
import { handleMessageModeration } from '../../functions/moderationHandler.js'
import { handleAIResponse, shouldTriggerAI, isReplyToBot } from '../../functions/aiResponseHandler.js'
import { handleTextCommand } from '../../functions/commandHandler.js'

/**
 * Log message for AI context (respects privacy settings)
 * @param {Object} message - Discord message
 * @param {Object} client - Discord client
 */
async function logMessageForContext(message, client) {
    try {
        // Skip if user has opted out of message logging for context
        const userPrefs = await client.db.userPreferences.findById(message.author.id)
        if (userPrefs?.disableContextLogging) return

        // Only log non-sensitive information for context
        const contextData = {
            content: message.content,
            isAiResponse: false,
            contextType: 'conversation',
            messageId: message.id
        }

        // Add channel/guild context for guild messages
        if (message.guild) {
            contextData.channelId = message.channel.id
            contextData.guildId = message.guild.id

            // Skip logging in private channels or DMs unless user consents
            const guildSettings = await client.db.guilds.findById(message.guild.id)
            if (guildSettings?.disableContextLogging) return
        }

        await client.db.conversationHistory.create(message.author.id, contextData)
    } catch (error) {
        // Don't log errors for context logging to avoid spam
        console.debug('Failed to log message for context:', error.message)
    }
}

export default {
    event: Events.MessageCreate,
    run: async (client, message) => {
        // Skip bot messages
        if (message.author.bot) return

        try {
            // 0. MESSAGE LOGGING - Log for AI context (privacy-aware) BEFORE other processing
            await logMessageForContext(message, client)

            // 1. CRISIS ANALYSIS - Always run for all messages
            const crisisResult = await handleMessageCrisis(message, client)
            if (crisisResult?.needsSupport && crisisResult.response?.modAlert) {
                await sendCrisisModAlert(message, crisisResult.analysis, client)
            }

            // 2. MODERATION - Only for guild messages
            if (message.guild) {
                const moderationResult = await handleMessageModeration(message, client)
                // If message was deleted by moderation, stop processing
                if (moderationResult?.finalAction && moderationResult.finalAction !== 'warn') {
                    return
                }
            }

            // 3. COMMAND HANDLING - Check for text commands first
            const commandHandled = await handleTextCommand(message, client)
            if (commandHandled) return

            // 4. AI RESPONSE - Handle AI interactions
            const shouldRespond = await shouldTriggerAI(message, client)
            if (shouldRespond) {
                await handleAIResponse(message, client)
            }
        } catch (error) {
            console.error('Error in message create event:', error)

            // Try to send a generic error response if possible
            try {
                const shouldRespond = await shouldTriggerAI(message, client)
                if (shouldRespond) {
                    await message.reply({
                        content: "I'm experiencing some technical difficulties. Please try again later.",
                        allowedMentions: { repliedUser: true }
                    })
                }
            } catch (replyError) {
                console.error('Error sending fallback message:', replyError)
            }
        }
    }
}
