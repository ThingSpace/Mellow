export class ConversationHistoryModule {
    constructor(prisma) {
        this.prisma = prisma
    }

    async add(userId, content, isAiResponse = false) {
        return this.prisma.conversationHistory.create({
            data: {
                userId: BigInt(userId),
                content,
                isAiResponse,
                timestamp: new Date()
            }
        })
    }

    async getAllForUser(userId, limit = 50) {
        return this.prisma.conversationHistory.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { timestamp: 'asc' },
            take: limit
        })
    }

    async clearForUser(userId) {
        return this.prisma.conversationHistory.deleteMany({
            where: { userId: BigInt(userId) }
        })
    }
}
