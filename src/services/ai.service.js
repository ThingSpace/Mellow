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

            const historyRecords = await db.conversationHistory.getAllForUser(userId, 50)

            const chatHistory = historyRecords.map(msg => ({
                role: msg.isAiResponse ? 'assistant' : 'user',
                content: msg.content
            }))

            // Build enhanced prompt from database
            let enhancedPrompt = this.config.systemPrompt

            if (typeof enhancedPrompt !== 'string') {
                console.error(`System prompt is not a valid string:`, enhancedPrompt)
                enhancedPrompt =
                    'You are Mellow. You help users find moments of calm, safe conversations, and reminders that empathy matters, even online.'
            }

            // Validate prompt before sending
            if (typeof enhancedPrompt !== 'string') {
                throw new Error(`Invalid prompt: system prompt must be a valid string`)
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
            await db.conversationHistory.add(userId, message, false)
            await db.conversationHistory.add(userId, fullResponse, true)

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

            const prompt = await buildCopingPrompt({ tool, feeling, userId, db })

            const { text: aiResponse } = await generateText({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: this.config.systemPrompt
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
     * @param {string} context.situation - User's described situation
     * @param {boolean} context.hasRecentCrisis - Whether user has recent crisis events
     * @param {string} context.crisisTrend - Trend of crisis events (increasing/decreasing/stable)
     * @param {number} context.recentEvents - Number of recent crisis events
     * @param {number} context.escalatedEvents - Number of escalated events
     * @returns {Promise<Object>} - Structured crisis resources
     */
    async getCrisisResources(context) {
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

            const { text: aiResponse } = await generateText({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a compassionate crisis support specialist. Provide practical, actionable resources while maintaining a warm, supportive tone. Always prioritize safety and provide specific contact information for crisis services.'
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
}

export const aiService = new AIService()
