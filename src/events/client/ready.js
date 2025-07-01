import { Events } from 'discord.js'
import { log } from '../../functions/logger.js'
import { ReminderTool } from '../../services/tools/reminderTool.js'
import { aiService } from '../../services/ai.service.js'
import { SystemLogger } from '../../functions/systemLogger.js'
import { GithubClient } from '../../class/github.js'

export default {
    event: Events.ClientReady,
    once: true,

    run: async (_, client) => {
        log(`${client.user.tag} is booting up...`, 'info')

        try {
            await client.rpc.presence(client)

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

            log('All services initialized successfully!', 'done')

            const guildCount = await client.db.prisma.guild.count()
            const userCount = await client.db.prisma.user.count()

            // Log startup event using system logger
            if (client.systemLogger) {
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

                await client.systemLogger.sendToChannels(embed)
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
