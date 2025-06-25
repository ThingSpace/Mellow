import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Action levels for moderation responses
 */
const ACTION_LEVELS = {
    NONE: 'none', // No action needed
    WARN: 'warn', // Issue warning
    MUTE: 'mute', // Temporary mute
    KICK: 'kick', // Kick from server
    BAN: 'ban' // Ban from server
}

/**
 * User behavior tracking for rate limiting and pattern detection
 * Stores recent messages and infractions per user
 */
const userBehaviorCache = new Map()

/**
 * Analyzes message content for rule violations
 * @param {string} content - Message content to analyze
 * @returns {Promise<object>} Moderation analysis result
 */
export async function analyzeContent(content) {
    try {
        const response = await openai.moderations.create({
            input: content
        })

        const result = response.results[0]
        return {
            flagged: result.flagged,
            categories: result.categories,
            scores: result.category_scores,
            action: determineAction(result)
        }
    } catch (error) {
        console.error('Moderation analysis error:', error)
        return {
            flagged: false,
            categories: {},
            scores: {},
            action: ACTION_LEVELS.NONE
        }
    }
}

/**
 * Determines appropriate moderation action based on analysis
 * @param {object} result - OpenAI moderation result
 * @returns {string} Recommended action level
 */
function determineAction(result) {
    const scores = result.category_scores

    // Immediate ban for severe violations
    if (scores.sexual_minors > 0.5 || scores.violence > 0.9) {
        return ACTION_LEVELS.BAN
    }

    // Kick for serious violations
    if (scores.hate > 0.8 || scores.violence > 0.7) {
        return ACTION_LEVELS.KICK
    }

    // Mute for moderate violations
    if (scores.hate > 0.6 || scores.sexual > 0.7 || scores.violence > 0.5) {
        return ACTION_LEVELS.MUTE
    }

    // Warning for minor violations
    if (scores.hate > 0.4 || scores.sexual > 0.5 || scores.violence > 0.3) {
        return ACTION_LEVELS.WARN
    }

    return ACTION_LEVELS.NONE
}

/**
 * Tracks user message patterns for spam and raid detection
 * @param {string} userId - User ID
 * @param {string} content - Message content
 * @param {number} timestamp - Message timestamp
 * @returns {object} User behavior analysis
 */
export function trackUserBehavior(userId, content, timestamp) {
    if (!userBehaviorCache.has(userId)) {
        userBehaviorCache.set(userId, {
            messages: [],
            warnings: 0,
            lastWarning: 0,
            mutes: 0,
            lastMute: 0
        })
    }

    const userData = userBehaviorCache.get(userId)

    // Add message to recent history
    userData.messages.push({
        content,
        timestamp
    })

    // Keep only last 10 messages
    if (userData.messages.length > 10) {
        userData.messages.shift()
    }

    // Clean up old data (older than 1 hour)
    const oneHourAgo = Date.now() - 3600000
    userData.messages = userData.messages.filter(msg => msg.timestamp > oneHourAgo)

    return analyzeUserBehavior(userData)
}

/**
 * Analyzes user behavior patterns
 * @param {object} userData - User behavior data
 * @returns {object} Behavior analysis result
 */
function analyzeUserBehavior(userData) {
    const messages = userData.messages
    const messageCount = messages.length
    const timeWindow = messageCount > 1 ? messages[messageCount - 1].timestamp - messages[0].timestamp : 0

    // Only analyze if at least 5 messages in the last 30 seconds
    if (messageCount < 5 || timeWindow < 30000) {
        return {
            isSpamming: false,
            messageFrequency: 0,
            repetitionRatio: 1,
            avgLength: 0,
            recentInfractions: userData.recentInfractions || {
                warnings: userData.warnings,
                mutes: userData.mutes,
                lastWarning: userData.lastWarning,
                lastMute: userData.lastMute
            }
        }
    }

    // Calculate message frequency (messages per minute)
    const messageFrequency = messageCount / (timeWindow / 60000)

    // Check for repeated content
    const uniqueMessages = new Set(messages.map(m => m.content)).size
    const repetitionRatio = messageCount > 0 ? uniqueMessages / messageCount : 1

    // Calculate average message length
    const avgLength = messages.reduce((sum, msg) => sum + msg.content.length, 0) / messageCount

    return {
        isSpamming: messageFrequency > 15 || repetitionRatio < 0.3,
        messageFrequency,
        repetitionRatio,
        avgLength,
        recentInfractions: {
            warnings: userData.warnings,
            mutes: userData.mutes,
            lastWarning: userData.lastWarning,
            lastMute: userData.lastMute
        }
    }
}

