import { Events } from 'discord.js'
import { db } from '../../database/client.js'

const SUPPORT_SERVER_ID = '957420716142252062'
const MEMBERS_ROLE_ID = '957420716142252064'

export default {
    event: Events.GuildMemberAdd,
    once: false,
    run: async (client, member) => {
        // Upsert the user in the database
        await db.users.upsert(member.id, {
            username: member.user.username
        })

        // Log user registration
        if (client.systemLogger) {
            await client.systemLogger.logUserEvent(
                member.id,
                member.user.username,
                'registered',
                `Joined guild: ${member.guild.name}`
            )
        }

        if (member.guild.id === SUPPORT_SERVER_ID && !member.user.bot && !member.roles.cache.has(MEMBERS_ROLE_ID)) {
            try {
                await member.roles.add(MEMBERS_ROLE_ID)
            } catch (err) {}
        }

        // Get guild settings to check for member auto-assignment role
        const guildSettings = await db.guilds.findById(member.guild.id)
        if (guildSettings?.systemRoleId) {
            const memberRole = member.guild.roles.cache.get(guildSettings.systemRoleId)
            if (memberRole && !member.user.bot) {
                try {
                    await member.roles.add(memberRole)
                    console.log(`Assigned member role to ${member.user.username} in ${member.guild.name}`)
                } catch (error) {
                    console.error(`Failed to assign member role in ${member.guild.name}:`, error)
                }
            }
        }
    }
}
