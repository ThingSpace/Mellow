export class GhostLetterModule {
    constructor(prisma) {
        this.prisma = prisma
    }

    async add(userId, content) {
        return this.prisma.ghostLetter.create({
            data: {
                userId: BigInt(userId),
                content
            }
        })
    }

    async getAllForUser(userId, limit = 20) {
        return this.prisma.ghostLetter.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { createdAt: 'desc' },
            take: limit
        })
    }

    async clearForUser(userId) {
        return this.prisma.ghostLetter.deleteMany({
            where: { userId: BigInt(userId) }
        })
    }
}
