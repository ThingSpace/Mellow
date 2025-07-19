import {
    analyzeMessageContent,
    requiresImmediateIntervention,
    generateCrisisResponse,
    checkCrisisKeywords,
    logCrisisEvent,
    sendModeratorAlert,
    checkCrisisDetectionSettings
} from '../services/tools/crisisTool.js'
import { log } from './logger.js'

/**
 * Analyze message for crisis indicators and handle response
 * Updated to respect user and guild privacy settings
 * @param {Object} message - Discord message object
 * @param {Object} client - Discord client
 * @returns {Promise<Object>} Crisis analysis result
 */
export async function handleMessageCrisis(message, client) {
    try {
        // Skip bot messages
        if (message.author.bot) return null

        // Check if crisis detection is enabled for this user/guild
        const crisisSettings = await checkCrisisDetectionSettings(
            message.author.id,
            message.guild?.id || 'DM',
            client.db
        )

        if (!crisisSettings.enabled) {
            // Silently skip crisis detection if disabled
            return null
        }

        // Log that we are checking this message
        log(`Checking message from ${message.author.username} for crisis indicators`, 'debug')

        // Perform initial keyword screening to avoid unnecessary AI calls
        const keywordCheck = checkCrisisKeywords(message.content)

        // Debug logging for keywords
        if (keywordCheck.hasKeywords || keywordCheck.hasPatterns) {
            log(`Crisis keywords or patterns detected: ${JSON.stringify(keywordCheck)}`, 'debug')
        }

        // Only proceed with AI analysis if we have potential crisis indicators
        if (!keywordCheck.hasKeywords && !keywordCheck.hasPatterns) {
            return null
        }

        // Analyze message content for crisis indicators
        const analysis = await analyzeMessageContent(message.content)
        log(`Crisis AI analysis completed: ${analysis.crisisLevel}`, 'debug')

        // Combine analyses
        const combinedAnalysis = {
            ...analysis,
            hasKeywords: keywordCheck.hasKeywords,
            hasPatterns: keywordCheck.hasPatterns,
            keywords: keywordCheck.keywords,
            patterns: keywordCheck.patterns,
            keywordConfidence: keywordCheck.confidence,
            crisisLevel:
                keywordCheck.hasPatterns && keywordCheck.confidence === 'high' ? 'critical' : analysis.crisisLevel
        }

        // Log the combined analysis for debugging
        log(`Combined crisis analysis: ${combinedAnalysis.crisisLevel}`, 'debug')

        // Check if intervention is needed based on improved criteria
        const needsSupport =
            requiresImmediateIntervention(combinedAnalysis) ||
            (keywordCheck.hasPatterns && keywordCheck.confidence !== 'low')

        if (needsSupport) {
            log(`Crisis intervention needed for ${message.author.username}`, 'warn')

            // Log the crisis event to the database
            const crisisEvent = await logCrisisEvent(message.author.id, combinedAnalysis, message.content, client.db)

            // Generate crisis response based on analysis
            const isDM = !message.guild
            const response = generateCrisisResponse(combinedAnalysis, client, isDM)

            // Send moderator alert if in a guild and moderator alerts are enabled
            let modAlertSent = false
            if (message.guild && response.modAlert) {
                modAlertSent = await sendModeratorAlert(
                    message.guild.id,
                    message.author.id,
                    combinedAnalysis,
                    message.content,
                    client,
                    client.db
                )

                if (modAlertSent) {
                    log(`Crisis mod alert sent for ${message.author.username} in ${message.guild.name}`, 'info')
                }
            }

            // Return crisis result with actions taken
            return {
                analysis: combinedAnalysis,
                needsSupport: true,
                response,
                actions: {
                    logged: !!crisisEvent,
                    modAlertSent,
                    dmSent: false, // This will be set by the calling code if a DM is sent
                    requiresImmediate: response.immediate
                }
            }
        }

        return { analysis: combinedAnalysis, needsSupport: false }
    } catch (error) {
        console.error('Error handling message crisis:', error)
        return null
    }
}

/**
 * Send crisis response to user
 * @param {Object} message - Discord message object
 * @param {Object} response - Crisis response configuration
 * @param {Object} client - Discord client
 */
async function sendCrisisResponse(message, response, client) {
    try {
        // Start typing indicator
        await message.channel.sendTyping()

        const responseData = {
            content: response.message,
            allowedMentions: { repliedUser: true }
        }

        // Add resources embed if available
        if (response.resources && response.resources.length > 0) {
            responseData.embeds = [
                new client.Gateway.EmbedBuilder()
                    .setTitle('Support Resources')
                    .setDescription(response.resources.join('\n'))
                    .setColor(response.color)
                    .setFooter({ text: client.footer, iconURL: client.logo })
            ]
        }

        await message.reply(responseData)
        log(`Crisis response sent to ${message.author.username}`, 'info')
    } catch (error) {
        console.error('Error sending crisis response:', error)
    }
}

/**
 * Send mod alert for crisis situations
 * @param {Object} message - Discord message object
 * @param {Object} analysis - Crisis analysis result
 * @param {Object} client - Discord client
 */
export async function sendCrisisModAlert(message, analysis, client) {
    try {
        if (!message.guild) return // No mod alerts for DMs

        // Get guild settings to check if crisis alerts are enabled
        const guild = await client.db.guilds.findById(message.guild.id)
        if (!guild || !guild.enableCrisisAlerts) {
            log(`Crisis alerts disabled for guild ${message.guild.id}`, 'debug')
            return
        }

        const modChannelId = guild.modAlertChannelId
        if (!modChannelId) {
            log(`No crisis alert channel configured for guild ${message.guild.id}`, 'debug')
            return
        }

        const modChannel = await client.channels.fetch(modChannelId).catch(() => null)
        if (!modChannel) {
            log(`Crisis alert channel not found: ${modChannelId}`, 'error')
            return
        }

        // Process analysis object if needed (ensure it's an object if it came as JSON)
        let analysisObj = analysis
        if (typeof analysis === 'string') {
            try {
                analysisObj = JSON.parse(analysis)
            } catch (e) {
                // Keep as is if it's not valid JSON
                analysisObj = { crisisLevel: 'unknown' }
            }
        }

        const alertEmbed = new client.Gateway.EmbedBuilder()
            .setTitle('🚨 Crisis Alert Detected')
            .setDescription(
                `**User:** <@${message.author.id}>\n` +
                    `**Channel:** ${message.channel.toString()}\n` +
                    `**Crisis Level:** ${analysisObj.crisisLevel?.toUpperCase() || 'UNKNOWN'}\n\n` +
                    `**Message:** ${message.content.substring(0, 1000)}${message.content.length > 1000 ? '...' : ''}`
            )
            .setColor(analysisObj.crisisLevel === 'critical' ? client.colors.error : client.colors.warning)
            .setTimestamp()
            .setFooter({ text: client.footer, iconURL: client.logo })

        // Add concern areas if available
        if (analysisObj.concernAreas && analysisObj.concernAreas.length > 0) {
            const concerns = analysisObj.concernAreas
                .slice(0, 3) // Limit to top 3 concerns
                .map(area => `${area.area} (${area.level})`)
                .join(', ')

            alertEmbed.addFields({
                name: 'Areas of Concern',
                value: concerns,
                inline: false
            })
        }

        await modChannel.send({ embeds: [alertEmbed] })
        log(`Crisis mod alert sent for ${message.author.username}`, 'info')
    } catch (error) {
        console.error('Error sending crisis mod alert:', error)
    }
}
