import { Events } from 'discord.js'
import { log } from '../../functions/logger.js'
import { ReminderTool } from '../../services/tools/reminderTool.js'
import { aiService } from '../../services/ai.service.js'
import { SystemLogger } from '../../functions/systemLogger.js'

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

            log('All services initialized successfully!', 'done')

            // Log startup event using system logger
            if (client.systemLogger) {
                const embed = new client.Gateway.EmbedBuilder()
                    .setTitle('🟢 Mellow Online')
                    .setDescription('Mellow has started up and is ready for interactions')
                    .setColor(client.colors.success)
                    .addFields(
                        {
                            name: 'Guilds',
                            value: client.guilds.cache.size.toString(),
                            inline: true
                        },
                        {
                            name: 'Users',
                            value: client.users.cache.size.toString(),
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
