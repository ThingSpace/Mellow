/**
 * UserPreferencesModule - Database operations for user preferences
 *
 * This module provides a flexible interface for managing user preference data in the database.
 * It uses Prisma's upsert functionality to handle both creation and updates seamlessly.
 *
 * @class UserPreferencesModule
 */
export class UserPreferencesModule {
    /**
     * Creates a new UserPreferencesModule instance
     * @param {Object} prisma - Prisma client instance
     */
    constructor(prisma) {
        this.prisma = prisma
    }

    /**
     * Creates or updates a user preferences record
     *
     * If preferences for the given user ID exist, it updates the record with the provided data.
     * If no preferences exist, it creates a new record with the ID and data.
     *
     * @param {string|number} id - Discord user ID
     * @param {Object} data - User preference data to create/update
     * @param {string} [data.timezone] - User's timezone (IANA timezone identifier)
     * @returns {Promise<Object>} The created or updated user preferences record
     *
     * @example
     * // Create new user preferences
     * await userPrefsModule.upsert('123456789', {
     *   checkInInterval: 1440,
     *   language: 'es',
     *   timezone: 'America/New_York'
     * })
     *
     * // Update existing preferences
     * await userPrefsModule.upsert('123456789', {
     *   remindersEnabled: false,
     *   aiPersonality: 'supportive'
     * })
     */
    async upsert(id, data) {
        if (data.timezone !== undefined && data.timezone !== null && typeof data.timezone !== 'string') {
            data.timezone = String(data.timezone)
        }

        return this.prisma.userPreferences.upsert({
            where: { id: BigInt(String(id)) },
            update: data,
            create: { id: BigInt(String(id)), ...data }
        })
    }

    /**
     * Retrieves multiple user preferences records based on provided criteria
     *
     * @param {Object} [args={}] - Prisma findMany arguments
     * @param {Object} [args.where] - Filter criteria
     * @param {Object} [args.select] - Fields to select
     * @param {Object} [args.include] - Relations to include
     * @param {number} [args.take] - Number of records to take
     * @param {number} [args.skip] - Number of records to skip
     * @param {Object} [args.orderBy] - Sorting criteria
     * @returns {Promise<Array>} Array of user preferences records
     *
     * @example
     * // Get all users with reminders enabled
     * const prefs = await userPrefsModule.findMany({
     *   where: { remindersEnabled: true }
     * })
     *
     * // Get first 10 users with Spanish language preference
     * const prefs = await userPrefsModule.findMany({
     *   where: { language: 'es' },
     *   take: 10
     * })
     */
    async findMany(args = {}) {
        return this.prisma.userPreferences.findMany(args)
    }

    /**
     * Retrieves a single user preferences record by ID
     *
     * @param {string|number} id - Discord user ID
     * @param {Object} [options={}] - Additional Prisma options
     * @param {Object} [options.select] - Fields to select
     * @param {Object} [options.include] - Relations to include
     * @returns {Promise<Object|null>} User preferences record or null if not found
     *
     * @example
     * // Get basic user preferences
     * const prefs = await userPrefsModule.findById('123456789')
     *
     * // Get preferences with user relation included
     * const prefs = await userPrefsModule.findById('123456789', {
     *   include: { user: true }
     * })
     *
     * // Get only specific fields
     * const prefs = await userPrefsModule.findById('123456789', {
     *   select: { checkInInterval: true, language: true }
     * })
     */
    async findById(id, options = {}) {
        return this.prisma.userPreferences.findUnique({
            where: { id: BigInt(String(id)) },
            ...options
        })
    }

    /**
     * Updates a user preferences record by ID
     *
     * @param {string|number} id - Discord user ID
     * @param {Object} data - User preference data to update
     * @returns {Promise<Object>} The updated user preferences record
     *
     * @example
     * // Update check-in interval and language
     * await userPrefsModule.updateById('123456789', {
     *   checkInInterval: 1440,
     *   language: 'es'
     * })
     */
    async updateById(id, data) {
        // Don't force timezone conversion - let it stay as-is if it's already a string
        // Only convert if it's actually a different type and not already a timezone identifier
        if (data.timezone !== undefined && data.timezone !== null && typeof data.timezone !== 'string') {
            data.timezone = String(data.timezone)
        }

        return this.prisma.userPreferences.update({
            where: { id: BigInt(String(id)) },
            data
        })
    }

    /**
     * Deletes a user preferences record from the database
     *
     * @param {string|number} id - Discord user ID
     * @returns {Promise<Object>} The deleted user preferences record
     *
     * @example
     * await userPrefsModule.delete('123456789')
     */
    async deleteById(id) {
        return this.prisma.userPreferences.delete({
            where: { id: BigInt(String(id)) }
        })
    }
}
