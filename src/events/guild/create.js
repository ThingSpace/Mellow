import { Events } from 'discord.js'
import { db } from '../../database/client.js'

export default {
    event: Events.GuildCreate,
    once: false,
    run: async (client, guild) => {
        console.log(`Joined a new guild: ${guild.id}`)

        // Log guild join event
        if (client.systemLogger) {
            await client.systemLogger.logGuildEvent(guild, 'join')
        }

        await db.guilds.upsert(
            guild.id,
            {
                name: guild.name,
                ownerId: guild.ownerId,
                joinedAt: new Date()
            },
            true
        )

        /**
         * ENSURE ALL GUILD MEMBERS ARE IN OUR DATABASE
         * THIS HELPS AVOID ANY COMMAND ISSUES (IE: PROFILES)
         */
        const members = await guild.members.fetch()

        for (const member of members.values()) {
            const userExists = await db.users.findById(member.id)

            await db.users.upsert(member.id, {
                username: member.user.username,
                role: userExists ? userExists.role : 'USER'
            })
        }

        console.log(`Guild: ${guild.id} created/updated successfully!`)
    }
}
