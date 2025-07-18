import { log } from '../functions/logger.js'
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { DbEncryptionHelper } from '../helpers/db-encryption.helper.js'
import { UserModule } from './modules/users.js'
import { ConversationHistoryModule } from './modules/conversationHistory.js'
import { MoodCheckInModule } from './modules/moodCheckIn.js'
import { GhostLetterModule } from './modules/ghostLetter.js'
import { CopingToolUsageModule } from './modules/copingToolUsage.js'
import { CrisisEventModule } from './modules/crisisEvent.js'
import { GuildModule } from './modules/guild.js'
import { ModActionModule } from './modules/modAction.js'
import { FeedbackModule } from './modules/feedback.js'
import { ReportModule } from './modules/report.js'
import { JournalEntryModule } from './modules/journalEntry.js'
import { GratitudeEntryModule } from './modules/gratitudeEntry.js'
import { CopingPlanModule } from './modules/copingPlan.js'
import { FavoriteCopingToolModule } from './modules/favoriteCopingTool.js'
import { UserPreferencesModule } from './modules/userPreferences.js'
import { MellowModule } from './modules/mellow.js'
import { SystemLogModule } from './modules/systemLog.js'

const prisma = new PrismaClient().$extends(withAccelerate())

/**
 * Create a singleton instance of prisma that can be used throughout the application.
 * This class also contains a few helper functions to log messages to the console.
 */
class Database {
    constructor() {
        this.prisma = prisma
        this.users = new UserModule(this.prisma)
        this.conversationHistory = new ConversationHistoryModule(this.prisma)
        this.moodCheckIns = new MoodCheckInModule(this.prisma)
        this.ghostLetters = new GhostLetterModule(this.prisma)
        this.copingToolUsage = new CopingToolUsageModule(this.prisma)
        this.crisisEvents = new CrisisEventModule(this.prisma)
        this.guilds = new GuildModule(this.prisma)
        this.modActions = new ModActionModule(this.prisma)
        this.feedback = new FeedbackModule(this.prisma)
        this.reports = new ReportModule(this.prisma)
        this.journalEntries = new JournalEntryModule(this.prisma)
        this.gratitudeEntries = new GratitudeEntryModule(this.prisma)
        this.copingPlans = new CopingPlanModule(this.prisma)
        this.favoriteCopingTools = new FavoriteCopingToolModule(this.prisma)
        this.userPreferences = new UserPreferencesModule(this.prisma)
        this.mellow = new MellowModule(this.prisma)
        this.systemLogs = new SystemLogModule(this.prisma)

        this.logs = {
            info: msg => log(msg, 'info'),
            error: msg => log(msg, 'error'),
            err: msg => log(msg, 'error'),
            debug: msg => log(msg, 'debug'),
            warn: msg => log(msg, 'warn'),
            done: msg => log(msg, 'done')
        }
    }

    async connect() {
        try {
            await this.prisma.$queryRaw`SELECT 1`
            // Initialize encryption service
            const encryptionInitialized = await DbEncryptionHelper.initialize()
            if (encryptionInitialized) {
                this.logs.info('Database encryption service initialized')
            } else {
                this.logs.warn('Database encryption service not initialized. Sensitive data will not be encrypted.')
            }
            // this.logs.info('database connection is active')
        } catch (error) {
            // this.logs.error('Failed to connect to the database.')
            throw error
        }
    }

    async disconnect() {
        await this.prisma.$disconnect()
        // this.logs.info('database connection has been closed')
    }
}

export const db = new Database()
