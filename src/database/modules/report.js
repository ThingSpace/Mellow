export class ReportModule {
    constructor(prisma) {
        this.prisma = prisma
    }
    async create(data) {
        return this.prisma.report.create({ data })
    }
    async findMany(args = {}) {
        return this.prisma.report.findMany(args)
    }
    async findById(id) {
        return this.prisma.report.findUnique({ where: { id } })
    }
    async delete(id) {
        return this.prisma.report.delete({ where: { id } })
    }
    async update(id, data) {
        return this.prisma.report.update({ where: { id }, data })
    }
}
