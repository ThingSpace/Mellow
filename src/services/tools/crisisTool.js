import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Support intensity levels for response scaling
 */
const SUPPORT_LEVELS = {
    STABLE: 'safe',
    MILD: 'low',
    MODERATE: 'medium',
    ELEVATED: 'high',
    URGENT: 'critical'
}

/**
 * Severity levels for crisis intervention
 */
const SEVERITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
}

/**
 * Crisis categories for specific concerns
 */
const CRISIS_CATEGORIES = {
    SELF_HARM: 'self_harm',
    VIOLENCE: 'violence',
    HARASSMENT: 'harassment',
    HATE: 'hate',
    SEXUAL: 'sexual',
    MINORS: 'minors'
}

/**
 * Analyzes message content for signs of distress or crisis.
 * @param {string} message - The message to analyze.
 * @returns {Promise<object>} - Detailed support needs analysis.
 */
export async function analyzeMessageContent(message) {
    try {
        const response = await openai.moderations.create({
            input: message
        })

        const result = response.results[0]

        // Enhance the result with support needs analysis
        const enhancedResult = {
            ...result,
            supportLevel: determineSupportLevel(result),
            recommendedAction: determineSupportAction(result),
            concernAreas: identifyConcernAreas(result),
            confidence: result.category_scores,
            crisisLevel: determineSeverityLevel(result)
        }

        return enhancedResult
    } catch (error) {
        console.error('Support analysis error:', error)
        // Return a safe default result if analysis fails
        return {
            flagged: false,
            supportLevel: SUPPORT_LEVELS.STABLE,
            crisisLevel: SEVERITY_LEVELS.LOW,
            recommendedAction: 'monitor',
            concernAreas: [],
            confidence: {},
            error: 'Support analysis temporarily unavailable'
        }
    }
}

/**
 * Determines severity level based on analysis results
 * @param {object} result - Analysis result
 * @returns {string} - Severity level
 */
function determineSeverityLevel(result) {
    const scores = result.category_scores

    if (
        scores['self-harm'] > 0.8 ||
        scores['self-harm/intent'] > 0.8 ||
        scores['self-harm/instructions'] > 0.8 ||
        scores['violence'] > 0.8
    ) {
        return SEVERITY_LEVELS.CRITICAL
    }

    if (
        scores['self-harm'] > 0.6 ||
        scores['self-harm/intent'] > 0.6 ||
        scores['self-harm/instructions'] > 0.6 ||
        scores['violence'] > 0.6
    ) {
        return SEVERITY_LEVELS.HIGH
    }

    if (
        scores['self-harm'] > 0.4 ||
        scores['self-harm/intent'] > 0.4 ||
        scores['self-harm/instructions'] > 0.4 ||
        scores['violence'] > 0.4
    ) {
        return SEVERITY_LEVELS.MEDIUM
    }

    return SEVERITY_LEVELS.LOW
}

/**
 * Determines appropriate support level based on analysis results
 * @param {object} result - Analysis result
 * @returns {string} - Support intensity level
 */
function determineSupportLevel(result) {
    const scores = result.category_scores

    // Check for urgent support needs
    if (scores['self-harm'] > 0.9 || scores['self-harm/intent'] > 0.9 || scores['self-harm/instructions'] > 0.9) {
        return SUPPORT_LEVELS.URGENT
    }

    // Check for elevated risk combinations
    if (
        scores['self-harm'] > 0.7 ||
        scores['self-harm/intent'] > 0.7 ||
        scores['self-harm/instructions'] > 0.7 ||
        scores['violence'] > 0.8
    ) {
        return SUPPORT_LEVELS.ELEVATED
    }

    // Check for moderate support needs
    if (
        scores['self-harm'] > 0.5 ||
        scores['self-harm/intent'] > 0.5 ||
        scores['self-harm/instructions'] > 0.5 ||
        scores['violence'] > 0.6 ||
        scores['harassment'] > 0.7
    ) {
        return SUPPORT_LEVELS.MODERATE
    }

    // Check for mild support needs
    if (
        scores['self-harm'] > 0.3 ||
        scores['self-harm/intent'] > 0.3 ||
        scores['self-harm/instructions'] > 0.3 ||
        scores['violence'] > 0.4 ||
        scores['harassment'] > 0.5
    ) {
        return SUPPORT_LEVELS.MILD
    }

    return SUPPORT_LEVELS.STABLE
}

