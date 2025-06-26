export class FavoriteCopingToolModule {
    constructor(prisma) {
        this.prisma = prisma
    }
    async create(data) {
        return this.prisma.favoriteCopingTool.create({ data })
    }
    async findMany(args = {}) {
        return this.prisma.favoriteCopingTool.findMany(args)
    }
    async findById(id) {
        return this.prisma.favoriteCopingTool.findUnique({ where: { id } })
    }
    async delete(id) {
        return this.prisma.favoriteCopingTool.delete({ where: { id } })
    }
    async update(id, data) {
        return this.prisma.favoriteCopingTool.update({ where: { id }, data })
    }
}
