export default {
    structure: {
        name: 'preferences',
        category: 'Check-In',
        description: 'Configure your check-in preferences and reminder settings.',
        handlers: {
            cooldown: 60,
            requiredRoles: []
        },
        options: [
            {
                name: 'interval',
                description: 'How often would you like to be reminded to check in? (in hours)',
                required: false,
                type: 3, // STRING
                min_value: 1,
                max_value: 72 // Max 3 days
            }
        ]
    },
    run: async (client, interaction) => {
        const userId = interaction.user.id
        const intervalHours = interaction.options.getInteger('interval')

        // Get current preferences
        const user = await client.db.prisma.user.findUnique({
            where: { id: BigInt(userId) },
            include: { preferences: true }
        })

        if (intervalHours) {
            // Convert hours to minutes for storage
            const intervalMinutes = intervalHours * 60

            // Create or update preferences
            await client.db.prisma.userPreferences.upsert({
                where: { id: BigInt(userId) },
                update: { checkInInterval: intervalMinutes },
                create: {
                    id: BigInt(userId),
                    checkInInterval: intervalMinutes
                }
            })

            await interaction.reply({
                embeds: [
                    new client.Gateway.EmbedBuilder()
                        .setTitle('Check-In Preferences Updated')
                        .setDescription(
                            `I'll remind you to check in every ${intervalHours} hour${intervalHours === 1 ? '' : 's'}.\n` +
                                `You can always use \`/checkin\` at any time, even between reminders!`
                        )
                        .setColor(client.colors.success)
                        .setFooter({ text: client.footer, iconURL: client.logo })
                ]
            })
        } else {
            // Show current settings
            const currentInterval = user?.preferences?.checkInInterval ?? 720
            const currentHours = Math.round(currentInterval / 60)
            const lastReminder = user?.preferences?.lastReminder

            await interaction.reply({
                embeds: [
                    new client.Gateway.EmbedBuilder()
                        .setTitle('Check-In Preferences')
                        .setDescription(
                            `**Current Settings**\n` +
                                `• Reminder Interval: Every ${currentHours} hour${currentHours === 1 ? '' : 's'}\n` +
                                `${lastReminder ? `• Last Reminder: <t:${Math.floor(new Date(lastReminder).getTime() / 1000)}:R>\n` : ''}` +
                                `\nUse \`/preferences interval:<hours>\` to change how often you get reminders.`
                        )
                        .setColor(client.colors.primary)
                        .setFooter({ text: client.footer, iconURL: client.logo })
                ]
            })
        }
    }
}
