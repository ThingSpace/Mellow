import { calculateStreaks } from '../../../functions/streakCalculator.js'

export default {
    structure: {
        name: 'streaks',
        category: 'Coping',
        description: 'View your coping tool usage streaks and progress.',
        handlers: {
            cooldown: 15000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: []
    },
    run: async (client, interaction) => {
        const userId = interaction.user.id

        try {
            // Get coping tool usage data
            const usageData = await client.db.copingToolUsage.findMany({
                where: { userId: BigInt(userId) },
                orderBy: { usedAt: 'desc' },
                take: 100
            })

            if (usageData.length === 0) {
                return interaction.reply({
                    content:
                        '📊 No coping tool usage found yet.\n\nStart using coping tools with `/coping` commands to track your progress and build streaks!'
                })
            }

            // Calculate streaks using shared utility
            const { overallStreak, toolStreaks, totalUsage } = calculateStreaks(usageData, 'usedAt', 'toolName')

            // Log streak viewing
            if (client.systemLogger) {
                await client.systemLogger.logUserEvent(
                    userId,
                    interaction.user.username,
                    'coping_streaks_viewed',
                    `Overall streak: ${overallStreak} days, Total usage: ${totalUsage}`
                )
            }

            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('📊 Your Coping Tool Streaks')
                .setColor(client.colors.primary)
                .setDescription("Here's your progress with coping tools:")
                .addFields(
                    {
                        name: '🔥 Overall Streak',
                        value: `**${overallStreak}** days of using coping tools`,
                        inline: true
                    },
                    {
                        name: '📈 Total Usage',
                        value: `**${totalUsage}** tools used`,
                        inline: true
                    },
                    {
                        name: '🛠️ Unique Tools',
                        value: `**${Object.keys(toolStreaks).length}** different tools`,
                        inline: true
                    }
                )

            // Add individual tool streaks if any
            if (Object.keys(toolStreaks).length > 0) {
                const streakList = Object.entries(toolStreaks)
                    .sort(([, a], [, b]) => b.current - a.current)
                    .slice(0, 5) // Top 5 tools
                    .map(([tool, streak]) => `**${tool}**: ${streak.current} days (best: ${streak.best})`)
                    .join('\n')

                embed.addFields({
                    name: '🏆 Top Tool Streaks',
                    value: streakList || 'No streaks yet',
                    inline: false
                })
            }

            embed.addFields({
                name: '💪 Keep Going!',
                value: 'Consistency is key to building healthy coping habits. Every day you use a coping tool is progress!',
                inline: false
            })

            embed.setFooter({ text: client.footer, iconURL: client.logo }).setTimestamp()

            return interaction.reply({ embeds: [embed] })
        } catch (error) {
            console.error('Error in streaks command:', error)

            if (client.systemLogger) {
                await client.systemLogger.logError(error, 'Coping Streaks Command')
            }

            return interaction.reply({
                content: '❌ An error occurred while calculating your streaks. Please try again later.',
                ephemeral: true
            })
        }
    }
}
