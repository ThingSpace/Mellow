import { PerformanceTool } from './tools/performance.js'
import { buildCopingPrompt } from './tools/copingTool.js'
import { MessageFormattingTool } from './tools/messageFormatting.js'
import { MessageHistoryTool } from './tools/messageHistory.js'
import { db } from '../database/client.js'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { log } from '../functions/logger.js'

export class AIService {
    constructor() {
        this.messageFormatting = new MessageFormattingTool()
        this.performance = new PerformanceTool()
        this.messageHistory = new MessageHistoryTool(db)
        this.model = null // Will be initialized dynamically
        this.config = null // Will be loaded from database
    }

    /**
     * Initialize the AI service with database configuration
     * This should be called after the database is ready
     */
    async initialize() {
        try {
            await this.loadConfig()
            log('AI Service initialized with database configuration', 'done')
        } catch (error) {
            console.error('Failed to initialize AI Service:', error)
            throw error
        }
    }

    /**
     * Load configuration from the database
     */
    async loadConfig() {
        try {
            const mellowConfig = await db.mellow.getAIConfig()

            this.config = {
                model: mellowConfig.model,
                temperature: mellowConfig.temperature,
                maxTokens: mellowConfig.maxTokens,
                presencePenalty: mellowConfig.presencePenalty,
                frequencyPenalty: mellowConfig.frequencyPenalty,
                systemPrompt: mellowConfig.prompt
            }

            // Reinitialize the model with new configuration
            this.model = openai.chat(this.config.model, { compatibility: 'strict' })

            return this.config
        } catch (error) {
            console.error('Failed to load AI configuration:', error)
            throw error
        }
    }

    /**
     * Check if Mellow is enabled before processing requests
     */
    async isEnabled() {
        try {
            return await db.mellow.isEnabled()
        } catch (error) {
            console.error('Failed to check if Mellow is enabled:', error)
            return false
        }
    }

    /**
     * Validate current configuration
     */
    async validateConfig() {
        try {
            const validation = await db.mellow.validateConfig()
            if (!validation.isValid) {
                console.warn('AI Configuration validation issues:', validation.issues)
            }
            return validation
        } catch (error) {
            console.error('Failed to validate AI configuration:', error)
            return { isValid: false, issues: ['Failed to validate configuration'] }
        }
    }

    /**
     * Reload configuration from database (useful for hot reloading)
     */
    async reloadConfig() {
        try {
            await this.loadConfig()
            console.log('AI configuration reloaded successfully')
            return this.config
        } catch (error) {
            console.error('Failed to reload AI configuration:', error)
            throw error
        }
    }

    /**
     * GENERATE A RESPONSE WITH FORMATTING, HISTORY AND PERFORMANCE TRACKING
     * @param message The users message/request
     * @param userId The Discord ID of the user
     */
    async generateResponse(message, userId) {
        const perfId = `resp-${Date.now()}-${userId}`

        try {
            // Check if Mellow is enabled
            const isEnabled = await this.isEnabled()
            if (!isEnabled) {
                throw new Error('Mellow AI is currently disabled')
            }

            // Ensure we have fresh configuration
            if (!this.config) {
                await this.loadConfig()
            }

            this.performance.startTracking(perfId)

            // Get user preferences for personality
            const userPrefs = await db.userPreferences.findById(userId)
            const personality = userPrefs?.aiPersonality || 'gentle'

            // Get chat history using the MessageHistoryTool
            const chatHistory = await this.messageHistory.getRecentHistory(userId, 50)

            // Build enhanced prompt from database with personality customization
            let enhancedPrompt = this.config.systemPrompt

            // Add personality-specific instructions
            enhancedPrompt += this.getPersonalityInstructions(personality)

            if (typeof enhancedPrompt !== 'string') {
                console.error(`System prompt is not a valid string:`, enhancedPrompt)
                enhancedPrompt =
                    'You are Mellow. You help users find moments of calm, safe conversations, and reminders that empathy matters, even online.'
            }

            // Prepare messages array with enhanced prompt and chat history
            const messages = [
                { role: 'system', content: enhancedPrompt },
                ...chatHistory,
                { role: 'user', content: message }
            ]

            const { text: fullResponse } = await generateText({
                model: this.model,
                messages,
                temperature: this.config.temperature,
                maxTokens: this.config.maxTokens,
                presencePenalty: this.config.presencePenalty,
                frequencyPenalty: this.config.frequencyPenalty
            })

            // Save both the user message and AI response to history
            await this.messageHistory.saveMessage(userId, message, false)
            await this.messageHistory.saveMessage(userId, fullResponse, true)

            return this.messageFormatting.formatForDiscord(fullResponse)
        } catch (error) {
            this.performance.recordError(`generate_full_response`)
            console.error(`Error generating full AI response:`, error)
            throw error
        } finally {
            const duration = this.performance.endTracking(perfId)

            if (duration) {
                console.log(`Full response generated in: ${duration.toFixed(2)}ms`)
            }
        }
    }

