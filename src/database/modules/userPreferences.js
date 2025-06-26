export class UserPreferencesModule {
    constructor(prisma) {
        this.prisma = prisma
    }
    async create(data) {
        return this.prisma.userPreferences.create({ data })
    }
    async findMany(args = {}) {
        return this.prisma.userPreferences.findMany(args)
    }
    async findById(id) {
        return this.prisma.userPreferences.findUnique({ where: { id } })
    }
    async delete(id) {
        return this.prisma.userPreferences.delete({ where: { id } })
    }
    async update(id, data) {
        return this.prisma.userPreferences.update({ where: { id }, data })
    }
}
