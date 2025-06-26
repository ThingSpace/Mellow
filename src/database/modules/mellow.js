/**
 * MellowModule - Database operations for Mellow AI configuration
 *
 * This module provides a flexible interface for managing Mellow AI configuration data in the database.
 * It handles AI model settings, temperature controls, token limits, and feature toggles.
 * Mellow configuration is a singleton - only one record should exist.
 *
 * @class MellowModule
 */
export class MellowModule {
    /**
     * Creates a new MellowModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
        this.SINGLETON_ID = 1 // Fixed ID for the single Mellow configuration
    }

    /**
     * Gets the single Mellow configuration record
     * Creates it with defaults if it doesn't exist
     *
     * @param {Object} [options={}] - Additional Prisma options
     * @returns {Promise<Object>} The Mellow configuration record
     *
     * @example
     * const config = await mellowModule.get()
     * console.log(`Mellow is ${config.enabled ? 'enabled' : 'disabled'}`)
     */
    async get(options = {}) {
        let config = await this.prisma.mellow.findUnique({
            where: { id: this.SINGLETON_ID },
            ...options
        })

        if (!config) {
            // Create default configuration if it doesn't exist
            config = await this.createDefault()
        }

        return config
    }

    /**
     * Creates the default Mellow configuration (singleton)
     *
     * @returns {Promise<Object>} The created Mellow configuration record
     *
     * @example
     * const config = await mellowModule.createDefault()
     */
    async createDefault() {
        return this.prisma.mellow.create({
            data: {
                id: this.SINGLETON_ID,
                model: 'gpt-3.5-turbo',
                temperature: 0.6,
                presencePenalty: 0.6,
                frequencyPenalty: 0.5,
                maxTokens: 300,
                enabled: true,
                checkInTools: true,
                copingTools: true,
                ghostTools: true,
                crisisTools: true,
                owners: ['510065483693817867', '896951964234043413', '787241442770419722'],
                feedbackLogs: '1387604970999906334',
                reportLogs: '1387605025857212447',
                serverId: '957420716142252062',
                adminId: '957420716142252069',
                modId: '957420716142252067',
                logId: '1387375352837308526',
                prompt: `You are Mellow: an AI-powered mental health companion living inside Discord. You are not a therapist, but you are a safe, supportive, and empathetic presence for users to talk to when things feel heavy, confusing, or overwhelming.

**Your purpose:**
- Listen without judgment, reflect feelings, and offer gentle support.
- Encourage self-reflection and emotional awareness.
- Provide mood check-ins, gentle prompts, and space to vent (ghost letter mode).
- Share simple coping tools (grounding, breathing, affirmations) when asked.
- If a user expresses serious distress or crisis, gently recommend professional help or suggest reaching out to moderators — always private, never pushy.
- Be a calm, late-night companion for users who need someone to talk to at odd hours.

**Important:**
- Never diagnose, give medical advice, or claim to be a therapist.
- Always remind users that you are not a replacement for professional help.
- Respect privacy and encourage users to seek real-world support when needed.

**Tone & Style:**
- Warm, gentle, and non-judgmental.
- Use clear, simple language.
- Validate feelings and normalize seeking help.
- Keep responses under 2000 characters for Discord.
- Use Discord markdown for clarity (bold for emphasis, > for gentle notes, lists for steps).

**Sample phrases:**
- "I'm here for you. How are you feeling right now?"
- "It's okay to not have all the answers. Want to talk about what's on your mind?"
- "Remember, reaching out is a sign of strength."
- "> If you ever feel unsafe or in crisis, please consider talking to a professional or trusted person."

You are Mellow. You help users find moments of calm, safe conversations, and reminders that empathy matters, even online.`
            }
        })
    }

