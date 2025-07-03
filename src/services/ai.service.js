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
            if (messageAnalysis.needsSupport) {
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
- This seems like casual conversation
- Be friendly and natural
- Avoid being overly therapeutic or formal
- Match their energy and tone appropriately`
            }

            // Add memory of recent conversations
            if (messageAnalysis.hasRecentCrisis) {
                contextPrompt += `\n\n**Continuity Note:** This user has had recent difficult conversations with you. Be mindful of their ongoing journey and reference it naturally if appropriate.`
            }

            const personality = userPrefs?.aiPersonality || 'gentle'
            contextPrompt += this.getPersonalityInstructions(personality)

            // Generate response with smart context
            const messages = [
                { role: 'system', content: contextPrompt },
                ...recentHistory.slice(-5), // Last 5 messages for context
                { role: 'user', content: message }
            ]

            const { text: response } = await generateText({
                model: this.model,
                messages,
                temperature: this.config.temperature + 0.1, // Slightly more creative for DMs
                maxTokens: this.config.maxTokens,
                presencePenalty: this.config.presencePenalty,
                frequencyPenalty: this.config.frequencyPenalty + 0.2 // Reduce repetition
            })

            return this.messageFormatting.formatForDiscord(response)
        } catch (error) {
            console.error('Error generating smart DM response:', error)
            // Fallback to regular response
            return this.generateResponse(message, userId, context)
        }
    }

    /**
     * Analyze message intent and context
     * @param {string} message - User's message
     * @param {Array} recentHistory - Recent conversation history
     * @returns {Object} - Analysis of message intent
     */
    async analyzeMessageIntent(message, recentHistory) {
        const lowerMessage = message.toLowerCase()

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
            'frustrated'
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
            'fed up'
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
            'good night',
            'thanks',
            'thank you'
        ]
        const isConversational = conversationalKeywords.some(keyword => lowerMessage.includes(keyword))

        // Check recent history for crisis or difficult conversations
        const hasRecentCrisis = recentHistory.some(
            msg =>
                msg.content &&
                (msg.content.toLowerCase().includes('crisis') ||
                    msg.content.toLowerCase().includes('difficult') ||
                    msg.content.toLowerCase().includes('support'))
        )

        return {
            needsSupport,
            isVenting,
            isConversational,
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
}

export const aiService = new AIService()