/**
 * Determines recommended support action based on analysis
 * @param {object} result - Analysis result
 * @returns {string} - Recommended support action
 */
function determineSupportAction(result) {
    const supportLevel = determineSupportLevel(result)

    switch (supportLevel) {
        case SUPPORT_LEVELS.URGENT:
            return 'immediate_support'
        case SUPPORT_LEVELS.ELEVATED:
            return 'escalated_support'
        case SUPPORT_LEVELS.MODERATE:
            return 'active_support'
        case SUPPORT_LEVELS.MILD:
            return 'gentle_support'
        default:
            return 'monitor'
    }
}

/**
 * Identifies areas of concern from analysis results
 * @param {object} result - Analysis result
 * @returns {Array} - Array of concern areas with severity
 */
function identifyConcernAreas(result) {
    const concerns = []
    const threshold = 0.3 // Minimum score to consider as a concern

    for (const [category, score] of Object.entries(result.category_scores)) {
        if (score > threshold) {
            concerns.push({
                area: category,
                intensity: score,
                level: score > 0.8 ? 'high' : score > 0.6 ? 'moderate' : 'mild'
            })
        }
    }

    return concerns.sort((a, b) => b.intensity - a.intensity)
}

/**
 * Check if message requires immediate crisis intervention
 * @param {object} moderationResult - Enhanced moderation result
 * @returns {boolean} - Whether immediate intervention is needed
 */
export function requiresImmediateIntervention(moderationResult) {
    return (
        moderationResult.crisisLevel === SEVERITY_LEVELS.CRITICAL ||
        (moderationResult.crisisLevel === SEVERITY_LEVELS.HIGH &&
            moderationResult.concernAreas.some(area => area.area === CRISIS_CATEGORIES.SELF_HARM))
    )
}

/**
 * Generate crisis response based on severity level
 * @param {object} moderationResult - Enhanced moderation result
 * @param {object} client - Discord client instance
 * @returns {object} - Response configuration
 */
export function generateCrisisResponse(moderationResult, client) {
    const { crisisLevel } = moderationResult

    const responses = {
        [SEVERITY_LEVELS.CRITICAL]: {
            immediate: true,
            message:
                "I'm concerned about what you've shared. Your safety is important. Please consider reaching out to a crisis hotline or trusted person in your life. You're not alone, and there are people who want to help.",
            resources: [
                'National Suicide Prevention Lifeline: 988',
                'Crisis Text Line: Text HOME to 741741',
                'Emergency Services: 911'
            ],
            modAlert: true,
            color: client.colors.error || 0xff0000
        },
        [SEVERITY_LEVELS.HIGH]: {
            immediate: true,
            message:
                "I hear that you're going through something difficult. It's okay to not be okay, and it's brave to reach out. Would you like to talk about what's on your mind?",
            resources: ['Crisis Text Line: Text HOME to 741741', 'Talk to a trusted friend or family member'],
            modAlert: true,
            color: client.colors.warning || 0xffa500
        },
        [SEVERITY_LEVELS.MEDIUM]: {
            immediate: false,
            message:
                "I notice you might be having a tough time. Remember that it's okay to ask for help when you need it. Is there anything I can do to support you right now?",
            resources: [],
            modAlert: false,
            color: client.colors.primary || 0x0099ff
        },
        [SEVERITY_LEVELS.LOW]: {
            immediate: false,
            message: "I'm here to listen if you need to talk. Sometimes just sharing what's on your mind can help.",
            resources: [],
            modAlert: false,
            color: client.colors.primary || 0x0099ff
        }
    }

    return responses[crisisLevel] || responses[SEVERITY_LEVELS.LOW]
}

