export class JournalEntryModule {
    constructor(prisma) {
        this.prisma = prisma
    }
    async create(data) {
        return this.prisma.journalEntry.create({ data })
    }
    async findMany(args = {}) {
        return this.prisma.journalEntry.findMany(args)
    }
    async findById(id) {
        return this.prisma.journalEntry.findUnique({ where: { id } })
    }
    async delete(id) {
        return this.prisma.journalEntry.delete({ where: { id } })
    }
    async update(id, data) {
        return this.prisma.journalEntry.update({ where: { id }, data })
    }
}
