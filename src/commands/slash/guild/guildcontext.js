import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import { PermissionFlagsBits } from 'discord.js'

export default {
    structure: {
        name: 'guildcontext',
        category: 'Guild',
        description: 'View guild-level conversation context statistics (admin only)',
        handlers: {
            cooldown: 15000,
            requiredRoles: [],
            requiredPerms: [PermissionFlagsBits.Administrator, PermissionFlagsBits.ManageGuild],
            guildOnly: true
        },
        options: []
    },
    run: async (client, interaction) => {
        try {
            const guildId = interaction.guild.id
            const guildName = interaction.guild.name

            // Check if guild has context logging enabled
            const guildSettings = await client.db.guilds.findById(guildId)
            if (guildSettings?.disableContextLogging) {
                return interaction.reply({
                    content:
                        '❌ **Context logging is disabled for this server.**\n\nTo enable guild context logging, use:\n`/guildsettings features context_logging:true`',
                    ephemeral: true
                })
            }

            // Get guild conversation history stats
            const guildHistory = await client.db.conversationHistory.findMany({
                where: {
                    guildId: guildId, // Convert BigInt to string for Prisma query
                    // Only count messages that are part of guild context
                    OR: [{ contextType: 'channel_context' }, { contextType: 'conversation' }]
                },
                select: { id: true, timestamp: true, isAiResponse: true, contextType: true, channelId: true }
            })

            const userMessages = guildHistory.filter(msg => !msg.isAiResponse).length
            const aiMessages = guildHistory.filter(msg => msg.isAiResponse).length
            const channelContext = guildHistory.filter(msg => msg.contextType === 'channel_context').length
            const conversationContext = guildHistory.filter(msg => msg.contextType === 'conversation').length

            // Get unique channel count
            const uniqueChannels = new Set(guildHistory.map(msg => msg.channelId).filter(Boolean)).size

            // Calculate date ranges
            const now = new Date()
            const last24h = guildHistory.filter(
                msg => msg.timestamp && now - new Date(msg.timestamp) < 24 * 60 * 60 * 1000
            ).length
            const last7days = guildHistory.filter(
                msg => msg.timestamp && now - new Date(msg.timestamp) < 7 * 24 * 60 * 60 * 1000
            ).length

            // Get oldest message for total timespan
            const oldestMessage = guildHistory
                .filter(msg => msg.timestamp)
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0]

            const totalMessages = userMessages + aiMessages

            const embed = new client.Gateway.EmbedBuilder()
                .setTitle(`📊 Guild Context Analysis`)
                .setDescription(
                    `**${guildName}**\n\nThis shows how much conversation history I have access to for better context in this server. Only message counts are shown, never actual content.`
                )
                .setColor(client.colors.primary)
                .setThumbnail(interaction.guild.iconURL())
                .addFields(
                    {
                        name: '💬 Message Context',
                        value: [
                            `**Total Messages:** ${totalMessages.toLocaleString()}`,
                            `**User Messages:** ${userMessages.toLocaleString()}`,
                            `**AI Responses:** ${aiMessages.toLocaleString()}`,
                            `**Channels:** ${uniqueChannels} channel${uniqueChannels !== 1 ? 's' : ''}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '📈 Activity Breakdown',
                        value: [
                            `**Last 24 hours:** ${last24h}`,
                            `**Last 7 days:** ${last7days}`,
                            `**Channel Context:** ${channelContext}`,
                            `**Direct Context:** ${conversationContext}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '⚙️ Context Settings',
                        value: [
                            `**Context Logging:** ${!guildSettings?.disableContextLogging ? '✅ Enabled' : '❌ Disabled'}`,
                            `**Privacy Level:** Server-wide`,
                            `**Individual Opt-outs:** Respected`,
                            oldestMessage
                                ? `**Data Since:** <t:${Math.floor(new Date(oldestMessage.timestamp).getTime() / 1000)}:d>`
                                : '**Data Since:** No data'
                        ].join('\n'),
                        inline: false
                    }
                )
                .setFooter({
                    text: `${client.footer} • Context helps improve AI responses in your server`,
                    iconURL: client.logo
                })
                .setTimestamp()

            // Add note about privacy
            if (totalMessages === 0) {
                embed.setDescription(
                    `**${guildName}**\n\n❌ **No conversation context found.**\n\nThis could mean:\n• Context logging is disabled\n• No AI conversations have occurred\n• All users have opted out of context logging`
                )
            } else {
                embed.addFields({
                    name: '🔒 Privacy Information',
                    value: [
                        '• Only message **counts** are shown, never content',
                        '• Individual users can opt-out with `/preferences`',
                        '• Context logging can be disabled server-wide',
                        '• All data respects Discord ToS and privacy policies'
                    ].join('\n'),
                    inline: false
                })
            }

            return interaction.reply({ embeds: [embed] })
        } catch (error) {
            console.error('Error getting guild context:', error)
            return interaction.reply({
                content:
                    '❌ Sorry, I encountered an error while retrieving guild context information. Please try again later.',
                ephemeral: true
            })
        }
    }
}
