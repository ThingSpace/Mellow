import { Events } from 'discord.js'
import { log } from '../../functions/logger.js'
import { ReminderTool } from '../../services/tools/reminderTool.js'
import { aiService } from '../../services/ai.service.js'
import { SystemLogger } from '../../functions/systemLogger.js'
import { GithubClient } from '../../class/github.js'
import { createStatusPoster } from '../../functions/statusPoster.js'
import { encryptionService } from '../../services/encryption.service.js'
import { DbEncryptionHelper } from '../../helpers/db-encryption.helper.js'

export default {
    event: Events.ClientReady,
    once: true,

    run: async (_, client) => {
        log(`${client.user.tag} is booting up...`, 'info')

        try {
            // Initialize encryption service
            log('Initializing encryption service...', 'info')
            const encryptionInitialized = await encryptionService.initialize()
            if (encryptionInitialized) {
                log('Encryption service initialized successfully', 'done')
                await DbEncryptionHelper.initialize()
                log('Database encryption helper initialized', 'done')
            } else {
                log('Encryption service failed to initialize. Sensitive data will not be encrypted.', 'warn')
            }

            // Initialize game tracking maps
            client.wordGames = new Map()
            client.wyrVotes = new Map()
            log('Game tracking systems initialized', 'info')

            await client.rpc.presence(client, {
                apiKey: process.env.MELLOW_STATUS_API_KEY,
                interval: 300000,
                enabled: true
            })

            client.statusPoster = await createStatusPoster(client)

            client.reminder = new ReminderTool(client)
            client.reminder.start()

            // Initialize system logger
            client.systemLogger = new SystemLogger(client)
            await client.systemLogger.initialize()

            log(`${client.user.tag} is now online!`, 'done')

            log('Syncing client settings please wait......')

            const mellow = await client.db.mellow.get()

            log('Client settings fetched/synced successfully!')

            // Initialize AI service with database configuration
            log('Initializing AI service with database configuration...')

            await aiService.initialize().catch(err => {
                return log(`Failed to initialize AI service: ${err.message}`, 'error')
            })

            // Validate AI configuration
            const validation = await aiService.validateConfig()

            if (!validation.isValid) {
                log(`AI Configuration validation issues: ${validation.issues.join(', ')}`, 'warn')
            } else {
                log('AI configuration validated successfully!', 'done')
            }

            // Initialize GitHub client
            if (process.env.GITHUB_TOKEN) {
                try {
                    // Set repository information (update these with your actual repo details)
                    GithubClient.setRepository('ThingSpace', 'Mellow')
                    client.github = GithubClient.init(process.env.GITHUB_TOKEN)

                    // Test the connection
                    const connectionTest = await client.github.testConnection()
                    if (connectionTest.success) {
                        log(`GitHub client initialized successfully (authenticated as: ${connectionTest.user})`, 'done')
                    } else {
                        log(`GitHub client initialized but connection test failed: ${connectionTest.error}`, 'warn')
                    }
                } catch (error) {
                    log(`Failed to initialize GitHub client: ${error.message}`, 'error')
                }
            } else {
                log('GITHUB_TOKEN not provided - GitHub features will be disabled', 'warn')
            }

            // Initialize Twitter service
            if (process.env.TWITTER_ENABLED === 'true') {
                try {
                    const twitterInitialized = await client.twitterService.initialize()
                    if (twitterInitialized) {
                        log('Twitter service initialized successfully', 'done')
                    } else {
                        log('Twitter service disabled or failed to initialize', 'warn')
                    }
                } catch (error) {
                    log(`Twitter service initialization failed: ${error.message}`, 'error')
                }
            }

            // Initialize Support service
            try {
                const supportInitialized = await client.supportService.initialize()
                if (supportInitialized) {
                    log('Support service initialized successfully', 'done')
                } else {
                    log('Support service disabled or failed to initialize', 'warn')
                }
            } catch (error) {
                log(`Support service initialization failed: ${error.message}`, 'error')
            }

            log('All services initialized successfully!', 'done')

            const guildCount = await client.db.prisma.guild.count()
            const userCount = await client.db.prisma.user.count()

            // Log startup event using system logger
            if (client.systemLogger) {
                // Log to database
                await client.systemLogger.logStartupEvent(
                    'Bot Started',
                    `Mellow has started up and is ready for interactions. Connected to ${guildCount} guilds with ${userCount} users.`,
                    {
                        guildCount: guildCount,
                        userCount: userCount,
                        botTag: client.user.tag,
                        startTime: new Date().toISOString()
                    }
                )

                const embed = new client.Gateway.EmbedBuilder()
                    .setTitle('🟢 Mellow Online')
                    .setDescription('Mellow has started up and is ready for interactions')
                    .setColor(client.colors.success)
                    .addFields(
                        {
                            name: 'Guilds',
                            value: `${guildCount.toLocaleString()}`,
                            inline: true
                        },
                        {
                            name: 'Users',
                            value: `${userCount.toLocaleString()}`,
                            inline: true
                        }
                    )
                    .setTimestamp()
                    .setFooter({ text: client.footer, iconURL: client.logo })

                await client.systemLogger.sendToChannels(embed, { logType: 'startup' })
            }
        } catch (error) {
            log(`${error.message}`, 'error')

            // Log startup error
            if (client.systemLogger) {
                await client.systemLogger.logError(error, 'Client Startup')
            }
        }
    }
}
