export class GuildModule {
    constructor(prisma) {
        this.prisma = prisma
    }

    async upsert(guild) {
        return this.prisma.guild.upsert({
            where: { id: BigInt(guild.id) },
            update: {
                name: guild.name,
                ownerId: BigInt(guild.ownerId),
                isBanned: guild.isBanned ?? false,
                bannedUntil: guild.bannedUntil ?? null,
                banReason: guild.banReason ?? null
            },
            create: {
                id: BigInt(guild.id),
                name: guild.name,
                ownerId: BigInt(guild.ownerId),
                joinedAt: guild.joinedAt ?? new Date(),
                isBanned: guild.isBanned ?? false,
                bannedUntil: guild.bannedUntil ?? null,
                banReason: guild.banReason ?? null
            }
        })
    }

    async findById(id) {
        return this.prisma.guild.findUnique({
            where: { id: BigInt(id) }
        })
    }

    async ban(id, reason, until = null) {
        return this.prisma.guild.update({
            where: { id: BigInt(id) },
            data: {
                isBanned: true,
                banReason: reason,
                bannedUntil: until
            }
        })
    }

    async unban(id) {
        return this.prisma.guild.update({
            where: { id: BigInt(id) },
            data: {
                isBanned: false,
                banReason: null,
                bannedUntil: null
            }
        })
    }

    async updateName(id, name) {
        return this.prisma.guild.update({
            where: { id: BigInt(id) },
            data: { name }
        })
    }

    async setModAlertChannel(guildId, channelId) {
        return this.prisma.guild.update({
            where: { id: BigInt(guildId) },
            data: { modAlertChannelId: channelId }
        })
    }

    async getModAlertChannel(guildId) {
        const guild = await this.prisma.guild.findUnique({
            where: { id: BigInt(guildId) }
        })
        return guild?.modAlertChannelId || null
    }
}
