import { Events } from 'discord.js'
import { db } from '../../database/client.js'

const SUPPORT_SERVER_ID = '957420716142252062'
const ADMIN_MEMBERS = '957420716142252069'
const MOD_MEMBERS = '957420716142252067'

export default {
    event: Events.GuildCreate,
    once: false,
    run: async (client, guild) => {
        // Upsert the guild in the database with all fields
        await db.guilds.upsert({
            id: guild.id,
            name: guild.name,
            ownerId: guild.ownerId,
            joinedAt: new Date(),
            isBanned: false,
            bannedUntil: null,
            banReason: null
        })

        // Upsert all members into the database
        const members = await guild.members.fetch()
        for (const member of members.values()) {
            // Determine user role based on Discord roles
            let userRole = 'USER' // Default role

            if (guild.id === SUPPORT_SERVER_ID) {
                // Check if user has admin role
                if (member.roles.cache.has(ADMIN_MEMBERS)) {
                    userRole = 'ADMIN'
                }
                // Check if user has mod role (but not admin)
                else if (member.roles.cache.has(MOD_MEMBERS)) {
                    userRole = 'MOD'
                }
            }

            // Upsert user with appropriate role
            await db.prisma.user.upsert({
                where: { id: BigInt(member.id) },
                update: {
                    username: member.user.username,
                    role: userRole
                },
                create: {
                    id: BigInt(member.id),
                    username: member.user.username,
                    role: userRole
                }
            })
        }
    }
}
