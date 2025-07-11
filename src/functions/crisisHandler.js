import {
    analyzeMessageContent,
    requiresImmediateIntervention,
    generateCrisisResponse,
    checkCrisisKeywords,
    handleCrisis,
    checkCrisisDetectionSettings
} from '../services/tools/crisisTool.js'

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

        // Perform initial keyword screening to avoid unnecessary AI calls
        const keywordCheck = checkCrisisKeywords(message.content)

        // Only proceed with AI analysis if we have potential crisis indicators
        if (!keywordCheck.hasKeywords && !keywordCheck.hasPatterns) {
            return null
        }

        // Analyze message content for crisis indicators
        const analysis = await analyzeMessageContent(message.content)

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

        // Check if intervention is needed based on improved criteria
        const needsSupport =
            requiresImmediateIntervention(combinedAnalysis) ||
            (keywordCheck.hasPatterns && keywordCheck.confidence !== 'low')

        if (needsSupport) {
            // Handle crisis through comprehensive crisis management
            const crisisResult = await handleCrisis(
                message.author.id,
                message.guild?.id || 'DM',
                message.content,
                client,
                client.db
            )

            // Send immediate response if needed and allowed
            if (crisisResult.response.immediate && crisisResult.actions.dmSent !== false) {
                await sendCrisisResponse(message, crisisResult.response, client)
            }

            return crisisResult
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
            console.log(`Crisis alerts disabled for guild ${message.guild.id}`)
            return
        }

        const modChannelId = guild.modAlertChannelId
        if (!modChannelId) {
            console.log(`No crisis alert channel configured for guild ${message.guild.id}`)
            return
        }

        const modChannel = await client.channels.fetch(modChannelId).catch(() => null)
        if (!modChannel) {
            console.error(`Crisis alert channel not found: ${modChannelId}`)
            return
        }

        const alertEmbed = new client.Gateway.EmbedBuilder()
            .setTitle('🚨 Crisis Alert Detected')
            .setDescription(
                `**User:** <@${message.author.id}>\n` +
                    `**Channel:** ${message.channel.toString()}\n` +
                    `**Crisis Level:** ${analysis.crisisLevel?.toUpperCase() || 'UNKNOWN'}\n\n` +
                    `**Message:** ${message.content.substring(0, 1000)}${message.content.length > 1000 ? '...' : ''}`
            )
            .setColor(analysis.crisisLevel === 'critical' ? client.colors.error : client.colors.warning)
            .setTimestamp()
            .setFooter({ text: client.footer, iconURL: client.logo })

        // Add concern areas if available
        if (analysis.concernAreas && analysis.concernAreas.length > 0) {
            const concerns = analysis.concernAreas
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
    } catch (error) {
        console.error('Error sending crisis mod alert:', error)
    }
}