    /**
     * Updates the single Mellow configuration record
     *
     * @param {Object} data - Mellow configuration data to update
     * @returns {Promise<Object>} The updated Mellow configuration record
     *
     * @example
     * await mellowModule.update({
     *   temperature: 0.8,
     *   enabled: true,
     *   maxTokens: 400
     * })
     */
    async update(data) {
        return this.prisma.mellow.upsert({
            where: { id: this.SINGLETON_ID },
            update: data,
            create: {
                id: this.SINGLETON_ID,
                model: data.model || 'gpt-3.5-turbo',
                temperature: data.temperature || 0.6,
                presencePenalty: data.presencePenalty || 0.6,
                frequencyPenalty: data.frequencyPenalty || 0.5,
                maxTokens: data.maxTokens || 300,
                enabled: data.enabled !== undefined ? data.enabled : true,
                checkInTools: data.checkInTools !== undefined ? data.checkInTools : true,
                copingTools: data.copingTools !== undefined ? data.copingTools : true,
                ghostTools: data.ghostTools !== undefined ? data.ghostTools : true,
                crisisTools: data.crisisTools !== undefined ? data.crisisTools : true,
                owners: data.owners || ['510065483693817867', '896951964234043413', '787241442770419722'],
                feedbackLogs: data.feedbackLogs || '1387604970999906334',
                reportLogs: data.reportLogs || '1387605025857212447',
                serverId: data.serverId || '957420716142252062',
                adminId: data.adminId || '957420716142252069',
                modId: data.modId || '957420716142252067',
                logId: data.logId || '1387375352837308526',
                prompt: data.prompt || `You are Mellow: an AI-powered mental health companion...`
            }
        })
    }

    /**
     * Gets a formatted summary of current Mellow settings
     *
     * @returns {Promise<Object>} Formatted settings summary
     *
     * @example
     * const summary = await mellowModule.getSettingsSummary()
     * console.log(`Status: ${summary.status}`)
     * console.log(`Model: ${summary.model}`)
     * console.log(`Temperature: ${summary.temperature}`)
     */
    async getSettingsSummary() {
        const config = await this.get()

        return {
            status: config.enabled ? '🟢 Enabled' : '🔴 Disabled',
            model: config.model || 'gpt-3.5-turbo',
            temperature: config.temperature || 0.6,
            maxTokens: config.maxTokens || 300,
            presencePenalty: config.presencePenalty || 0.6,
            frequencyPenalty: config.frequencyPenalty || 0.5,
            features: {
                checkInTools: config.checkInTools ? '✅' : '❌',
                copingTools: config.copingTools ? '✅' : '❌',
                ghostTools: config.ghostTools ? '✅' : '❌',
                crisisTools: config.crisisTools ? '✅' : '❌'
            },
            owners: config.owners || [],
            serverId: config.serverId,
            adminId: config.adminId,
            modId: config.modId,
            logId: config.logId,
            feedbackLogs: config.feedbackLogs,
            reportLogs: config.reportLogs
        }
    }

    /**
     * Gets current AI model settings for API calls
     *
     * @returns {Promise<Object>} AI model configuration
     *
     * @example
     * const aiConfig = await mellowModule.getAIConfig()
     * // Use with OpenAI API
     * const response = await openai.chat.completions.create({
     *   model: aiConfig.model,
     *   temperature: aiConfig.temperature,
     *   max_tokens: aiConfig.maxTokens,
     *   // ... other options
     * })
     */
    async getAIConfig() {
        const config = await this.get()

        return {
            model: config.model || 'gpt-3.5-turbo',
            temperature: config.temperature || 0.6,
            presencePenalty: config.presencePenalty || 0.6,
            frequencyPenalty: config.frequencyPenalty || 0.5,
            maxTokens: config.maxTokens || 300,
            prompt: config.prompt
        }
    }

    /**
     * Checks if a user is an owner of Mellow
     *
     * @param {string|number} userId - Discord user ID to check
     * @returns {Promise<boolean>} Whether the user is an owner
     *
     * @example
     * const isOwner = await mellowModule.isOwner('123456789')
     * if (isOwner) {
     *   // User can modify Mellow settings
     * }
     */
    async isOwner(userId) {
        const config = await this.get()
        return config.owners && config.owners.includes(userId.toString())
    }

    /**
     * Adds a user as an owner
     *
     * @param {string|number} userId - Discord user ID to add as owner
     * @returns {Promise<Object>} Updated configuration
     *
     * @example
     * await mellowModule.addOwner('123456789')
     */
    async addOwner(userId) {
        const config = await this.get()
        const userIdStr = userId.toString()

        if (!config.owners.includes(userIdStr)) {
            const newOwners = [...config.owners, userIdStr]
            return this.update({ owners: newOwners })
        }

        return config
    }

    /**
     * Removes a user as an owner
     *
     * @param {string|number} userId - Discord user ID to remove as owner
     * @returns {Promise<Object>} Updated configuration
     *
     * @example
     * await mellowModule.removeOwner('123456789')
     */
    async removeOwner(userId) {
        const config = await this.get()
        const userIdStr = userId.toString()

        const newOwners = config.owners.filter(id => id !== userIdStr)
        return this.update({ owners: newOwners })
    }