/**
 * Check for crisis keywords in addition to AI moderation
 * @param {string} message - Message to check
 * @returns {object} - Crisis keyword analysis
 */
export function checkCrisisKeywords(message) {
    const lowerMessage = message.toLowerCase()

    const crisisKeywords = {
        self_harm: ['kill myself', 'end it all', 'want to die', 'suicide', 'self harm', 'cut myself'],
        violence: ['hurt someone', 'attack', 'fight', 'violent'],
        emergency: ['emergency', 'urgent', 'help me', 'desperate']
    }

    const foundKeywords = {}

    for (const [category, keywords] of Object.entries(crisisKeywords)) {
        const found = keywords.filter(keyword => lowerMessage.includes(keyword))
        if (found.length > 0) {
            foundKeywords[category] = found
        }
    }

    return {
        hasKeywords: Object.keys(foundKeywords).length > 0,
        keywords: foundKeywords,
        severity: foundKeywords.emergency ? 'high' : foundKeywords.self_harm ? 'medium' : 'low'
    }
}

/**
 * Log a crisis event to the database
 * @param {string} userId - Discord user ID
 * @param {object} analysis - Crisis analysis result
 * @param {string} message - Original message content
 * @param {object} db - Database client
 * @returns {Promise<object>} - Created crisis event
 */
export async function logCrisisEvent(userId, analysis, message, db) {
    try {
        const details = {
            severity: analysis.crisisLevel || analysis.severity || 'unknown',
            supportLevel: analysis.supportLevel || 'unknown',
            concernAreas: analysis.concernAreas || [],
            keywords: analysis.keywords || {},
            messagePreview: message.substring(0, 200) + (message.length > 200 ? '...' : ''),
            escalated: analysis.crisisLevel === 'critical' || analysis.severity === 'high'
        }

        const crisisEvent = await db.crisisEvents.create({
            userId: userId,
            details: JSON.stringify(details),
            escalated: details.escalated
        })

        console.log(`Crisis event logged for user ${userId}: ${details.severity} severity`)
        return crisisEvent
    } catch (error) {
        console.error('Failed to log crisis event:', error)
        throw error
    }
}

/**
 * Get recent crisis events for a user
 * @param {string} userId - Discord user ID
 * @param {object} db - Database client
 * @param {number} limit - Number of events to retrieve
 * @returns {Promise<Array>} - Array of crisis events
 */
export async function getRecentCrisisEvents(userId, db, limit = 5) {
    try {
        return await db.crisisEvents.getAllForUser(userId, limit)
    } catch (error) {
        console.error('Failed to get crisis events:', error)
        return []
    }
}

/**
 * Send crisis alert to server moderators
 * @param {string} guildId - Discord guild ID
 * @param {string} userId - Discord user ID
 * @param {object} analysis - Crisis analysis result
 * @param {string} message - Original message content
 * @param {object} client - Discord client
 * @param {object} db - Database client
 * @returns {Promise<boolean>} - Whether alert was sent successfully
 */
