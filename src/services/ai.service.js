import { PerformanceTool } from './tools/performance.js'
import { buildCopingPrompt } from './tools/copingTool.js'
import { MessageFormattingTool } from './tools/messageFormatting.js'
import { MessageHistoryTool } from './tools/messageHistory.js'
import { db } from '../database/client.js'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { log } from '../functions/logger.js'

import {
    isLateNight,
    isEarlyMorning,
    isLateEvening,
    getTimePeriod,
    getSleepSuggestion
} from '../functions/timeHelper.js'

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
     * @param context Additional context (channelId, guildId, etc.)
     */
    async generateResponse(message, userId, context = {}) {
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

            // Get enhanced chat history with channel context
            const chatHistory = await this.messageHistory.getEnhancedContext(
                userId,
                context.channelId,
                100, // User history limit - increased for better context
                20 // Channel context limit - increased for better context
            )

            // Get conversation summary for additional context
            const conversationSummary = await this.messageHistory.getConversationSummary(userId, 7)

            // Build enhanced prompt from database with personality customization
            let enhancedPrompt = this.config.systemPrompt

            // Add conversation summary if available
            if (conversationSummary) {
                enhancedPrompt += '\n\n**User Context Summary:**\n' + conversationSummary
            }

            // Add personality-specific instructions
            enhancedPrompt += this.getPersonalityInstructions(personality)

            // Add late-night mode instructions if applicable
            if (userPrefs?.timezone) {
                const lateNightInstructions = this.getLateNightInstructions(userPrefs.timezone)
                if (lateNightInstructions) {
                    enhancedPrompt += lateNightInstructions
                }
            }

            // Add context awareness instructions
            if (context.channelId) {
                enhancedPrompt += `\n\n**Context & Memory Instructions:**
- You are responding in a Discord ${context.guildId ? 'guild channel' : 'direct message'}
- You have access to previous conversation history with this user
- Pay attention to channel context messages marked with [Recent channel message from username]
- Maintain conversation continuity and reference previous messages when relevant
- Be aware of the broader conversation flow in the channel
- Remember details about the user from previous interactions (their concerns, progress, preferences)
- If you see patterns in their messages or mood over time, acknowledge this thoughtfully
- Build upon previous conversations naturally - don't treat each message as isolated
- Use context from previous interactions to provide more personalized and relevant support`
            } else {
                enhancedPrompt += `\n\n**Direct Message Guidelines:**
- This is a private conversation between you and the user
- Be gentle and non-overwhelming - they came to you for a reason
- Start by listening and understanding before offering tools or resources
- Ask if they want support/resources or just want to talk/vent
- Don't immediately jump to coping tools unless clearly needed
- Vary your responses - avoid repetitive phrases like "How are you feeling?" 
- Use natural, conversational language like a supportive friend would
- Reference previous conversations naturally to show you remember them
- If they seem to just need someone to listen, focus on validation and empathy
- Only suggest tools/resources when it feels appropriate to the conversation flow
- Generate basic empathetic responses naturally (e.g., "I'm sorry to hear that", "That sounds really tough")
- Not every response needs to be deeply therapeutic - sometimes just acknowledge their feelings
- Be a good listener first, support provider second`
            }

            // Late-night companion mode: Adjust tone and provide sleep-related suggestions
            const currentHour = new Date().getHours()
            if (isLateNight(currentHour)) {
                enhancedPrompt += `\n\n**Late-Night Companion Mode:**
- It's currently late at night. Your tone should be extra gentle and calming.
- Prioritize the user's comfort and emotional safety.
- If the user is expressing distress, gently encourage relaxation and provide coping strategies.
- Consider suggesting a wind-down routine or sleep hygiene tips if appropriate.
- Avoid suggesting activities that are too stimulating or demanding.

`
            }

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

            // Debug logging for context analysis
            if (process.env.NODE_ENV === 'development') {
                console.log(`AI Context for user ${userId}:`)
                console.log(`- Total messages in context: ${messages.length - 1}`) // Exclude system prompt
                console.log(`- User history messages: ${chatHistory.filter(m => m.role === 'user').length}`)
                console.log(`- AI response messages: ${chatHistory.filter(m => m.role === 'assistant').length}`)
                console.log(`- Channel context messages: ${chatHistory.filter(m => m.role === 'system').length}`)
                if (conversationSummary) {
                    console.log(`- Has conversation summary: Yes`)
                }
            }

            const { text: fullResponse } = await generateText({
                model: this.model,
                messages,
                temperature: this.config.temperature,
                maxTokens: this.config.maxTokens,
                presencePenalty: this.config.presencePenalty,
                frequencyPenalty: this.config.frequencyPenalty
            })

            // Save both the user message and AI response to history with context
            await this.messageHistory.saveMessage(userId, message, false, {
                channelId: context.channelId,
                guildId: context.guildId,
                messageId: context.messageId,
                contextType: 'conversation'
            })

            await this.messageHistory.saveMessage(userId, fullResponse, true, {
                channelId: context.channelId,
                guildId: context.guildId,
                contextType: 'conversation'
            })

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
     * Generate more intelligent, context-aware responses for DMs
     * @param {string} message - User's message
     * @param {string} userId - User ID
     * @param {Object} context - Message context
     * @returns {Promise<string>} - Intelligent response
     */
    async generateSmartDMResponse(message, userId, context = {}) {
        try {
            // Get recent conversation history to understand context
            const recentHistory = await this.messageHistory.getEnhancedContext(userId, null, 10, 0)
            const userPrefs = await db.userPreferences.findById(userId)

            // Analyze the message type and user's recent patterns
            const messageAnalysis = await this.analyzeMessageIntent(message, recentHistory)

            // Build context-appropriate system prompt
            let contextPrompt = this.config.systemPrompt

            // Add DM-specific guidance based on message analysis
            if (messageAnalysis.isQuestion) {
                contextPrompt += `\n\n**Question Response Mode:**
- The user is asking a direct question
- Provide a helpful, direct answer
- Be informative but conversational
- Don't automatically make it therapeutic unless the question is about mental health
- If it's outside your scope, be honest about your limitations while staying supportive`
            } else if (messageAnalysis.needsSupport) {
                contextPrompt += `\n\n**Support Response Mode:**
- The user seems to need emotional support
- Acknowledge their feelings first before offering any tools
- Ask what kind of support would be most helpful
- Be genuine and empathetic, not clinical`
            } else if (messageAnalysis.isVenting) {
                contextPrompt += `\n\n**Listening Mode:**
- The user appears to be venting or processing
- Focus on validation and empathy
- Don't immediately offer solutions unless they ask
- Use reflective listening techniques`
            } else if (messageAnalysis.isConversational) {
                contextPrompt += `\n\n**Conversational Mode:**
- This seems like casual conversation or greeting
- Be friendly and natural
- Don't automatically ask "how are you feeling" unless they bring up feelings
- Match their energy and tone appropriately
- Feel free to ask follow-up questions to keep the conversation going
- Avoid being overly therapeutic or formal`
            } else if (messageAnalysis.isGratitude) {
                contextPrompt += `\n\n**Gratitude Response Mode:**
- The user is expressing thanks or appreciation
- Acknowledge their gratitude warmly
- Be humble and encouraging
- Keep the response brief and genuine`
            }

            // Check for repetitive patterns and adjust accordingly
            const isRepeatedGreeting = this.checkRepeatedGreeting(message, recentHistory)
            if (isRepeatedGreeting) {
                contextPrompt += `\n\n**Repeated Greeting Note:**
- The user has greeted you multiple times recently
- Don't ask "how are you feeling" again
- Move the conversation forward naturally
- Maybe ask what's on their mind or what they'd like to talk about`
            }

            // Add memory of recent conversations
            if (messageAnalysis.hasRecentCrisis) {
                contextPrompt += `\n\n**Continuity Note:** This user has had recent difficult conversations with you. Be mindful of their ongoing journey and reference it naturally if appropriate.`
            }

            // Add first-time user guidance
            if (context.isFirstMessage) {
                contextPrompt += `\n\n**First Time User:**
- This appears to be the user's first interaction with you
- Be welcoming but not overwhelming
- Introduce yourself naturally in the conversation
- Don't assume they know what you can do - let them lead the conversation`
            }

            const personality = userPrefs?.aiPersonality || 'gentle'
            contextPrompt += this.getPersonalityInstructions(personality)

            // Enhanced DM guidelines with anti-repetition measures
            contextPrompt += `\n\n**Enhanced DM Guidelines:**
- This is a private conversation - be more personal and relaxed
- Remember details from previous conversations and reference them naturally
- Use the user's name occasionally if appropriate
- AVOID repetitive phrases like "Hey there!" or "How are you feeling today?"
- Don't start every response with a greeting unless they just greeted you
- Be curious about their experiences and feelings when appropriate
- Vary your responses significantly - use different openings, phrasings, and approaches
- If they ask what you can help with, explain your capabilities conversationally without being overly formal
- Focus on being a supportive companion, not just a therapeutic tool
- For technical questions outside your scope, be honest about limitations while staying supportive
- Don't force mental health topics into every conversation - let them guide the direction
- Match their communication style (casual, serious, playful, etc.)
- If they're being casual, be casual back - don't always default to therapeutic mode`

            // Generate response with smart context
            const messages = [
                { role: 'system', content: contextPrompt },
                ...recentHistory.slice(-8), // More context for DMs
                { role: 'user', content: message }
            ]

            const { text: response } = await generateText({
                model: this.model,
                messages,
                temperature: this.config.temperature + 0.15, // More creative for DMs
                maxTokens: this.config.maxTokens,
                presencePenalty: this.config.presencePenalty + 0.2, // Reduce repetition
                frequencyPenalty: this.config.frequencyPenalty + 0.4 // Aggressively reduce repetition
            })

            return this.messageFormatting.formatForDiscord(response)
        } catch (error) {
            console.error('Error generating smart DM response:', error)
            // Fallback to regular response
            return this.generateResponse(message, userId, context)
        }
    }

    /**
     * Check if this is a repeated greeting within recent conversation
     * @param {string} message - Current message
     * @param {Array} recentHistory - Recent conversation history
     * @returns {boolean} - Whether this is a repeated greeting
     */
    checkRepeatedGreeting(message, recentHistory) {
        const greetingWords = [
            'hello',
            'hi',
            'hey',
            'good morning',
            'good evening',
            'good afternoon',
            'sup',
            'whats up',
            "what's up"
        ]
        const lowerMessage = message.toLowerCase()

        // Check if current message is a greeting
        const isGreeting = greetingWords.some(greeting => lowerMessage.includes(greeting))

        if (!isGreeting) return false

        // Check if there were recent greetings (within last 5 messages)
        const recentMessages = recentHistory.slice(-10)
        const recentGreetings = recentMessages.filter(msg => {
            if (!msg.content) return false
            const content = msg.content.toLowerCase()
            return greetingWords.some(greeting => content.includes(greeting))
        })

        return recentGreetings.length > 1 // More than one greeting recently
    }

    /**
     * Analyze message intent and context
     * @param {string} message - User's message
     * @param {Array} recentHistory - Recent conversation history
     * @returns {Object} - Analysis of message intent
     */
    async analyzeMessageIntent(message, recentHistory) {
        const lowerMessage = message.toLowerCase()

        // Check for questions
        const questionKeywords = [
            'what',
            'how',
            'why',
            'when',
            'where',
            'who',
            'can you',
            'do you',
            'are you',
            'will you',
            'should i',
            'could you',
            'would you'
        ]
        const isQuestion =
            questionKeywords.some(keyword => lowerMessage.includes(keyword)) || lowerMessage.includes('?')

        // Check for support-seeking language
        const supportKeywords = [
            'help',
            'struggling',
            'difficult',
            'hard time',
            'overwhelmed',
            'stressed',
            'anxious',
            'depressed',
            'sad',
            'frustrated',
            'worried',
            'scared',
            'alone',
            'tired',
            'exhausted'
        ]
        const needsSupport = supportKeywords.some(keyword => lowerMessage.includes(keyword))

        // Check for venting language
        const ventingKeywords = [
            'ugh',
            'why does',
            'i hate',
            'so annoying',
            "can't believe",
            'terrible day',
            'worst',
            'fed up',
            'so done',
            'sick of',
            'annoying',
            'frustrated with'
        ]
        const isVenting = ventingKeywords.some(keyword => lowerMessage.includes(keyword))

        // Check for conversational language
        const conversationalKeywords = [
            'how are you',
            "what's up",
            'hey',
            'hi',
            'hello',
            'good morning',
            'good afternoon',
            'good evening',
            'good night',
            'whats up',
            'sup',
            'yo',
            'howdy'
        ]
        const isConversational = conversationalKeywords.some(keyword => lowerMessage.includes(keyword))

        // Check for gratitude
        const gratitudeKeywords = ['thank you', 'thanks', 'appreciate', 'grateful', 'helped me', 'thank u', 'thx', 'ty']
        const isGratitude = gratitudeKeywords.some(keyword => lowerMessage.includes(keyword))

        // Check recent history for crisis or difficult conversations
        const hasRecentCrisis = recentHistory.some(
            msg =>
                msg.content &&
                (msg.content.toLowerCase().includes('crisis') ||
                    msg.content.toLowerCase().includes('difficult') ||
                    msg.content.toLowerCase().includes('support') ||
                    msg.content.toLowerCase().includes('help'))
        )

        return {
            isQuestion,
            needsSupport,
            isVenting,
            isConversational,
            isGratitude,
            hasRecentCrisis,
            messageLength: message.length,
            recentMessageCount: recentHistory.length
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

    /**
     * Get late-night companion mode instructions based on user's timezone
     * @param {string} timezone - User's timezone preference
     * @returns {string} - Additional instructions for late-night mode
     */
    getLateNightInstructions(timezone) {
        if (!timezone) {
            return '' // No timezone set, skip late-night mode
        }

        // Use timezone string directly - no validation needed for timezone identifiers
        const timePeriod = getTimePeriod(timezone)
        const sleepSuggestion = getSleepSuggestion(timezone)

        let instructions = ''

        if (isLateNight(timezone)) {
            instructions += `

**Late-Night Companion Mode Active**
- It's currently late night (${timePeriod}) in the user's timezone
- Use a calmer, more gentle tone than usual
- Be extra supportive and understanding - late nights can be difficult emotionally
- Acknowledge that late-night thoughts and feelings can feel more intense
- If appropriate, gently suggest relaxation techniques or coping strategies
- Be present and patient - avoid rushing the conversation
- Consider the user might be dealing with insomnia, anxiety, or emotional struggles
- Offer comfort without judgment about being up late`

            if (sleepSuggestion) {
                instructions += `
- Sleep hygiene note: ${sleepSuggestion}`
            }
        } else if (isEarlyMorning(timezone)) {
            instructions += `

**Early Morning Mode Active**
- It's currently early morning (${timePeriod}) in the user's timezone
- The user might be starting their day or having trouble sleeping
- Use gentle, warm language appropriate for the morning
- Consider offering positive affirmations for the day ahead
- Be mindful they might be feeling groggy or need gentle encouragement`

            if (sleepSuggestion) {
                instructions += `
- Morning wellness note: ${sleepSuggestion}`
            }
        } else if (isLateEvening(timezone)) {
            instructions += `

**Evening Wind-Down Mode**
- It's currently late evening (${timePeriod}) in the user's timezone
- The user might be winding down from their day
- Use calming, reflective language
- Consider offering relaxation suggestions if appropriate
- Be supportive of end-of-day reflections and feelings`
        }

        return instructions
    }

    async getCopingResponse({ tool, feeling, userId, context = {} }) {
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

            // Determine if this is a DM context
            const isDM = !context.guildId

            const prompt = await buildCopingPrompt({ tool, feeling, userId, db, isDM })

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

    /**
     * Check if AI service is properly connected and initialized
     * @returns {boolean} Whether the AI service is connected and ready
     */
    isConnected() {
        return this.config !== null && this.model !== null
    }

    /**
     * Generate Twitter content for social media posting
     * @param {Object} options - Content generation options
     * @param {string} options.type - Content type (dailyTip, weeklyUpdate, awarenessPost, etc.)
     * @param {string} [options.topic] - Specific topic to focus on
     * @param {string} [options.mood] - Target mood/tone
     * @param {number} [options.maxLength] - Maximum character length (default: 240)
     * @returns {Promise<string>} Generated Twitter content
     */
    async generateTwitterContent({ type, topic = null, mood = 'supportive', maxLength = 240 }) {
        if (!this.isConnected()) {
            throw new Error('AI service not connected')
        }

        try {
            let systemPrompt = ''
            let temperature = 0.7

            switch (type) {
                case 'dailyTip':
                    systemPrompt = `You are Mellow, a supportive mental health Discord bot. Generate a helpful, empathetic mental health tip for Twitter/X.

Requirements:
- Keep it under ${maxLength} characters to leave room for hashtags
- Be supportive and encouraging
- Include actionable advice
- Use warm, friendly tone
- Avoid medical advice or diagnosis
- Focus on general wellness and coping strategies
- Make it accessible to everyone

${topic ? `Focus on the topic: ${topic}` : ''}
${mood ? `Use a ${mood} tone` : ''}

Generate only the tweet text, no quotes or additional formatting.`
                    temperature = 0.7
                    break

                case 'weeklyUpdate':
                    systemPrompt = `You are Mellow, a supportive mental health Discord bot. Generate a weekly update tweet about mental health awareness or community support.

Requirements:
- Keep it under ${maxLength} characters
- Share encouraging statistics, facts, or community highlights
- Be positive and hopeful
- Include a call to action or engagement
- Focus on community and support
- Make it inspiring

${topic ? `Focus on the topic: ${topic}` : ''}

Generate only the tweet text, no quotes or additional formatting.`
                    temperature = 0.6
                    break

                case 'awarenessPost':
                    systemPrompt = `You are Mellow, a supportive mental health Discord bot. Generate an educational mental health awareness tweet.

Requirements:
- Keep it under ${maxLength} characters
- Share important mental health information
- Be informative but not overwhelming
- Include hope and support
- Encourage seeking help when needed
- Be inclusive and accessible

${topic ? `Focus on the topic: ${topic}` : ''}

Generate only the tweet text, no quotes or additional formatting.`
                    temperature = 0.5
                    break

                case 'crisisSupport':
                    systemPrompt = `You are Mellow, a supportive mental health Discord bot. Generate a compassionate tweet about crisis support and resources.

Requirements:
- Keep it under ${maxLength} characters
- Be extremely gentle and supportive
- Include hope and encouragement
- Mention that help is available
- Be careful not to be triggering
- Focus on hope and recovery

Generate only the tweet text, no quotes or additional formatting.`
                    temperature = 0.4
                    break

                case 'motivational':
                    systemPrompt = `You are Mellow, a supportive mental health Discord bot. Generate a motivational tweet to inspire and uplift.

Requirements:
- Keep it under ${maxLength} characters
- Be genuinely encouraging
- Include positive affirmations
- Focus on strength and resilience
- Be authentic and not overly cheerful
- Include actionable inspiration

${topic ? `Focus on the topic: ${topic}` : ''}

Generate only the tweet text, no quotes or additional formatting.`
                    temperature = 0.6
                    break

                default:
                    systemPrompt = `You are Mellow, a supportive mental health Discord bot. Generate appropriate mental health content for Twitter/X.

Requirements:
- Keep it under ${maxLength} characters
- Be supportive and helpful
- Use appropriate tone for mental health content
- Avoid medical advice
- Focus on wellness and support

${topic ? `Focus on the topic: ${topic}` : ''}

Generate only the tweet text, no quotes or additional formatting.`
                    temperature = 0.7
            }

            // Generate the content
            const response = await generateText({
                model: this.model,
                prompt: systemPrompt,
                temperature,
                maxTokens: 150
            })

            // Clean and validate the response
            let content = response.text?.trim() || ''

            // Remove quotes and formatting
            content = content.replace(/^["']|["']$/g, '')
            content = content.replace(/^\w+:\s*/, '') // Remove "Tweet:" prefixes
            content = content.trim()

            // Ensure it's not too long
            if (content.length > maxLength) {
                content = content.substring(0, maxLength - 3) + '...'
            }

            // Validate content isn't empty
            if (!content || content.length < 10) {
                throw new Error('Generated content too short or empty')
            }

            return content
        } catch (error) {
            console.error('Failed to generate Twitter content:', error)
            throw new Error(`Twitter content generation failed: ${error.message}`)
        }
    }

    /**
     * Generate meme content based on a template or topic
     * @param {Object} options - Meme generation options
     * @param {string} [options.template] - Specific meme template to use (e.g., "distracted boyfriend", "drake")
     * @param {string} [options.topic] - Topic to create a meme about
     * @param {string} [options.mood] - Mood of the meme (funny, wholesome, relatable)
     * @param {string} [options.context] - Additional context for the meme
     * @param {boolean} [options.mentalHealthFocused=false] - Whether to focus on mental health themes
     * @returns {Promise<Object>} Object containing meme text content and image URL
     */
    async generateMemeContent({ template, topic, mood = 'funny', context = '', mentalHealthFocused = false }) {
        if (!this.isConnected()) {
            throw new Error('AI service not connected')
        }

        try {
            // Set up appropriate temperature based on creativity needs
            const temperature = 0.8 // Higher temperature for more creative outputs

            // Build the system prompt based on the meme type
            let systemPrompt = `You are Mellow, a mental health support bot with a good sense of humor. Generate content for a meme based on the following parameters:

${template ? `Meme template: ${template}` : ''}
${topic ? `Topic: ${topic}` : ''}
Mood: ${mood}
${context ? `Additional context: ${context}` : ''}
${mentalHealthFocused ? 'This should be mental health focused and supportive.' : ''}

Your response should include:
- A title for the meme
- Top text (what would go on the top of the meme)
- Bottom text (what would go on the bottom of the meme)
- A brief description of the image that would work for this meme

Rules:
- Keep text short and punchy - meme text should be brief
- Be appropriate for all audiences
- If using a mental health topic, be supportive and never mock mental health issues
- Avoid politically divisive content
- Make it relatable and humorous without being offensive
- If using a specific template, match the format to that template's typical use
`

            // Add template-specific instructions
            if (template) {
                const templateGuides = {
                    'distracted boyfriend': `This meme shows a man looking at another woman while his girlfriend looks shocked/angry.
- Label the boyfriend as someone being distracted from something important
- Label the "other woman" as something tempting but less important
- Label the girlfriend as the important thing being ignored`,

                    'drake': `This meme shows Drake refusing something (top panel) and approving something else (bottom panel).
- Top text should be something rejected or disliked
- Bottom text should be something preferred or better`,

                    'expanding brain': `This meme shows increasingly glowing brains representing progressively more "enlightened" ideas.
- Provide 3-4 escalating concepts from basic to absurd/transcendent`,

                    'two buttons': `This meme shows someone sweating while deciding between two buttons.
- The two options should represent a difficult or contradictory choice`,

                    'change my mind': `This meme shows someone at a table with a "change my mind" sign.
- Provide a statement that would go on the sign - something controversial but not offensive`,

                    'this is fine': `This meme shows a dog sitting in a burning room saying "this is fine".
- Context should involve ignoring obvious problems`,

                    'pointing spider-man': `This meme shows two Spider-Men pointing at each other.
- The two things should be similar or identical in an ironic way`
                }

                if (templateGuides[template.toLowerCase()]) {
                    systemPrompt += `\n\nTemplate-specific instructions:\n${templateGuides[template.toLowerCase()]}`
                }
            }

            // For mental health focus, add additional guidelines
            if (mentalHealthFocused) {
                systemPrompt += `\n\nMental Health Guidelines:
- Focus on supportive, positive humor
- Avoid content that could be triggering
- Emphasize coping, growth, or shared experiences
- When possible, include an element of hope or encouragement
- Validate feelings while remaining lighthearted
- Never mock symptoms, treatments, or struggles`
            }

            // Generate the meme content
            const { text: fullResponse } = await generateText({
                model: this.model,
                messages: [{ role: 'system', content: systemPrompt }],
                temperature,
                maxTokens: this.config.maxTokens,
                presencePenalty: 0.4,
                frequencyPenalty: 0.4
            })

            // Parse the response into structured sections
            const memeContent = this.parseMemeContent(fullResponse)

            // Generate or retrieve the actual meme image
            const imageUrl = await this.generateMemeImage({
                template: template?.toLowerCase(),
                topText: memeContent.topText,
                bottomText: memeContent.bottomText,
                title: memeContent.title
            })

            // Add the image URL to the meme content
            memeContent.imageUrl = imageUrl

            return memeContent
        } catch (error) {
            console.error('Failed to generate meme content:', error)
            throw new Error(`Meme generation failed: ${error.message}`)
        }
    }

    /**
     * Generate an actual meme image based on template and text
     * @param {Object} options - Image generation options
     * @param {string} options.template - Meme template name
     * @param {string} options.topText - Text for top of the meme
     * @param {string} options.bottomText - Text for bottom of the meme
     * @param {string} options.title - Title of the meme (used for some APIs)
     * @returns {Promise<string>} URL to the generated meme image
     */
    async generateMemeImage({ template, topText, bottomText, title }) {
        try {
            // Map of template names to template IDs for the ImgFlip API
            const templateMap = {
                'distracted boyfriend': '112126428',
                'drake': '181913649',
                'expanding brain': '93895088',
                'two buttons': '87743020',
                'change my mind': '129242436',
                'this is fine': '55311130',
                'pointing spider-man': '133052762'
            }

            // Use a fallback template if the specified one doesn't exist
            const templateId = templateMap[template] || '181913649' // Drake as default

            // Get API credentials - ImgFlip requires these for meme generation
            const username = process.env.IMGFLIP_USERNAME
            const password = process.env.IMGFLIP_PASSWORD

            // If we have credentials, use ImgFlip API
            if (username && password) {
                try {
                    // ImgFlip API endpoint
                    const imgflipApiUrl = 'https://api.imgflip.com/caption_image'

                    // Prepare request parameters
                    const params = new URLSearchParams()
                    params.append('template_id', templateId)
                    params.append('username', username)
                    params.append('password', password)

                    // Add text parameters - ensure they're not empty
                    params.append('text0', topText?.trim() || ' ')
                    params.append('text1', bottomText?.trim() || ' ')
                    params.append('font', 'impact')

                    // Make the API request to generate the meme
                    const response = await fetch(imgflipApiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: params
                    })

                    const data = await response.json()

                    if (data.success) {
                        console.log('Meme successfully generated with ImgFlip API')
                        return data.data.url
                    } else {
                        throw new Error(`ImgFlip API error: ${data.error_message}`)
                    }
                } catch (apiError) {
                    console.error('Error using ImgFlip API:', apiError)
                    throw apiError // Let the outer catch handle the fallback
                }
            } else {
                // No credentials, throw error to trigger fallback
                throw new Error('ImgFlip credentials not configured')
            }
        } catch (error) {
            console.error('Failed to generate meme image:', error)
            log(
                'ImgFlip API requires authentication. Set IMGFLIP_USERNAME and IMGFLIP_PASSWORD in your environment variables.',
                'warn'
            )

            // Generate a URL that encodes the meme text directly - using memegen.link instead
            // This service doesn't require authentication and will render text on the image
            try {
                // Base URL for a text-on-image service
                let memeGeneratorUrl = 'https://memegen.link'

                // Map template names to memegen.link templates
                const memegenTemplates = {
                    'drake': 'drake',
                    'distracted boyfriend': 'distracted',
                    'expanding brain': 'expandingbrain',
                    'two buttons': 'choicememe',
                    'change my mind': 'changemymind',
                    'this is fine': 'fine',
                    'pointing spider-man': 'spiderman'
                }

                // Get the template name for memegen
                const memegenTemplate = memegenTemplates[template] || 'drake'

                // Prepare text for URL encoding
                const topTextEncoded = topText ? encodeURIComponent(topText.trim()) : '_'
                const bottomTextEncoded = bottomText ? encodeURIComponent(bottomText.trim()) : '_'

                // Build the URL
                const memeUrl = `${memeGeneratorUrl}/${memegenTemplate}/${topTextEncoded}/${bottomTextEncoded}.jpg`

                console.log(`Using fallback meme generator: ${memeUrl}`)
                return memeUrl
            } catch (fallbackError) {
                console.error('Fallback meme generation also failed:', fallbackError)

                // Ultimate fallback - return template images with no text
                const fallbackImageUrls = {
                    'distracted boyfriend': 'https://i.imgflip.com/1ur9b0.jpg',
                    'drake': 'https://i.imgflip.com/30b1gx.jpg',
                    'expanding brain': 'https://i.imgflip.com/1jwhww.jpg',
                    'two buttons': 'https://i.imgflip.com/1g8my4.jpg',
                    'change my mind': 'https://i.imgflip.com/24y43o.jpg',
                    'this is fine': 'https://i.imgflip.com/2cp1.jpg',
                    'pointing spider-man': 'https://i.imgflip.com/1tkjq9.jpg'
                }

                log(`Using plain template image for meme template: ${template}`, 'warn')
                return fallbackImageUrls[template] || 'https://i.imgflip.com/30b1gx.jpg' // Drake as default
            }
        }
    }

    /**
     * Parse AI-generated meme content into structured format
     * @param {string} response - AI response text
     * @returns {Object} Parsed meme content
     */
    parseMemeContent(response) {
        const content = {
            title: '',
            topText: '',
            bottomText: '',
            imageDescription: '',
            imageUrl: '' // This will be populated by generateMemeImage
        }

        // Extract sections using regex
        const titleMatch = response.match(/Title:?\s*([^\n]+)/i)
        const topTextMatch = response.match(/Top Text:?\s*([^\n]+)/i)
        const bottomTextMatch = response.match(/Bottom Text:?\s*([^\n]+)/i)
        const descriptionMatch = response.match(/(?:Image )?Description:?\s*([^\n]+(?:\n[^\n]+)*)/i)

        if (titleMatch && titleMatch[1]) content.title = titleMatch[1].trim()
        if (topTextMatch && topTextMatch[1]) content.topText = topTextMatch[1].trim()
        if (bottomTextMatch && bottomTextMatch[1]) content.bottomText = bottomTextMatch[1].trim()

        // For the image description, we might have multiple lines
        if (descriptionMatch && descriptionMatch[1]) {
            content.imageDescription = descriptionMatch[1].trim()
        }

        // If we couldn't parse the format properly, use fallback approach
        if (!content.topText && !content.bottomText) {
            const lines = response.split('\n').filter(line => line.trim())

            // If we have at least 2 lines and no parsed content, use the lines directly
            if (lines.length >= 2) {
                if (!content.title) content.title = lines[0].trim()
                if (!content.topText) content.topText = lines[1].trim()
                if (lines.length >= 3 && !content.bottomText) content.bottomText = lines[2].trim()
            }
        }

        return content
    }
}

export const aiService = new AIService()
