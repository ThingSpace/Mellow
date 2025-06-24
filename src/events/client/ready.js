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
        } catch (error) {
            log(`${error.message}`, 'error')
        }
    }
}
