import { Events } from 'discord.js'
import { db } from '../../database/client.js'

export default {
    event: Events.GuildCreate,
    once: false,
    run: async (client, guild) => {
        console.log(`Joined a new guild: ${guild.id}`)
        console.log(`Guild ID type: ${typeof guild.id}, value: ${guild.id}`)
        console.log(`Owner ID type: ${typeof guild.ownerId}, value: ${guild.ownerId}`)

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
            console.log(`Member ID type: ${typeof member.id}, value: ${member.id}`)
            const userExists = await db.users.findById(member.id)

            await db.users.upsert(member.id, {
                username: member.user.username,
                role: userExists ? userExists.role : 'USER'
            })
        }

        console.log(`Guild: ${guild.id} created/updated successfully!`)
    }
}