    /**
     * Get personality-specific instructions to append to system prompt
     * @param {string} personality - User's preferred AI personality
     * @returns {string} - Additional instructions for the personality
     */
    getPersonalityInstructions(personality) {
        const personalityInstructions = {
            gentle: `

**Personality: Gentle**
- Use soft, comforting language
- Be extra patient and understanding
- Validate feelings frequently
- Use gentle encouragement rather than direct advice
- Speak in a calm, soothing tone`,

            supportive: `

**Personality: Supportive** 
- Be encouraging and uplifting
- Focus on strengths and positive aspects
- Offer practical suggestions and resources
- Use motivational language
- Express confidence in the user's abilities`,

            direct: `

**Personality: Direct**
- Be clear and straightforward in communication
- Provide practical, actionable advice
- Focus on solutions rather than just emotional support
- Use concise, honest responses
- Balance directness with empathy`,

            playful: `

**Personality: Playful**
- Use light humor when appropriate (never about serious mental health issues)
- Include gentle emojis and friendly language
- Be more casual and conversational
- Use metaphors and creative language
- Keep the mood lighter while still being supportive`,

            professional: `

**Personality: Professional**
- Use more formal, clinical language
- Provide structured responses
- Reference mental health best practices
- Be informative and educational
- Maintain professional boundaries while being caring`,

            encouraging: `

**Personality: Encouraging**
- Focus on progress and growth
- Celebrate small wins and efforts
- Use positive, hopeful language
- Emphasize resilience and capability
- Be motivational and inspiring`
        }

        return personalityInstructions[personality] || personalityInstructions.gentle
    }

    async getCopingResponse({ tool, feeling, userId }) {
        try {
            // Check if coping tools are enabled
            const enabledFeatures = await db.mellow.getEnabledFeatures()
            if (!enabledFeatures.includes('copingTools')) {
                throw new Error('Coping tools are currently disabled')
            }

            // Ensure we have fresh configuration
            if (!this.config) {
                await this.loadConfig()
            }

            // Get user preferences for personality
            const userPrefs = await db.userPreferences.findById(userId)
            const personality = userPrefs?.aiPersonality || 'gentle'

            const prompt = await buildCopingPrompt({ tool, feeling, userId, db })

            // Enhance system prompt with personality
            let systemPrompt = this.config.systemPrompt + this.getPersonalityInstructions(personality)

            const { text: aiResponse } = await generateText({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: this.config.temperature,
                maxTokens: this.config.maxTokens,
                presencePenalty: this.config.presencePenalty,
                frequencyPenalty: this.config.frequencyPenalty
            })

            return this.messageFormatting.formatForDiscord(aiResponse)
        } catch (error) {
            console.error('Error generating coping response:', error)
            throw error
        }
    }

    /**
     * Get AI-powered crisis support resources based on user context
     * @param {Object} context - User crisis context
     * @param {string} userId - User ID for personality preferences
     * @returns {Promise<Object>} - Structured crisis resources
     */
    async getCrisisResources(context, userId = null) {
        try {
            // Check if crisis tools are enabled
            const enabledFeatures = await db.mellow.getEnabledFeatures()
            if (!enabledFeatures.includes('crisisTools')) {
                throw new Error('Crisis tools are currently disabled')
            }

            // Ensure we have fresh configuration
            if (!this.config) {
                await this.loadConfig()
            }

            // Get user preferences for personality if userId provided
            let personalityInstructions = ''
            if (userId) {
                const userPrefs = await db.userPreferences.findById(userId)
                const personality = userPrefs?.aiPersonality || 'gentle'
                personalityInstructions = this.getPersonalityInstructions(personality)
            }

            // Build crisis resources prompt
            const prompt = `You are a compassionate crisis support specialist. A user needs help with: "${context.situation}"

User Context:
- Has recent crisis events: ${context.hasRecentCrisis ? 'Yes' : 'No'}
- Crisis trend: ${context.crisisTrend}
- Recent events: ${context.recentEvents}
- Escalated events: ${context.escalatedEvents}

Please provide structured crisis support resources in the following format:

IMMEDIATE: [Immediate actions they can take right now for safety and support]
HOTLINES: [Specific crisis hotlines and emergency resources]
COPING: [Immediate coping strategies and techniques]
LONGTERM: [Long-term support options and recommendations]

Be compassionate, practical, and provide specific, actionable resources. Focus on safety first, then support.`

            const systemPrompt =
                'You are a compassionate crisis support specialist. Provide practical, actionable resources while maintaining a warm, supportive tone. Always prioritize safety and provide specific contact information for crisis services.' +
                personalityInstructions

            const { text: aiResponse } = await generateText({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: this.config.temperature,
                maxTokens: this.config.maxTokens,
                presencePenalty: this.config.presencePenalty,
                frequencyPenalty: this.config.frequencyPenalty
            })

            // Parse the AI response into structured sections
            const sections = this.parseCrisisResources(aiResponse)

            return {
                immediate: sections.immediate || null,
                hotlines: sections.hotlines || null,
                coping: sections.coping || null,
                longTerm: sections.longTerm || null
            }
        } catch (error) {
            console.error('Error generating crisis resources:', error)
            throw error
        }
    }

