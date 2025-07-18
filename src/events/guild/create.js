import { Events } from 'discord.js'
import { db } from '../../database/client.js'

export default {
    event: Events.GuildCreate,
    once: false,
    run: async (client, guild) => {
        console.log(`Joined a new guild: ${guild.id}`)
        console.log(`Guild ID type: ${typeof guild.id}, value: ${guild.id}`)
        console.log(`Owner ID type: ${typeof guild.ownerId}, value: ${guild.ownerId}`)

        try {
            // Create guild record in database FIRST before logging
            await db.guilds.upsert(
                guild.id,
                {
                    name: guild.name,
                    ownerId: guild.ownerId,
                    joinedAt: new Date()
                },
                true
            )

            console.log(`Guild ${guild.id} created/updated successfully`)

            // AFTER creating guild record, log the event
            if (client.systemLogger) {
                await client.systemLogger.logGuildEvent(guild, 'join')
            }

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

            console.log(`All members of guild ${guild.id} processed successfully!`)
        } catch (error) {
            console.error(`Error processing new guild ${guild.id}:`, error)

            // Try to log the error to system logger if available
            if (client.systemLogger) {
                try {
                    await client.systemLogger.logError(
                        'GUILD_JOIN_ERROR',
                        `Failed to process guild join for ${guild.id}`,
                        { error: error.stack, guild: { id: guild.id, name: guild.name } }
                    )
                } catch (logError) {
                    // If even logging fails, just console log it
                    console.error('Failed to log guild join error:', logError)
                }
            }
        }
    }
}
