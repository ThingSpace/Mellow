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
 * Significantly raised thresholds to reduce false positives
 * @param {object} result - Analysis result
 * @returns {string} - Severity level
 */
function determineSeverityLevel(result) {
    const scores = result.category_scores

    // Critical: Extremely high confidence of immediate danger (raised from 0.9 to 0.95)
    if (
        scores['self-harm'] > 0.95 ||
        scores['self-harm/intent'] > 0.95 ||
        scores['self-harm/instructions'] > 0.95 ||
        scores['violence'] > 0.95
    ) {
        return SEVERITY_LEVELS.CRITICAL
    }

    // High: Very high confidence of concerning content (raised from 0.75 to 0.85)
    if (
        scores['self-harm'] > 0.85 ||
        scores['self-harm/intent'] > 0.85 ||
        scores['self-harm/instructions'] > 0.85 ||
        scores['violence'] > 0.9
    ) {
        return SEVERITY_LEVELS.HIGH
    }

    // Medium: High confidence of concerning content (raised from 0.6 to 0.75)
    if (
        scores['self-harm'] > 0.75 ||
        scores['self-harm/intent'] > 0.75 ||
        scores['self-harm/instructions'] > 0.75 ||
        scores['violence'] > 0.8
    ) {
        return SEVERITY_LEVELS.MEDIUM
    }

    return SEVERITY_LEVELS.LOW
}

/**
 * Determines appropriate support level based on analysis results
 * Significantly raised thresholds to reduce false positives
 * @param {object} result - Analysis result
 * @returns {string} - Support intensity level
 */