export async function sendModeratorAlert(guildId, userId, analysis, message, client, db) {
    try {
        // Get guild settings
        const guild = await db.guilds.findById(guildId)
        if (!guild || !guild.enableCrisisAlerts) {
            console.log(`Crisis alerts disabled for guild ${guildId}`)
            return false
        }

        // Get user info
        const user = await db.users.findById(userId)
        const username = user?.username || 'Unknown User'

        // Get alert channel
        const alertChannelId = guild.modAlertChannelId
        if (!alertChannelId) {
            console.log(`No mod alert channel configured for guild ${guildId}`)
            return false
        }

        const channel = client.channels.cache.get(alertChannelId)
        if (!channel) {
            console.error(`Mod alert channel not found: ${alertChannelId}`)
            return false
        }

        // Create alert embed
        const embed = {
            title: '🚨 Crisis Alert Detected',
            description: `A potential crisis situation has been detected for user **${username}** (<@${userId}>)`,
            color: analysis.crisisLevel === 'critical' ? 0xff0000 : 0xffa500,
            fields: [
                {
                    name: 'Severity Level',
                    value: analysis.crisisLevel.toUpperCase(),
                    inline: true
                },
                {
                    name: 'Support Level',
                    value: analysis.supportLevel.toUpperCase(),
                    inline: true
                },
                {
                    name: 'Message Preview',
                    value: message.length > 200 ? message.substring(0, 200) + '...' : message,
                    inline: false
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Please check on this user and provide appropriate support'
            }
        }

        // Add concern areas if any
        if (analysis.concernAreas && analysis.concernAreas.length > 0) {
            const concerns = analysis.concernAreas.map(area => `${area.area} (${area.level})`).join(', ')
            embed.fields.push({
                name: 'Areas of Concern',
                value: concerns,
                inline: false
            })
        }

        // Add user history if available
        const recentEvents = await getRecentCrisisEvents(userId, db, 3)
        if (recentEvents.length > 0) {
            embed.fields.push({
                name: 'Recent Crisis Events',
                value: `${recentEvents.length} events in the last 30 days`,
                inline: true
            })
        }

        await channel.send({ embeds: [embed] })
        console.log(`Crisis alert sent to guild ${guildId} for user ${userId}`)
        return true
    } catch (error) {
        console.error('Failed to send moderator alert:', error)
        return false
    }
}

/**
 * Send supportive DM to user in crisis
 * @param {string} userId - Discord user ID
 * @param {object} analysis - Crisis analysis result
 * @param {object} client - Discord client
 * @param {object} db - Database client
 * @returns {Promise<boolean>} - Whether DM was sent successfully
 */
export async function sendSupportiveDM(userId, analysis, client, db) {
    try {
        const user = await client.users.fetch(userId)
        if (!user) {
            console.error(`User not found: ${userId}`)
            return false
        }

        // Get user's recent crisis history
        const recentEvents = await getRecentCrisisEvents(userId, db, 5)
        const hasRecentEvents = recentEvents.length > 0

        // Create supportive message based on severity
        let message = ''
        let resources = []

        switch (analysis.crisisLevel) {
            case 'critical':
                message = `Hi there. I noticed you might be going through something really difficult right now. I want you to know that your feelings are valid and you're not alone. 

Your safety is the most important thing. Please consider reaching out to one of these resources:`
                resources = [
                    '**988** - National Suicide Prevention Lifeline (24/7)',
                    '**Text HOME to 741741** - Crisis Text Line',
                    '**911** - Emergency Services',
                    'A trusted friend, family member, or mental health professional'
                ]
                break

            case 'high':
                message = `Hi there. I noticed you might be having a tough time, and I want you to know that it's okay to not be okay. 

It's really brave of you to reach out, even if it's just through messages. Would you like to talk about what's on your mind? I'm here to listen.`
                resources = [
                    '**Text HOME to 741741** - Crisis Text Line',
                    'Talk to a trusted friend or family member',
                    'Consider reaching out to a mental health professional'
                ]
                break

            case 'medium':
                message = `Hi there. I noticed you might be going through something difficult. 

Remember that it's completely okay to ask for help when you need it. Is there anything I can do to support you right now?`
                resources = [
                    'Talk to a trusted friend or family member',
                    'Consider reaching out to a mental health professional'
                ]
                break

            default:
                message = `Hi there. I'm here to listen if you need to talk. Sometimes just sharing what's on your mind can help.`
                resources = []
        }

        // Add personalized note if they have recent crisis events
        if (hasRecentEvents) {
            message += `\n\nI've noticed you've been going through some difficult times recently. Please know that it's okay to reach out for help, and there are people who care about you and want to support you.`
        }

        // Add resources if any
        if (resources.length > 0) {
            message += `\n\n**Resources that might help:**\n${resources.join('\n')}`
        }

        // Add closing
        message += `\n\nYou're not alone, and your feelings matter. Take care of yourself. 💙`

        await user.send(message)
        console.log(`Supportive DM sent to user ${userId}`)
        return true
    } catch (error) {
        console.error('Failed to send supportive DM:', error)
        return false
    }
}

/**
 * Get crisis statistics for a user
 * @param {string} userId - Discord user ID
 * @param {object} db - Database client
 * @returns {Promise<object>} - Crisis statistics
 */
export async function getCrisisStats(userId, db) {
    try {
        const allEvents = await db.crisisEvents.getAllForUser(userId, 100)

        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        const recentEvents = allEvents.filter(event => new Date(event.detectedAt) > thirtyDaysAgo)

        const escalatedEvents = allEvents.filter(event => event.escalated)
        const recentEscalated = recentEvents.filter(event => event.escalated)

        return {
            totalEvents: allEvents.length,
            recentEvents: recentEvents.length,
            escalatedEvents: escalatedEvents.length,
            recentEscalated: recentEscalated.length,
            lastEvent: allEvents[0]?.detectedAt || null,
            trend: recentEvents.length > 5 ? 'increasing' : recentEvents.length < 2 ? 'decreasing' : 'stable'
        }
    } catch (error) {
        console.error('Failed to get crisis stats:', error)
        return {
            totalEvents: 0,
            recentEvents: 0,
            escalatedEvents: 0,
            recentEscalated: 0,
            lastEvent: null,
            trend: 'unknown'
        }
    }
}

/**
 * Comprehensive crisis management function
 * @param {string} userId - Discord user ID
 * @param {string} guildId - Discord guild ID
 * @param {string} message - User's message
 * @param {object} client - Discord client
 * @param {object} db - Database client
 * @returns {Promise<object>} - Crisis management result
 */
export async function handleCrisis(userId, guildId, message, client, db) {
    try {
        // Analyze the message
        const analysis = await analyzeMessageContent(message)
        const keywordCheck = checkCrisisKeywords(message)

        // Combine AI analysis with keyword detection
        const combinedAnalysis = {
            ...analysis,
            hasKeywords: keywordCheck.hasKeywords,
            keywords: keywordCheck.keywords,
            // Escalate if keywords are found
            crisisLevel: keywordCheck.severity === 'high' ? 'critical' : analysis.crisisLevel
        }

        // Log the crisis event
        const crisisEvent = await logCrisisEvent(userId, combinedAnalysis, message, db)

        // Determine actions based on severity
        const actions = {
            logged: true,
            modAlertSent: false,
            dmSent: false,
            requiresImmediate: requiresImmediateIntervention(combinedAnalysis)
        }

        // Send moderator alert for high/critical severity
        if (combinedAnalysis.crisisLevel === 'critical' || combinedAnalysis.crisisLevel === 'high') {
            actions.modAlertSent = await sendModeratorAlert(guildId, userId, combinedAnalysis, message, client, db)
        }

        // Send supportive DM for medium and above
        if (
            combinedAnalysis.crisisLevel === 'medium' ||
            combinedAnalysis.crisisLevel === 'high' ||
            combinedAnalysis.crisisLevel === 'critical'
        ) {
            actions.dmSent = await sendSupportiveDM(userId, combinedAnalysis, client, db)
        }

        // Get crisis statistics
        const stats = await getCrisisStats(userId, db)

        return {
            crisisEvent,
            analysis: combinedAnalysis,
            actions,
            stats,
            response: generateCrisisResponse(combinedAnalysis, client)
        }
    } catch (error) {
        console.error('Failed to handle crisis:', error)
        throw error
    }
}
