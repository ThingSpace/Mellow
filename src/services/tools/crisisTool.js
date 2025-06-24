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

    if (scores.self_harm > 0.8 || scores.violence > 0.8) {
        return SEVERITY_LEVELS.CRITICAL
    }

    if (scores.self_harm > 0.6 || scores.violence > 0.6) {
        return SEVERITY_LEVELS.HIGH
    }

    if (scores.self_harm > 0.4 || scores.violence > 0.4) {
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
    if (scores.self_harm > 0.9) {
        return SUPPORT_LEVELS.URGENT
    }

    // Check for elevated risk combinations
    if (scores.self_harm > 0.7 || scores.violence > 0.8) {
        return SUPPORT_LEVELS.ELEVATED
    }

    // Check for moderate support needs
    if (scores.self_harm > 0.5 || scores.violence > 0.6 || scores.harassment > 0.7) {
        return SUPPORT_LEVELS.MODERATE
    }

    // Check for mild support needs
    if (scores.self_harm > 0.3 || scores.violence > 0.4 || scores.harassment > 0.5) {
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
