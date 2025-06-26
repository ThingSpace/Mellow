import { Events } from 'discord.js'
import { log } from '../../functions/logger.js'
import { ReminderTool } from '../../services/tools/reminderTool.js'
import { aiService } from '../../services/ai.service.js'

export default {
    event: Events.ClientReady,
    once: true,

    run: async (_, client) => {
        log(`${client.user.tag} is booting up...`, 'info')

        try {
            await client.rpc.presence(client)

            client.reminder = new ReminderTool(client)
            client.reminder.start()

            log(`${client.user.tag} is now online!`, 'done')

            log('Syncing client settings please wait......')

            await client.db.mellow.get().catch(err => {
                return log(`Failed to sync client settings: ${err.message}`, 'error')
            })

            log('Client settings synced successfully!')

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
        } catch (error) {
            log(`${error.message}`, 'error')
        }
    }
}
