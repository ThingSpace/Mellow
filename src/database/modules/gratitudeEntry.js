export class GratitudeEntryModule {
    constructor(prisma) {
        this.prisma = prisma
    }
    async create(data) {
        return this.prisma.gratitudeEntry.create({ data })
    }
    async findMany(args = {}) {
        return this.prisma.gratitudeEntry.findMany(args)
    }
    async findById(id) {
        return this.prisma.gratitudeEntry.findUnique({ where: { id } })
    }
    async delete(id) {
        return this.prisma.gratitudeEntry.delete({ where: { id } })
    }
    async update(id, data) {
        return this.prisma.gratitudeEntry.update({ where: { id }, data })
    }
}
