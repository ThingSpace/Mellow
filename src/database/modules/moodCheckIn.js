export class MoodCheckInModule {
    constructor(prisma) {
        this.prisma = prisma
    }

    async add(userId, mood, note = null, intensity = 3, activity = null, nextCheckIn = null) {
        return this.prisma.moodCheckIn.create({
            data: {
                userId: BigInt(userId),
                mood,
                note,
                intensity,
                activity,
                nextCheckIn
            }
        })
    }

    async getAllForUser(userId, limit = 30) {
        return this.prisma.moodCheckIn.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { createdAt: 'desc' },
            take: limit
        })
    }

    async getDueReminders() {
        const now = new Date()
        return this.prisma.moodCheckIn.findMany({
            where: {
                nextCheckIn: {
                    lte: now
                }
            },
            include: {
                user: {
                    include: {
                        preferences: true
                    }
                }
            },
            orderBy: {
                nextCheckIn: 'asc'
            }
        })
    }
}