/**
 * Records a moderation action taken against a user
 * @param {string} userId - User ID
 * @param {string} action - Action taken
 */
export function recordAction(userId, action) {
    if (!userBehaviorCache.has(userId)) {
        userBehaviorCache.set(userId, {
            messages: [],
            warnings: 0,
            lastWarning: 0,
            mutes: 0,
            lastMute: 0
        })
    }

    const userData = userBehaviorCache.get(userId)
    const now = Date.now()

    switch (action) {
        case ACTION_LEVELS.WARN:
            userData.warnings++
            userData.lastWarning = now
            break
        case ACTION_LEVELS.MUTE:
            userData.mutes++
            userData.lastMute = now
            break
        // Reset counters for more severe actions
        case ACTION_LEVELS.KICK:
        case ACTION_LEVELS.BAN:
            userBehaviorCache.delete(userId)
            break
    }
}

/**
 * Generates a moderation report for logging
 * @param {object} contentAnalysis - Content analysis result
 * @param {object} behaviorAnalysis - Behavior analysis result
 * @param {string} userId - User ID
 * @param {string} messageId - Message ID
 * @returns {object} Formatted moderation report
 */
export function generateModerationReport(contentAnalysis, behaviorAnalysis, userId, messageId) {
    return {
        userId,
        messageId,
        timestamp: Date.now(),
        content: {
            flagged: contentAnalysis.flagged,
            categories: contentAnalysis.categories,
            recommendedAction: contentAnalysis.action
        },
        behavior: {
            spamDetected: behaviorAnalysis.isSpamming,
            messageFrequency: behaviorAnalysis.messageFrequency,
            repetitionRatio: behaviorAnalysis.repetitionRatio,
            recentInfractions: behaviorAnalysis.recentInfractions
        },
        finalAction: determineFinalAction(contentAnalysis, behaviorAnalysis)
    }
}

/**
 * Determines final action based on both content and behavior analysis
 * @param {object} contentAnalysis - Content analysis result
 * @param {object} behaviorAnalysis - Behavior analysis result
 * @returns {string} Final recommended action
 */
function determineFinalAction(contentAnalysis, behaviorAnalysis) {
    // Escalate action for repeat offenders (but never kick for spam alone)
    if (behaviorAnalysis.recentInfractions.warnings > 3 || behaviorAnalysis.recentInfractions.mutes > 1) {
        return ACTION_LEVELS.MUTE // Only mute, never kick for spam
    }

    // Escalate for combined violations
    if (contentAnalysis.action === ACTION_LEVELS.WARN && behaviorAnalysis.isSpamming) {
        return ACTION_LEVELS.MUTE
    }

    // Use the more severe action between content and behavior analysis
    if (behaviorAnalysis.isSpamming) {
        return ACTION_LEVELS.WARN // Only warn for spam
    }

    return contentAnalysis.action
}

/**
 * Cleans up old data from the behavior cache
 * Should be called periodically (e.g., every hour)
 */
export function cleanupBehaviorCache() {
    const oneHourAgo = Date.now() - 3600000
    for (const [userId, userData] of userBehaviorCache.entries()) {
        userData.messages = userData.messages.filter(msg => msg.timestamp > oneHourAgo)
        if (userData.messages.length === 0 && userData.lastWarning < oneHourAgo && userData.lastMute < oneHourAgo) {
            userBehaviorCache.delete(userId)
        }
    }
}
