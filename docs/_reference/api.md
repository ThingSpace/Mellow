---
layout: default
title: API Reference
nav_order: 6
description: 'Technical API documentation for developers and advanced users'
collection: reference
---

# API Reference

> **Developer Quick Links**
>
> -   [REST API Documentation](#rest-api)
> -   [OpenAPI/Swagger Spec](#openapi-spec)
> -   [GitHub Repository](https://github.com/ThingSpace/Mellow)
>
> _For bot command integration, see the [Commands Reference](commands.md)._

## 🏗️ Architecture Overview

Mellow is built with modern Node.js technologies:

-   **Backend**: Node.js with Discord.js v14
-   **Database**: PostgreSQL with Prisma ORM
-   **AI Integration**: OpenAI API for crisis detection
-   **Deployment**: Docker-ready with environment configuration

## 🗄️ Database Schema

### Core Models

#### User

```prisma
model User {
  id          BigInt   @id
  username    String?
  role        Role     @default(USER)
  isBanned    Boolean  @default(false)
  banReason   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  preferences      UserPreferences?
  moodCheckIns     MoodCheckIn[]
  ghostLetters     GhostLetter[]
  feedback         Feedback[]
  reports          Report[]
  copingToolUsage  CopingToolUsage[]
}
```

#### MoodCheckIn

```prisma
model MoodCheckIn {
  id            String   @id @default(cuid())
  userId        BigInt
  mood          String
  intensity     Int      // 1-5 scale
  activities    String[] // Array of activities
  notes         String?
  nextCheckIn   DateTime?
  createdAt     DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

#### UserPreferences

```prisma
model UserPreferences {
  userId              BigInt   @id
  checkInInterval     Int      @default(24) // hours
  aiPersonality       String   @default("supportive")
  themeColor          String   @default("purple")
  language            String   @default("en")
  journalVisibility   String   @default("private")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}
```

### Guild Configuration

#### Guild

```prisma
model Guild {
  id                    BigInt   @id
  name                  String?
  crisisAlertsChannel   String?
  modLogsChannel        String?
  checkInsChannel       String?
  systemLogsChannel     String?

  // Feature toggles
  checkInsEnabled       Boolean  @default(true)
  ghostLettersEnabled   Boolean  @default(true)
  crisisAlertsEnabled   Boolean  @default(true)
  systemLogsEnabled     Boolean  @default(false)

  // Moderation settings
  autoModEnabled        Boolean  @default(false)
  crisisSensitivity     String   @default("medium")
  timeoutRole           String?
  moderatorRole         String?
  adminRole            String?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

## 🔧 Core Services

### AI Service

The AI service provides comprehensive mental health support with advanced features including crisis detection, personalized responses, and time-aware companion modes.

```javascript
// filepath: src/services/ai.service.js

class AIService {
    /**
     * Generate personalized AI response with context and personality
     * @param {string} message - User's message
     * @param {string} userId - Discord user ID
     * @param {Object} context - Additional context (channelId, guildId, etc.)
     * @returns {Promise<Object>} AI response with formatting and crisis analysis
     */
    async generateResponse(message, userId, context = {}) {
        // Returns: {
        //   text: string,
        //   crisisDetected: boolean,
        //   severity: string,
        //   resources: Array,
        //   needsModAlert: boolean
        // }
    }

    /**
     * Analyze message for crisis indicators with multi-level detection
     * @param {string} message - Message content
     * @param {Object} user - User context including history
     * @returns {Promise<Object>} Comprehensive crisis analysis
     */
    async analyzeCrisis(message, user) {
        // Returns: {
        //   severity: 'safe'|'low'|'medium'|'high'|'critical',
        //   confidence: number,
        //   resources: Array,
        //   action: string,
        //   needsModAlert: boolean,
        //   keywords: Array
        // }
    }

    /**
     * Get AI-powered crisis support resources based on user context
     * @param {Object} context - User crisis context and recent events
     * @param {string} userId - User ID for personality preferences
     * @returns {Promise<Object>} Structured crisis resources with AI guidance
     */
    async getCrisisResources(context, userId = null) {
        // Returns: {
        //   immediate: Array,    // Immediate safety actions
        //   hotlines: Array,     // Crisis hotlines and contacts
        //   coping: Array,       // Immediate coping strategies
        //   longterm: Array,     // Long-term support options
        //   aiResponse: string   // Personalized AI message
        // }
    }

    /**
     * Generate personalized coping tool suggestions
     * @param {string} mood - Current mood state
     * @param {Array} history - Recent check-ins and tool usage
     * @param {Object} preferences - User personality and preferences
     * @returns {Promise<Array>} AI-curated coping tool recommendations
     */
    async suggestCopingTools(mood, history, preferences) {
        // Returns array of personalized tool suggestions with reasoning
    }

    /**
     * Get personality-specific instructions for AI responses
     * @param {string} personality - User's preferred AI personality
     * @returns {string} Additional instructions for personality adaptation
     */
    getPersonalityInstructions(personality) {
        // Supports: gentle, supportive, direct, playful, professional, encouraging
    }

    /**
     * Get late-night companion mode instructions based on user's timezone
     * @param {string} timezone - User's timezone preference
     * @returns {string} Time-appropriate response instructions
     */
    getLateNightInstructions(timezone) {
        // Provides time-aware response adaptation:
        // - Late-night mode (10 PM - 6 AM): Gentle, calming responses
        // - Early morning mode (6 AM - 10 AM): Encouraging support
        // - Evening wind-down (8 PM - 10 PM): Reflective, calming
        // - Standard mode: Regular supportive interactions
    }
}
```

### Crisis Detection System

Advanced multi-layered crisis detection with AI and keyword-based backup systems.

```javascript
// Crisis Detection Flow:
// 1. OpenAI Moderation API analysis
// 2. Custom AI crisis severity assessment
// 3. Keyword-based backup detection
// 4. Context-aware resource provision
// 5. Automated moderator alerts (when configured)

// Crisis Severity Levels:
const CRISIS_LEVELS = {
    SAFE: 'safe', // No crisis indicators detected
    LOW: 'low', // Mild distress, general support needed
    MEDIUM: 'medium', // Moderate distress, coping resources provided
    HIGH: 'high', // Significant distress, immediate support + mod alert
    CRITICAL: 'critical' // Severe crisis, emergency resources + urgent mod alert
}
```

### Database Service

Abstraction layer for database operations with user safety.

```javascript
// filepath: src/services/database.service.js

class DatabaseService {
    constructor(prisma) {
        this.prisma = prisma
        this.users = new UserRepository(prisma)
        this.guilds = new GuildRepository(prisma)
        this.moods = new MoodRepository(prisma)
    }
}

class UserRepository {
    /**
     * Find or create user with safety checks
     * @param {BigInt} userId - Discord user ID
     * @returns {Promise<User>} User object
     */
    async findOrCreate(userId) {
        // Implements ban checking and user creation
    }

    /**
     * Ban user from using Mellow
     * @param {BigInt} userId - User to ban
     * @param {string} reason - Ban reason
     */
    async ban(userId, reason) {
        // Implements user banning with logging
    }
}
```

### Reminder Service

Automated check-in reminder system.

```javascript
// filepath: src/services/reminder.service.js

class ReminderService {
    /**
     * Check for users needing reminders
     * @returns {Promise<void>}
     */
    async checkReminders() {
        // Runs every 5 minutes to send check-in reminders
    }

    /**
     * Send reminder to specific user
     * @param {Object} user - User object
     * @returns {Promise<boolean>} Success status
     */
    async sendReminder(user) {
        // Sends DM reminder with error handling
    }
}
```

## 🎯 Command System

### Command Structure

All commands follow a consistent structure:

```javascript
export default {
    structure: {
        name: 'command-name',
        category: 'Category',
        description: 'Command description',
        handlers: {
            cooldown: 15000, // 15 seconds
            requiredRoles: [] // Required Mellow roles
        },
        options: [
            {
                name: 'option-name',
                description: 'Option description',
                required: false,
                type: 3 // STRING type
            }
        ]
    },

    run: async (client, interaction) => {
        // Command implementation
    }
}
```

### Permission System

Mellow implements a dual permission system:

#### Discord Permissions

```javascript
// Check Discord server permissions
const hasPermission = interaction.member.permissions.has('MODERATE_MEMBERS')
```

#### Mellow Role System

```javascript
// Check Mellow database roles
const user = await client.db.users.findById(interaction.user.id)
const allowedRoles = ['ADMIN', 'MOD']
const hasAccess = allowedRoles.includes(user.role)
```

## 🚨 Crisis Detection System

### Analysis Pipeline

1. **Keyword Detection** - Basic pattern matching
2. **AI Analysis** - OpenAI-powered context understanding
3. **Severity Classification** - 5-level crisis scale
4. **Response Generation** - Appropriate resources and actions
5. **Escalation** - Moderator alerts for high-risk situations

### Severity Levels

```javascript
const CRISIS_LEVELS = {
    1: { name: 'Low Risk', action: 'provide_resources' },
    2: { name: 'Mild Concern', action: 'gentle_intervention' },
    3: { name: 'Moderate Risk', action: 'active_support' },
    4: { name: 'High Risk', action: 'immediate_help' },
    5: { name: 'Crisis', action: 'emergency_response' }
}
```

### Implementation

```javascript
/**
 * Analyze message for crisis indicators
 * @param {string} content - Message content
 * @param {Object} context - User and guild context
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeCrisis(content, context) {
    // Keyword detection
    const keywordMatch = detectCrisisKeywords(content)

    // AI analysis
    const aiAnalysis = await aiService.analyzeCrisis(content, context)

    // Combine results
    const severity = Math.max(keywordMatch.severity, aiAnalysis.severity)

    return {
        severity,
        confidence: aiAnalysis.confidence,
        keywords: keywordMatch.keywords,
        resources: generateResources(severity),
        action: determineAction(severity)
    }
}
```

## 📊 Analytics & Insights

### Mood Analysis

```javascript
/**
 * Calculate mood insights for user
 * @param {BigInt} userId - User ID
 * @param {string} timeframe - 'week', 'month', 'all'
 * @returns {Promise<Object>} Insights object
 */
async function calculateMoodInsights(userId, timeframe) {
    const checkIns = await getMoodCheckIns(userId, timeframe)

    return {
        totalCheckIns: checkIns.length,
        moodDistribution: calculateDistribution(checkIns),
        averageIntensity: calculateAverageIntensity(checkIns),
        mostFrequentMood: findMostFrequent(checkIns),
        activityVariety: calculateActivityVariety(checkIns),
        trends: analyzeTrends(checkIns)
    }
}
```

### Wellness Score

```javascript
/**
 * Calculate user wellness score
 * @param {Object} user - User object with relations
 * @returns {number} Wellness score (0-100)
 */
function calculateWellnessScore(user) {
    const factors = {
        checkInConsistency: calculateConsistency(user.moodCheckIns),
        copingToolUsage: calculateCopingUsage(user.copingToolUsage),
        moodStability: calculateMoodStability(user.moodCheckIns),
        engagementLevel: calculateEngagement(user)
    }

    // Weighted average of factors
    return Math.round(
        factors.checkInConsistency * 0.3 +
            factors.copingToolUsage * 0.25 +
            factors.moodStability * 0.25 +
            factors.engagementLevel * 0.2
    )
}
```

## 🔐 Security & Privacy

### Data Encryption

```javascript
// Sensitive data is encrypted before storage
const encryptedContent = await encrypt(sensitiveData, process.env.ENCRYPTION_KEY)
```

### Privacy Controls

```javascript
/**
 * Check if user data can be accessed
 * @param {BigInt} requesterId - User requesting data
 * @param {BigInt} targetId - User whose data is requested
 * @param {string} dataType - Type of data requested
 * @returns {boolean} Access granted
 */
function checkDataAccess(requesterId, targetId, dataType) {
    // Self-access always allowed
    if (requesterId === targetId) return true

    // Admin access for moderation
    const requester = await getUser(requesterId)
    if (['ADMIN', 'OWNER'].includes(requester.role)) return true

    // Private data types restricted
    if (['ghost_letters', 'detailed_moods'].includes(dataType)) return false

    return false
}
```

### Rate Limiting

```javascript
// Cooldown system prevents spam
const COOLDOWNS = new Map()

function checkCooldown(userId, commandName, cooldownMs) {
    const key = `${userId}-${commandName}`
    const lastUsed = COOLDOWNS.get(key)

    if (lastUsed && Date.now() - lastUsed < cooldownMs) {
        return false // Still on cooldown
    }

    COOLDOWNS.set(key, Date.now())
    return true // Cooldown passed
}
```

## 🔄 Event System

### Discord Events

```javascript
// Message handling with crisis detection
client.on('messageCreate', async message => {
    if (message.author.bot) return

    // Crisis detection
    const analysis = await analyzeCrisis(message.content, {
        user: message.author,
        guild: message.guild
    })

    if (analysis.severity >= 3) {
        await handleCrisisResponse(message, analysis)
    }
})
```

### Custom Events

```javascript
// Internal event system for logging
const EventEmitter = require('events')
const systemEvents = new EventEmitter()

// Emit events for logging
systemEvents.emit('user.checkin', { userId, mood, intensity })
systemEvents.emit('crisis.detected', { userId, severity, guildId })
systemEvents.emit('tool.used', { userId, toolType, effectiveness })
```

## 📝 Logging System

### System Logger

```javascript
class SystemLogger {
    /**
     * Log command usage
     * @param {Object} interaction - Discord interaction
     * @param {string} result - Command result
     */
    async logCommand(interaction, result) {
        await this.createLog({
            type: 'COMMAND_USED',
            userId: interaction.user.id,
            guildId: interaction.guild?.id,
            details: {
                command: interaction.commandName,
                result: result
            }
        })
    }

    /**
     * Log crisis events
     * @param {Object} context - Crisis context
     */
    async logCrisis(context) {
        await this.createLog({
            type: 'CRISIS_DETECTED',
            userId: context.userId,
            guildId: context.guildId,
            details: {
                severity: context.severity,
                keywords: context.keywords,
                action: context.action
            }
        })
    }
}
```

## 🚀 Deployment

### Environment Variables

```bash
# Required
DISCORD_TOKEN=your_discord_bot_token
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key

# Optional
ENCRYPTION_KEY=your_encryption_key
LOG_LEVEL=info
NODE_ENV=production
```

### Docker Configuration

```dockerfile
# Use Node.js 18 Alpine
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]
```

## 🧪 Testing

### Unit Testing

```javascript
// Example test for mood analysis
describe('Mood Analysis', () => {
    test('should calculate correct mood distribution', () => {
        const checkIns = [
            { mood: 'happy', intensity: 4 },
            { mood: 'sad', intensity: 2 },
            { mood: 'happy', intensity: 5 }
        ]

        const distribution = calculateMoodDistribution(checkIns)

        expect(distribution.happy).toBe(66.67)
        expect(distribution.sad).toBe(33.33)
    })
})
```

### Integration Testing

```javascript
// Test crisis detection pipeline
describe('Crisis Detection', () => {
    test('should detect high-risk messages', async () => {
        const message = "I can't take this anymore..."
        const analysis = await analyzeCrisis(message, mockContext)

        expect(analysis.severity).toBeGreaterThan(3)
        expect(analysis.action).toBe('immediate_help')
    })
})
```

### Conversation History & Context System

Advanced context management for personalized AI interactions with privacy controls.

```javascript
// filepath: src/database/modules/conversationHistory.js

class ConversationHistory {
    /**
     * Store user message for AI context (respects privacy settings)
     * @param {string} userId - Discord user ID
     * @param {string} message - Message content
     * @param {Object} context - Channel/guild context
     * @returns {Promise<Object>} Stored conversation entry
     */
    async storeMessage(userId, message, context) {
        // Respects user and server privacy settings
        // Automatically cleans up old messages (90+ days)
    }

    /**
     * Get conversation history for AI context
     * @param {string} userId - Discord user ID
     * @param {number} limit - Maximum messages to retrieve
     * @returns {Promise<Array>} Recent conversation history
     */
    async getRecentHistory(userId, limit = 10) {
        // Returns contextual conversation history
        // Includes conversation themes and patterns
    }

    /**
     * Build enhanced context for AI responses
     * @param {string} userId - Discord user ID
     * @param {Object} context - Current conversation context
     * @returns {Promise<Object>} Enhanced context with history and preferences
     */
    async buildContextForAI(userId, context) {
        // Returns: {
        //   recentMessages: Array,
        //   conversationThemes: Array,
        //   userPreferences: Object,
        //   mentalHealthContext: Object,
        //   crisisHistory: Array
        // }
    }

    /**
     * Clear user's conversation history (privacy controls)
     * @param {string} userId - Discord user ID
     * @returns {Promise<boolean>} Success status
     */
    async clearUserHistory(userId) {
        // Complete history deletion for privacy/reset
    }
}
```

### Context Privacy Controls

```javascript
// Privacy Settings Interaction Matrix:
const CONTEXT_POLICY = {
    // User enabled, Server enabled = Full context logging
    userEnabled_serverEnabled: 'FULL_LOGGING',

    // User enabled, Server disabled = DM-only logging
    userEnabled_serverDisabled: 'DM_ONLY_LOGGING',

    // User disabled, Server enabled = No logging for user
    userDisabled_serverEnabled: 'NO_LOGGING',

    // User disabled, Server disabled = No logging for user
    userDisabled_serverDisabled: 'NO_LOGGING'
}

// Automatic Data Cleanup:
// - Conversation history: 90 days retention
// - Crisis events: Longer retention for safety analysis
// - System logs: Variable retention based on type
```

---

_This API reference is continuously updated as the project evolves. For the latest information, check the source code and inline documentation._
