import { Events } from 'discord.js'

export default {
    event: Events.GuildDelete,
    once: false,
    run: async (client, guild) => {
        console.log(`Left guild: ${guild.id}`)

        // Log guild leave event
        if (client.systemLogger) {
            await client.systemLogger.logGuildEvent(guild, 'leave')
        }
    }
}
