/**
 * Context Types Configuration
 *
 * Defines the different types of context that can be stored in conversation history
 * and how they are used by the AI system.
 */

export const contextTypes = {
    /**
     * Direct conversation between user and AI
     * - User messages and AI responses
     * - Primary context for maintaining conversation continuity
     * - Used for personalized responses and remembering user preferences
     */
    CONVERSATION: 'conversation',

    /**
     * Recent server/channel messages for situational context
     * - Messages from other users in the same channel
     * - Helps AI understand ongoing discussions
     * - Limited to recent messages within the last hour
     * - Filtered to exclude the current user's messages
     */
    CHANNEL_CONTEXT: 'channel_context',

    /**
     * System-level context and internal notes
     * - User preferences and settings
     * - Behavioral patterns and insights
     * - Crisis intervention notes
     * - Longer retention period for safety analysis
     */
    SYSTEM: 'system'
}

/**
 * Context type descriptions for user-facing documentation
 */
export const contextTypeDescriptions = {
    [contextTypes.CONVERSATION]: {
        name: 'Conversation Context',
        description: 'Direct messages between you and me',
        purpose: 'Maintains conversation continuity and remembers your preferences',
        retention: '90 days (configurable)',
        privacy: 'Respects your personal privacy settings'
    },

    [contextTypes.CHANNEL_CONTEXT]: {
        name: 'Channel Context',
        description: 'Recent server messages that help me understand ongoing discussions',
        purpose: 'Provides situational awareness in server conversations',
        retention: '90 days (configurable)',
        privacy: 'Respects both server and individual privacy settings'
    },

    [contextTypes.SYSTEM]: {
        name: 'System Context',
        description: 'Internal notes about your preferences and interaction patterns',
        purpose: 'Enables personalized support and crisis awareness',
        retention: 'Extended retention for safety analysis',
        privacy: 'Never shared, used only for improving your experience'
    }
}

/**
 * Context type validation
 */
export function isValidContextType(contextType) {
    return Object.values(contextTypes).includes(contextType)
}

/**
 * Get context type description for user display
 */
export function getContextTypeDescription(contextType) {
    return contextTypeDescriptions[contextType] || null
}

/**
 * Get all context types with descriptions
 */
export function getAllContextTypes() {
    return Object.entries(contextTypeDescriptions).map(([type, desc]) => ({
        type,
        ...desc
    }))
}

/**
 * Future extensibility - reserved context types for planned features
 * These are documented here but not yet implemented
 */
export const futureContextTypes = {
    /**
     * Crisis intervention and safety context
     * - Crisis detection events
     * - Safety interventions
     * - Support escalations
     * - Longer retention for safety analysis
     */
    CRISIS: 'crisis',

    /**
     * Community support and peer interaction context
     * - Peer support channel interactions
     * - Group therapy session context
     * - Community moderation notes
     */
    COMMUNITY: 'community',

    /**
     * Therapeutic tools and coping strategy context
     * - Coping tool usage and effectiveness
     * - Progress tracking over time
     * - Therapeutic insights and patterns
     */
    THERAPEUTIC: 'therapeutic',

    /**
     * Administrative and moderation context
     * - Moderation actions and warnings
     * - Administrative interactions
     * - Policy enforcement context
     */
    MODERATION: 'moderation'
}

export default {
    contextTypes,
    contextTypeDescriptions,
    isValidContextType,
    getContextTypeDescription,
    getAllContextTypes,
    futureContextTypes
}