    /**
     * Gets all enabled features
     *
     * @returns {Promise<Array>} Array of enabled feature names
     *
     * @example
     * const enabledFeatures = await mellowModule.getEnabledFeatures()
     * console.log('Enabled features:', enabledFeatures)
     */
    async getEnabledFeatures() {
        const config = await this.get()
        const features = []

        if (config.checkInTools) features.push('checkInTools')
        if (config.copingTools) features.push('copingTools')
        if (config.ghostTools) features.push('ghostTools')
        if (config.crisisTools) features.push('crisisTools')

        return features
    }

    /**
     * Validates the current configuration
     *
     * @returns {Promise<Object>} Validation result with any issues
     *
     * @example
     * const validation = await mellowModule.validateConfig()
     * if (validation.isValid) {
     *   console.log('Configuration is valid')
     * } else {
     *   console.log('Issues found:', validation.issues)
     * }
     */
    async validateConfig() {
        const config = await this.get()
        const issues = []

        // Validate temperature
        if (config.temperature < 0 || config.temperature > 2) {
            issues.push('Temperature must be between 0 and 2')
        }

        // Validate max tokens
        if (config.maxTokens < 1 || config.maxTokens > 4000) {
            issues.push('Max tokens must be between 1 and 4000')
        }

        // Validate presence penalty
        if (config.presencePenalty < -2 || config.presencePenalty > 2) {
            issues.push('Presence penalty must be between -2 and 2')
        }

        // Validate frequency penalty
        if (config.frequencyPenalty < -2 || config.frequencyPenalty > 2) {
            issues.push('Frequency penalty must be between -2 and 2')
        }

        // Validate model
        const validModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview']
        if (!validModels.includes(config.model)) {
            issues.push(`Model must be one of: ${validModels.join(', ')}`)
        }

        return {
            isValid: issues.length === 0,
            issues,
            config
        }
    }

    /**
     * Checks if Mellow is enabled
     *
     * @returns {Promise<boolean>} Whether Mellow is enabled
     *
     * @example
     * const isEnabled = await mellowModule.isEnabled()
     * if (isEnabled) {
     *   // Mellow is active
     * }
     */
    async isEnabled() {
        const config = await this.get()
        return config.enabled
    }

    /**
     * Toggles Mellow on/off
     *
     * @param {boolean} [enabled] - Specific state to set (if not provided, toggles current state)
     * @returns {Promise<Object>} The updated Mellow configuration record
     *
     * @example
     * // Toggle current state
     * await mellowModule.toggle()
     *
     * // Set specific state
     * await mellowModule.toggle(true)  // Enable
     * await mellowModule.toggle(false) // Disable
     */
    async toggle(enabled = null) {
        const config = await this.get()
        const newState = enabled !== null ? enabled : !config.enabled

        return this.update({ enabled: newState })
    }

    /**
     * Resets Mellow configuration to defaults
     *
     * @returns {Promise<Object>} The reset Mellow configuration record
     *
     * @example
     * await mellowModule.reset()
     */
    async reset() {
        return this.prisma.mellow
            .delete({
                where: { id: this.SINGLETON_ID }
            })
            .then(() => this.createDefault())
    }

    /**
     * Legacy method - redirects to get() for backward compatibility
     * @deprecated Use get() instead
     */
    async findById(id, options = {}) {
        if (id !== this.SINGLETON_ID) {
            throw new Error('MellowModule only supports singleton configuration with ID 1')
        }
        return this.get(options)
    }

    /**
     * Legacy method - not supported for singleton
     * @deprecated MellowModule only supports singleton configuration
     */
    async create(data) {
        throw new Error('MellowModule only supports singleton configuration. Use update() to modify settings.')
    }

    /**
     * Legacy method - not supported for singleton
     * @deprecated MellowModule only supports singleton configuration
     */
    async findMany(args = {}) {
        throw new Error('MellowModule only supports singleton configuration. Use get() to retrieve settings.')
    }

    /**
     * Legacy method - not supported for singleton
     * @deprecated MellowModule only supports singleton configuration
     */
    async delete(id) {
        throw new Error('MellowModule only supports singleton configuration. Use reset() to reset to defaults.')
    }
}
