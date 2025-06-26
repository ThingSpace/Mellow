import { Events } from 'discord.js'
import { log } from '../../functions/logger.js'
import { ReminderTool } from '../../services/tools/reminderTool.js'

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
        } catch (error) {
            log(`${error.message}`, 'error')
        }
    }
}