function determineSupportLevel(result) {
    const scores = result.category_scores

    // Check for urgent support needs (extremely high confidence) - raised from 0.95 to 0.98
    if (scores['self-harm'] > 0.98 || scores['self-harm/intent'] > 0.98 || scores['self-harm/instructions'] > 0.98) {
        return SUPPORT_LEVELS.URGENT
    }

    // Check for elevated risk combinations - raised thresholds significantly
    if (
        scores['self-harm'] > 0.9 ||
        scores['self-harm/intent'] > 0.9 ||
        scores['self-harm/instructions'] > 0.9 ||
        scores['violence'] > 0.95
    ) {
        return SUPPORT_LEVELS.ELEVATED
    }

    // Check for moderate support needs - raised thresholds
    if (
        scores['self-harm'] > 0.8 ||
        scores['self-harm/intent'] > 0.8 ||
        scores['self-harm/instructions'] > 0.8 ||
        scores['violence'] > 0.85 ||
        scores['harassment'] > 0.9
    ) {
        return SUPPORT_LEVELS.MODERATE
    }

    // Check for mild support needs - raised thresholds
    if (
        scores['self-harm'] > 0.7 ||
        scores['self-harm/intent'] > 0.7 ||
        scores['self-harm/instructions'] > 0.7 ||
        scores['violence'] > 0.75 ||
        scores['harassment'] > 0.8
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
 * Raised thresholds to reduce false positives
 * @param {object} result - Analysis result
 * @returns {Array} - Array of concern areas with severity
 */
function identifyConcernAreas(result) {
    const concerns = []
    const threshold = 0.6 // Raised from 0.3 to 0.6 - only show higher confidence concerns

    for (const [category, score] of Object.entries(result.category_scores)) {
        if (score > threshold) {
            concerns.push({
                area: category,
                intensity: score,
                level: score > 0.9 ? 'high' : score > 0.8 ? 'moderate' : 'mild' // Raised thresholds
            })
        }
    }

    return concerns.sort((a, b) => b.intensity - a.intensity)
}

/**
 * Check if message requires immediate crisis intervention
 * Less conservative approach to ensure crisis events are caught
 * @param {object} moderationResult - Enhanced moderation result
 * @returns {boolean} - Whether immediate intervention is needed
 */
export function requiresImmediateIntervention(moderationResult) {
    // Intervene for critical situations
    if (moderationResult.crisisLevel === SEVERITY_LEVELS.CRITICAL) {
        return true
    }

    // Also intervene for high-level cases with supporting evidence
    if (
        moderationResult.crisisLevel === SEVERITY_LEVELS.HIGH &&
        (moderationResult.hasPatterns || moderationResult.hasKeywords)
    ) {
        return true
    }

    // Intervene on keyword patterns for immediate crisis
    if (
        moderationResult.hasPatterns &&
        (moderationResult.patterns?.immediate_crisis || moderationResult.patterns?.method_specific)
    ) {
        return true
    }

    // Consider direct self-harm keywords as requiring intervention
    if (
        moderationResult.hasKeywords &&
        moderationResult.keywords?.self_harm_direct &&
        moderationResult.keywords.self_harm_direct.length > 0
    ) {
        return true
    }

    return false
}

/**
 * Generate crisis response based on severity level and context
 * @param {object} moderationResult - Enhanced moderation result
 * @param {object} client - Discord client instance
 * @param {boolean} isDM - Whether this is a DM conversation
 * @returns {object} - Response configuration
 */
export function generateCrisisResponse(moderationResult, client, isDM = false) {
    const { crisisLevel } = moderationResult

    // For DMs, use gentler responses that ask before overwhelming
    if (isDM) {
        const dmResponses = {
            [SEVERITY_LEVELS.CRITICAL]: {
                immediate: true,
                message:
                    "I'm really concerned about what you've shared with me. I care about your safety and wellbeing. Would it be helpful if I shared some crisis resources with you, or would you prefer to just talk first?",
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
                    "I can tell you're going through something really difficult right now. I'm here to listen. Would you like me to share some support resources, or do you just need someone to talk to?",
                resources: ['Crisis Text Line: Text HOME to 741741', 'National Suicide Prevention Lifeline: 988'],
                modAlert: true,
                color: client.colors.warning || 0xffa500
            },
            [SEVERITY_LEVELS.MEDIUM]: {
                immediate: false,
                message:
                    "It sounds like you're having a tough time. I'm here if you need to talk about it. Would you like some coping tools, or would you prefer to just share what's on your mind?",
                resources: [],
                modAlert: false,
                color: client.colors.info || 0x0099ff
            },
            [SEVERITY_LEVELS.LOW]: {
                immediate: false,
                message:
                    "I'm sorry you're dealing with this. Would you like to talk about what's going on, or is there something specific I can help you with?",
                resources: [],
                modAlert: false,
                color: client.colors.success || 0x00ff00
            }
        }

        return dmResponses[crisisLevel] || dmResponses[SEVERITY_LEVELS.LOW]
    }

    // Original guild responses for public channels
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
 * Completely redesigned to avoid false positives from generic help requests
 * @param {string} message - Message to check
 * @returns {object} - Crisis keyword analysis
 */
export function checkCrisisKeywords(message) {
    const lowerMessage = message.toLowerCase()

    // Very specific crisis keywords that indicate actual crisis situations
    const crisisKeywords = {
        // Direct statements of self-harm intent
        self_harm_direct: [
            'kill myself',
            'end my life',
            'want to die',
            'suicide',
            'suicidal',
            'self harm',
            'cut myself',
            'hurt myself',
            'end it all',
            'not worth living',
            'better off dead',
            'going to kill myself',
            'planning to die',
            "don't want to be alive",
            'want to be dead',
            'rather be dead',
            'take my own life',
            'ending my life'
        ],
        // Violence against others
        violence_direct: [
            'kill someone',
            'hurt someone else',
            'attack someone',
            'violent thoughts about',
            'planning to hurt',
            'going to attack'
        ],
        // Immediate danger indicators (very specific)
        immediate_danger: [
            'tonight i will',
            'today i am going to',
            'right now i want to die',
            'have the pills',
            'wrote my note',
            'goodbye world',
            'this is the end',
            "can't go on anymore",
            'ready to end it',
            'last message',
            "won't be here tomorrow",
            'my final goodbye',
            'no longer able to cope',
            'too painful to continue'
        ]
    }

    // Exclude generic help-seeking that should NOT trigger crisis detection
    const genericHelpPatterns = [
        /\bhelp me\b(?!\s+(die|kill|hurt))/i, // "help me" unless followed by crisis words
        /\bneed help\b(?!\s+(dying|ending))/i, // "need help" unless crisis context
        /\bcan someone help\b/i,
        /\bplease help\b(?!\s+(me die|me end))/i,
        /\bhelp with\b/i, // "help with homework", etc.
        /\bhelp finding\b/i,
        /\bhelp understanding\b/i,
        /\bhelp.*homework\b/i,
        /\bhelp.*game\b/i,
        /\bhelp.*computer\b/i,
        /\bhelp.*phone\b/i,
        /\btechnical help\b/i,
        /\bmath help\b/i,
        /\bschool help\b/i
    ]

    // Check for generic help patterns - if found, skip crisis detection
    for (const pattern of genericHelpPatterns) {
        if (pattern.test(message)) {
            return {
                hasKeywords: false,
                hasPatterns: false,
                keywords: {},
                patterns: {},
                severity: 'none',
                confidence: 'none',
                skipped: 'generic_help_request'
            }
        }
    }

    // Context-aware patterns that require specific crisis context
    const contextualPatterns = {
        self_harm_intent: [
            /\b(want to|going to|might|will|plan to).{0,30}(kill myself|end my life|hurt myself|die tonight|end it all)\b/i,
            /\b(thinking about|thoughts of).{0,20}(suicide|killing myself|ending it all|dying|hurting myself)\b/i,
            /\b(can't|cannot|don't want to).{0,20}(go on|take it anymore|live like this|be here anymore|continue|keep going)\b/i,
            /\b(ready to|about to|plan to|going to).{0,20}(kill myself|end my life|hurt myself|give up|end everything)\b/i,
            /\bi (hate|don't want) (my life|to live|being alive|existing)\b/i,
            /\bno (reason|point) (to live|in living|in continuing)\b/i
        ],
        immediate_crisis: [
            /\b(tonight|today|right now|this moment|soon).{0,30}(kill myself|end it|hurt myself|die|won't be here)\b/i,
            /\b(have a plan|ready to|about to|prepared to).{0,20}(kill myself|end my life|hurt myself|die|leave forever)\b/i,
            /\b(goodbye|this is it|the end|farewell|last time).{0,30}(everyone|world|life|forever)\b/i,
            /\bi've (decided|made up my mind|chosen) to (end|kill|hurt)\b/i,
            /\bthis (pain|suffering|misery) (ends|stops) (today|tonight|now|soon)\b/i
        ],
        method_specific: [
            /\b(pills|rope|bridge|gun|knife|razor|blade).{0,30}(end it|kill myself|hurt myself|suicide|die)\b/i,
            /\b(overdose|hanging|jumping|cutting|shooting).{0,20}(myself|tonight|today|now|soon)\b/i,
            /\bi('ve| have) (the|my|a) (pills|rope|gun|knife|blade|razor|method)\b/i,
            /\b(swallow|take|use) (all|these|the) pills\b/i,
            /\bjump (off|from) (a|the) (bridge|building|roof|window|balcony)\b/i
        ]
    }

    const foundKeywords = {}
    const foundPatterns = {}

    // Check for keyword matches (only very specific ones)
    for (const [category, keywords] of Object.entries(crisisKeywords)) {
        const found = keywords.filter(keyword => lowerMessage.includes(keyword))
        if (found.length > 0) {
            foundKeywords[category] = found
        }
    }

    // Check for contextual patterns (high confidence indicators)
    for (const [category, patterns] of Object.entries(contextualPatterns)) {
        const matchedPatterns = patterns.filter(pattern => pattern.test(message))
        if (matchedPatterns.length > 0) {
            foundPatterns[category] = matchedPatterns.length
        }
    }

    // Determine severity based on specific indicators only
    let severity = 'none'
    let confidence = 'none'

    if (foundPatterns.immediate_crisis || foundPatterns.method_specific) {
        severity = 'critical'
        confidence = 'high'
    } else if (foundPatterns.self_harm_intent || Object.keys(foundKeywords.self_harm_direct || {}).length > 0) {
        severity = 'high'
        confidence = 'medium'
    } else if (Object.keys(foundKeywords.violence_direct || {}).length > 0) {
        severity = 'medium'
        confidence = 'medium'
    } else if (Object.keys(foundKeywords.immediate_danger || {}).length > 0) {
        severity = 'medium'
        confidence = 'low'
    }

    return {
        hasKeywords: Object.keys(foundKeywords).length > 0,
        hasPatterns: Object.keys(foundPatterns).length > 0,
        keywords: foundKeywords,
        patterns: foundPatterns,
        severity: severity,
        confidence: confidence
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

        // Log for debugging
        console.log(`Logging crisis event for user ${userId}: ${details.severity} severity`)

        // Create the crisis event with the CrisisEvent module
        const crisisEvent = await db.crisisEvents.create({
            userId: userId,
            details: JSON.stringify(details),
            escalated: details.escalated
        })

        return crisisEvent
    } catch (error) {
        console.error('Failed to log crisis event:', error)
        // Try a more direct approach if the module approach fails
        try {
            return await db.prisma.crisisEvent.create({
                data: {
                    userId: BigInt(userId),
                    details: JSON.stringify({
                        severity: analysis.crisisLevel || 'unknown',
                        supportLevel: analysis.supportLevel || 'unknown',
                        messagePreview: message.substring(0, 200) + (message.length > 200 ? '...' : '')
                    }),
                    escalated: analysis.crisisLevel === 'critical'
                }
            })
        } catch (fallbackError) {
            console.error('Fallback crisis event logging also failed:', fallbackError)
            return null
        }
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
        // Try using the module method first
        return await db.crisisEvents.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { detectedAt: 'desc' },
            take: limit
        })
    } catch (error) {
        console.error('Failed to get crisis events through module:', error)
        // Fallback to direct Prisma query
        try {
            const events = await db.prisma.crisisEvent.findMany({
                where: { userId: BigInt(userId) },
                orderBy: { detectedAt: 'desc' },
                take: limit
            })
            return events
        } catch (fallbackError) {
            console.error('Fallback crisis events query also failed:', fallbackError)
            return []
        }
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

        // Get alert channel - used for crisis alerts and serious moderation events
        const alertChannelId = guild.modAlertChannelId
        if (!alertChannelId) {
            console.log(`No crisis alert channel configured for guild ${guildId}`)
            return false
        }

        const channel = await client.channels.fetch(alertChannelId).catch(() => null)
        if (!channel) {
            console.error(`Crisis alert channel not found: ${alertChannelId}`)
            return false
        }

        // Get user info
        let username = 'Unknown User'
        try {
            const user = await client.users.fetch(userId)
            username = user.username
        } catch (error) {
            console.warn(`Could not fetch username for user ID ${userId}`)
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
            const concerns = analysis.concernAreas
                .slice(0, 3)
                .map(area => `${area.area} (${area.level})`)
                .join(', ')

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
                name: 'Recent History',
                value: `This user has had ${recentEvents.length} crisis events recently.`,
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
                message = `Hey, I wanted to reach out because I'm genuinely concerned about you based on what you shared. 

I really care about your wellbeing and safety. I know things might feel overwhelming right now, but you're not alone.

Would it be helpful if I shared some crisis support resources? Or would you prefer to just talk about what's going on? I'm here either way.`
                resources = [
                    '**988** - National Suicide Prevention Lifeline (24/7)',
                    '**Text HOME to 741741** - Crisis Text Line',
                    '**911** - Emergency Services'
                ]
                break

            case 'high':
                message = `Hi there. I noticed you might be going through something really tough right now, and I wanted you to know I'm here for you.

Sometimes it helps just to have someone listen. Would you like to talk about what's on your mind? Or if you'd prefer, I can share some support resources that might help.

Whatever feels right for you - I'm here to listen without judgment.`
                resources = [
                    '**Text HOME to 741741** - Crisis Text Line',
                    '**988** - National Suicide Prevention Lifeline'
                ]
                break

            case 'medium':
                message = `I wanted to check in with you after what you shared. It sounds like you might be having a difficult time.

I'm here if you need someone to talk to. Would you like to share what's going on, or would some gentle coping strategies be more helpful right now?

No pressure either way - just know that you're not alone.`
                resources = []
                break

            default:
                message = `I'm here if you need someone to talk to. Sometimes sharing what's on your mind can help, even if it's just to feel heard.

What would be most helpful for you right now - talking through what's going on, or would you like me to suggest some gentle ways to feel a bit better?`
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
        const allEvents = await db.crisisEventss.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { detectedAt: 'desc' },
            take: 100
        })

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
 * Check if crisis detection is enabled for a user and guild
 * Enhanced to respect more user privacy settings
 * @param {string} userId - Discord user ID
 * @param {string} guildId - Discord guild ID (null for DMs)
 * @param {object} db - Database client
 * @returns {Promise<object>} - Crisis detection settings
 */
export async function checkCrisisDetectionSettings(userId, guildId, db) {
    try {
        // Get user preferences with more detailed settings
        const userPreferences = await db.userPreferences.findById(userId)

        // Default is enabled
        let enabled = true

        // Check user preferences first - user can opt out
        if (userPreferences?.disableCrisisDetection) {
            enabled = false
        }

        // For guild messages, also check guild settings
        if (enabled && guildId && guildId !== 'DM') {
            try {
                const guild = await db.guilds.findById(guildId)
                if (guild && !guild.enableCrisisAlerts) {
                    enabled = false
                }
            } catch (error) {
                console.error(`Error checking guild settings: ${error.message}`)
                // Default to enabled if we can't check guild settings
            }
        }

        return {
            enabled,
            userPreferences: !!userPreferences,
            guildEnabled: guildId !== 'DM'
        }
    } catch (error) {
        console.error(`Error checking crisis detection settings: ${error.message}`)
        // Default to enabled for safety if we can't check settings
        return { enabled: true }
    }
}

/**
 * Check if user can receive crisis support DMs
 * @param {string} userId - Discord user ID
 * @param {object} db - Database client
 * @returns {Promise<boolean>} - Whether user can receive support DMs
 */
export async function canReceiveSupportDMs(userId, db) {
    try {
        const userPreferences = await db.userPreferences.findById(userId)
        // Users can disable receiving support DMs while still allowing detection for others
        return userPreferences?.disableCrisisSupportDMs !== true
    } catch (error) {
        console.error('Error checking support DM settings:', error)
        return true // Default to allowed for safety
    }
}

/**
 * Comprehensive crisis management function with enhanced detection
 * @param {string} userId - Discord user ID
 * @param {string} guildId - Discord guild ID
 * @param {string} message - User's message
 * @param {object} client - Discord client
 * @param {object} db - Database client
 * @returns {Promise<object>} - Crisis management result
 */
export async function handleCrisis(userId, guildId, message, client, db) {
    try {
        // Check if crisis detection is enabled for this user/guild
        const crisisSettings = await checkCrisisDetectionSettings(userId, guildId, db)

        if (!crisisSettings.enabled) {
            console.log(`Crisis detection disabled for user ${userId} in guild ${guildId}: ${crisisSettings.reason}`)
            return {
                crisisEvent: null,
                analysis: { crisisLevel: 'disabled', reason: crisisSettings.reason },
                actions: { logged: false, modAlertSent: false, dmSent: false, requiresImmediate: false },
                stats: await getCrisisStats(userId, db),
                response: { immediate: false, message: '', resources: [] }
            }
        }

        // Perform initial keyword screening
        const keywordCheck = checkCrisisKeywords(message)

        // If generic help request was detected, skip entirely
        if (keywordCheck.skipped) {
            console.log(`Crisis detection skipped for user ${userId}: ${keywordCheck.skipped}`)
            return {
                crisisEvent: null,
                analysis: { crisisLevel: 'skipped', reason: keywordCheck.skipped },
                actions: { logged: false, modAlertSent: false, dmSent: false, requiresImmediate: false },
                stats: await getCrisisStats(userId, db),
                response: { immediate: false, message: '', resources: [] }
            }
        }

        // Always proceed with AI analysis if we have any keywords or patterns
        const proceedWithAI = keywordCheck.hasKeywords || keywordCheck.hasPatterns || crisisSettings.allowLowConfidence

        let analysis = {
            crisisLevel: keywordCheck.severity,
            supportLevel:
                keywordCheck.severity === 'critical'
                    ? 'critical'
                    : keywordCheck.severity === 'high'
                      ? 'high'
                      : keywordCheck.severity === 'medium'
                        ? 'medium'
                        : 'low',
            confidence: keywordCheck.confidence
        }

        // Analyze with AI if needed
        if (proceedWithAI) {
            try {
                analysis = await analyzeMessageContent(message)
            } catch (error) {
                console.error('AI analysis failed, using keyword results:', error)
                // Continue with keyword results
            }
        }

        // Enhanced analysis combining AI and keyword detection
        const combinedAnalysis = {
            ...analysis,
            hasKeywords: keywordCheck.hasKeywords,
            hasPatterns: keywordCheck.hasPatterns,
            keywords: keywordCheck.keywords,
            patterns: keywordCheck.patterns,
            keywordConfidence: keywordCheck.confidence,
            // Use the highest severity from either method
            crisisLevel:
                keywordCheck.severity === 'critical' || analysis.crisisLevel === 'critical'
                    ? 'critical'
                    : keywordCheck.severity === 'high' || analysis.crisisLevel === 'high'
                      ? 'high'
                      : keywordCheck.severity === 'medium' || analysis.crisisLevel === 'medium'
                        ? 'medium'
                        : 'low'
        }

        // More reasonable intervention logic
        const needsIntervention = requiresImmediateIntervention(combinedAnalysis)

        // Always log for medium or higher severity
        const shouldLog =
            needsIntervention ||
            combinedAnalysis.crisisLevel === 'critical' ||
            combinedAnalysis.crisisLevel === 'high' ||
            combinedAnalysis.crisisLevel === 'medium'

        let crisisEvent = null
        if (shouldLog) {
            crisisEvent = await logCrisisEvent(userId, combinedAnalysis, message, db)

            // Log to system logger
            if (client.systemLogger) {
                await client.systemLogger.logCrisisEvent(
                    userId,
                    guildId,
                    combinedAnalysis.crisisLevel,
                    needsIntervention
                )
            }
        }

        // Determine actions based on severity and settings
        const actions = {
            logged: shouldLog,
            modAlertSent: false,
            dmSent: false,
            requiresImmediate: needsIntervention
        }

        // Send moderator alert for medium or higher severity with notification-worthy content
        if (
            (combinedAnalysis.crisisLevel === 'critical' ||
                combinedAnalysis.crisisLevel === 'high' ||
                (combinedAnalysis.crisisLevel === 'medium' && needsIntervention)) &&
            crisisSettings.guildAlertsEnabled &&
            guildId !== 'DM'
        ) {
            actions.modAlertSent = await sendModeratorAlert(guildId, userId, combinedAnalysis, message, client, db)
        }

        // Send supportive DM only for high/critical severity if user allows support DMs
        if (
            (combinedAnalysis.crisisLevel === 'critical' || combinedAnalysis.crisisLevel === 'high') &&
            (await canReceiveSupportDMs(userId, db))
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
            response: generateCrisisResponse(combinedAnalysis, client, guildId === 'DM')
        }
    } catch (error) {
        console.error('Failed to handle crisis:', error)
        throw error
    }
}

/**
 * Test crisis detection with a sample message (for debugging)
 * @param {string} message - Test message
 * @param {object} client - Discord client
 * @param {object} db - Database client
 * @returns {Promise<object>} - Test results
 */
export async function testCrisisDetection(message, client, db) {
    console.log(`Testing crisis detection for message: "${message}"`)

    // Test keyword detection
    const keywordCheck = checkCrisisKeywords(message)
    console.log('Keyword analysis:', keywordCheck)

    // Test AI analysis
    const aiAnalysis = await analyzeMessageContent(message)
    console.log('AI analysis:', aiAnalysis)

    // Test combined analysis
    const combinedAnalysis = {
        ...aiAnalysis,
        hasKeywords: keywordCheck.hasKeywords,
        hasPatterns: keywordCheck.hasPatterns,
        keywords: keywordCheck.keywords,
        patterns: keywordCheck.patterns,
        keywordConfidence: keywordCheck.confidence
    }

    // Test intervention logic
    const needsIntervention = requiresImmediateIntervention(combinedAnalysis)
    console.log('Needs intervention:', needsIntervention)

    return {
        message,
        keywordCheck,
        aiAnalysis,
        combinedAnalysis,
        needsIntervention,
        finalLevel: combinedAnalysis.crisisLevel
    }
}

/**
 * Get user's crisis detection preferences summary
 * @param {string} userId - Discord user ID
 * @param {object} db - Database client
 * @returns {Promise<object>} - User preferences summary
 */
export async function getUserCrisisPreferences(userId, db) {
    try {
        const userPreferences = await db.userPreferences.findById(userId)

        return {
            crisisDetectionEnabled: !(userPreferences?.disableCrisisDetection || false),
            aiAnalysisEnabled: !(userPreferences?.disableAIAnalysis || false),
            supportDMsEnabled: !(userPreferences?.disableCrisisSupportDMs || false),
            privacyMode: userPreferences?.privacyMode || 'standard',
            allAIFeaturesDisabled: userPreferences?.disableAIFeatures || false
        }
    } catch (error) {
        console.error('Error getting user crisis preferences:', error)
        return {
            crisisDetectionEnabled: true,
            aiAnalysisEnabled: true,
            supportDMsEnabled: true,
            privacyMode: 'standard',
            allAIFeaturesDisabled: false,
            error: true
        }
    }
}
