export class ModActionModule {
    constructor(prisma) {
        this.prisma = prisma
    }

    async log({ guildId, moderatorId, targetUserId, action, reason = null, roleId = null }) {
        return this.prisma.modAction.create({
            data: {
                guildId: BigInt(guildId),
                moderatorId: BigInt(moderatorId),
                targetUserId: BigInt(targetUserId),
                action,
                reason,
                roleId: roleId ? BigInt(roleId) : null
            }
        })
    }

    async getRecentForGuild(guildId, limit = 10) {
        return this.prisma.modAction.findMany({
            where: { guildId: BigInt(guildId) },
            orderBy: { createdAt: 'desc' },
            take: limit
        })
    }
}
