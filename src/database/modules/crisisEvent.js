export class CrisisEventModule {
    constructor(prisma) {
        this.prisma = prisma
    }

    async add(userId, details = null, escalated = false) {
        return this.prisma.crisisEvent.create({
            data: {
                userId: BigInt(userId),
                details,
                escalated
            }
        })
    }

    async getAllForUser(userId, limit = 10) {
        return this.prisma.crisisEvent.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { detectedAt: 'desc' },
            take: limit
        })
    }
}
