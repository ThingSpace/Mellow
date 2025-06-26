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

            const system = await client.channels.cache.get(String(mellow.logId))

            system.send({
                embeds: [
                    new client.Gateway.EmbedBuilder()
                        .setTitle('[SYSTEM]: Mellow is Online!')
                        .setColor(client.colors.primary)
                        .setDescription('Hey there, i have started up and am ready for interactions')
                        .setTimestamp()
                        .setFooter({
                            text: client.footer,
                            iconURL: client.logo
                        })
                ]
            })
        } catch (error) {
            log(`${error.message}`, 'error')
        }
    }
}
