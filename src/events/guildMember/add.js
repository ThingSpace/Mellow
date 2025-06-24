import { Events } from 'discord.js'
import { db } from '../../database/client.js'

const SUPPORT_SERVER_ID = '957420716142252062'
const MEMBERS_ROLE_ID = '957420716142252064'

export default {
    event: Events.GuildMemberAdd,
    once: false,
    run: async (client, member) => {
        // Upsert the user in the database
        await db.prisma.user.upsert({
            where: { id: BigInt(member.id) },
            update: { username: member.user.username },
            create: { id: BigInt(member.id), username: member.user.username }
        })

        if (member.guild.id === SUPPORT_SERVER_ID && !member.user.bot && !member.roles.cache.has(MEMBERS_ROLE_ID)) {
            try {
                await member.roles.add(MEMBERS_ROLE_ID)
            } catch (err) {}
        }
    }
}
