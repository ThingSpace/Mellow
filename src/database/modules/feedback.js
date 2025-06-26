export class FeedbackModule {
    constructor(prisma) {
        this.prisma = prisma
    }
    async create(data) {
        return this.prisma.feedback.create({ data })
    }
    async findMany(args = {}) {
        return this.prisma.feedback.findMany(args)
    }
    async findById(id) {
        return this.prisma.feedback.findUnique({ where: { id } })
    }
    async delete(id) {
        return this.prisma.feedback.delete({ where: { id } })
    }
    async update(id, data) {
        return this.prisma.feedback.update({ where: { id }, data })
    }
}
