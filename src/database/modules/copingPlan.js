export class CopingPlanModule {
    constructor(prisma) {
        this.prisma = prisma
    }
    async create(data) {
        return this.prisma.copingPlan.create({ data })
    }
    async findMany(args = {}) {
        return this.prisma.copingPlan.findMany(args)
    }
    async findById(id) {
        return this.prisma.copingPlan.findUnique({ where: { id } })
    }
    async delete(id) {
        return this.prisma.copingPlan.delete({ where: { id } })
    }
    async update(id, data) {
        return this.prisma.copingPlan.update({ where: { id }, data })
    }
}
