export class CopingToolUsageModule {
    constructor(prisma) {
        this.prisma = prisma
    }

    async add(userId, toolName) {
        return this.prisma.copingToolUsage.create({
            data: {
                userId: BigInt(userId),
                toolName
            }
        })
    }

    async getAllForUser(userId, limit = 30) {
        return this.prisma.copingToolUsage.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { usedAt: 'desc' },
            take: limit
        })
    }
}