    /**
     * Parse AI response into structured crisis resource sections
     * @param {string} response - AI response text
     * @returns {Object} - Parsed sections
     */
    parseCrisisResources(response) {
        const sections = {}

        // Split by common section markers
        const lines = response.split('\n')
        let currentSection = null
        let currentContent = []

        for (const line of lines) {
            const trimmedLine = line.trim()

            // Check for section headers
            if (trimmedLine.toUpperCase().includes('IMMEDIATE:')) {
                if (currentSection && currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n').trim()
                }
                currentSection = 'immediate'
                currentContent = []
            } else if (trimmedLine.toUpperCase().includes('HOTLINES:')) {
                if (currentSection && currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n').trim()
                }
                currentSection = 'hotlines'
                currentContent = []
            } else if (trimmedLine.toUpperCase().includes('COPING:')) {
                if (currentSection && currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n').trim()
                }
                currentSection = 'coping'
                currentContent = []
            } else if (trimmedLine.toUpperCase().includes('LONGTERM:')) {
                if (currentSection && currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n').trim()
                }
                currentSection = 'longTerm'
                currentContent = []
            } else if (currentSection && trimmedLine) {
                currentContent.push(trimmedLine)
            }
        }

        // Add the last section
        if (currentSection && currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n').trim()
        }

        return sections
    }

    /**
     * Get current AI configuration summary
     */
    async getConfigSummary() {
        try {
            return await db.mellow.getSettingsSummary()
        } catch (error) {
            console.error('Failed to get AI configuration summary:', error)
            throw error
        }
    }

    /**
     * Update AI configuration
     * @param {Object} configData - Configuration data to update
     */
    async updateConfig(configData) {
        try {
            await db.mellow.update(configData)
            await this.loadConfig() // Reload configuration after update
            console.log('AI configuration updated successfully')
            return this.config
        } catch (error) {
            console.error('Failed to update AI configuration:', error)
            throw error
        }
    }

    /**
     * Generate a personalized suggestion for the user based on their trends and preferences.
     * @param {Object} context - User context for suggestion
     * @param {string} context.userId - Discord user ID
     * @param {string} [context.goal] - User's stated goal or focus
     * @returns {Promise<string>} AI-generated suggestion
     */
    async generateSuggestion({ userId, goal }) {
        const userPrefs = await db.userPreferences.findById(userId)
        const personality = userPrefs?.aiPersonality || 'gentle'

        const moodTrend = await db.moodCheckIns.getMoodTrendForUser?.(userId)
        const checkInTrend = await db.moodCheckIns.getCheckInTrendForUser?.(userId)
        const commonCopingTools = await db.copingToolUsage.getCommonToolsForUser?.(userId)
        const favoriteTools = await db.favoriteCopingTools.findMany({ where: { userId: BigInt(userId) } })

        const favoriteToolNames = favoriteTools?.map(f => f.tool) || []

        let prompt = `You are Mellow, an AI mental health companion. Provide a personalized, actionable suggestion for the user based on the following context:\n`

        if (moodTrend) prompt += `- Recent mood trend: ${moodTrend}\n`
        if (checkInTrend) prompt += `- Check-in trend: ${checkInTrend}\n`
        if (commonCopingTools && commonCopingTools.length)
            prompt += `- Most used coping tools: ${commonCopingTools.join(', ')}\n`
        if (favoriteToolNames.length) prompt += `- Favorite coping tools: ${favoriteToolNames.join(', ')}\n`
        if (goal) prompt += `- User's goal: ${goal}\n`
        prompt += `- Your personality should be: ${personality}\n`
        prompt += `\nGive a supportive, concise, and practical suggestion that fits the user's trends and preferences. Use a warm, encouraging tone.`

        return this.generateResponse(prompt, userId)
    }
}

export const aiService = new AIService()
