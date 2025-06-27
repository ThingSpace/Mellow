import { Events, ChannelType } from 'discord.js'
import { handleMessageCrisis, sendCrisisModAlert } from '../../functions/crisisHandler.js'
import { handleMessageModeration } from '../../functions/moderationHandler.js'
import { handleAIResponse, shouldTriggerAI, isReplyToBot } from '../../functions/aiResponseHandler.js'
import { handleTextCommand } from '../../functions/commandHandler.js'

export default {
    event: Events.MessageCreate,
    run: async (client, message) => {
        // Skip bot messages
        if (message.author.bot) return

        try {
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
