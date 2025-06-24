import { aiConfig } from '../configs/ai.config.js'
import { PerformanceTool } from './tools/performance.js'
import { buildCopingPrompt } from './tools/copingTool.js'
import { MessageFormattingTool } from './tools/messageFormatting.js'
import { analyzeMessageContent } from './tools/crisisTool.js'
import { analyzeContent } from './tools/moderationTool.js'
import { db } from '../database/client.js'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export class AIService {
    constructor() {
        this.config = this.normalizeConfig(aiConfig)
        this.messageFormatting = new MessageFormattingTool()
        this.performance = new PerformanceTool()

        this.model = openai.chat('gpt-3.5-turbo', {
            compatibility: 'strict'
        })
    }

    normalizeConfig(config) {
        return {
            ...config,
            systemPrompt:
                typeof config.systemPrompt === 'string' ? config.systemPrompt : JSON.stringify(config.systemPrompt)
        }
    }

    async generateResponse(message, userId) {
        const perfId = `resp-${Date.now()}-${userId}`
        try {
            this.performance.startTracking(perfId)
            return this.generateFullResponse(message, userId)
        } catch (error) {
            this.performance.recordError('generate_response')
            console.error('Error generating AI response:', error)
            throw error
        } finally {
            const duration = this.performance.endTracking(perfId)
            if (duration) {
                console.log(`Response generated in ${duration.toFixed(2)}ms`)
            }
        }
    }

    async generateFullResponse(message, userId) {
        const perfId = `fullresp-${Date.now()}-${userId}`
        try {
            this.performance.startTracking(perfId)
            // Get conversation history from db module
            const historyRecords = await db.conversationHistory.getAllForUser(userId, 50)
            const history = historyRecords.map(msg => ({
                role: msg.isAiResponse ? 'assistant' : 'user',
                content: msg.content
            }))

            // Build enhanced prompt
            let enhancedPrompt = this.config.systemPrompt
            if (typeof enhancedPrompt !== 'string') {
                console.error('System prompt is not a string:', enhancedPrompt)
                enhancedPrompt = 'You are Thing Talk, a supportive AI mental health companion.'
            }

            // Validate prompt before sending
            if (typeof enhancedPrompt !== 'string') {
                throw new Error('Invalid prompt: system prompt must be a string')
            }

            // Prepare messages array with enhanced prompt and history
            const messages = [
                { role: 'system', content: enhancedPrompt },
                ...history,
                { role: 'user', content: message }
            ]
            const { text: fullResponse } = await generateText({
                model: this.model,
                messages,
                temperature: this.config.temperature,
                maxTokens: this.config.maxTokens,
                presencePenalty: 0.6,
                frequencyPenalty: 0.5
            })

            // Save both user message and AI response to history using db module
            await db.conversationHistory.add(userId, message, false)
            await db.conversationHistory.add(userId, fullResponse, true)

            // Format the response for Discord
            return this.messageFormatting.formatForDiscord(fullResponse)
        } catch (error) {
            this.performance.recordError('generate_full_response')
            console.error('Error generating full AI response:', error)
            throw error
        } finally {
            const duration = this.performance.endTracking(perfId)
            if (duration) {
                console.log(`Full response generated in ${duration.toFixed(2)}ms`)
            }
        }
    }

    async getCopingResponse({ tool, feeling, userId }) {
        const prompt = await buildCopingPrompt({ tool, feeling, userId, db })
        const { text: aiResponse } = await generateText({
            model: this.model,
            messages: [
                { role: 'system', content: this.config.systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
            presencePenalty: 0.6,
            frequencyPenalty: 0.5
        })
        return this.messageFormatting.formatForDiscord(aiResponse)
    }

    clearUserHistory(userId) {
        return db.conversationHistory.clearForUser(userId)
    }

    async moderateMessage(message) {
        // First check for crisis indicators
        const crisisAnalysis = await analyzeMessageContent(message)

        // Then check for content violations
        const contentAnalysis = await analyzeContent(message)

        // Return combined analysis
        return {
            crisis: crisisAnalysis,
            moderation: contentAnalysis
        }
    }
}

export const aiService = new AIService()
