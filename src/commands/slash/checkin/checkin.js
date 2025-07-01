import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import { moodChoices, moodIntensities, moodEmojis } from '../../../configs/mood.config.js'

export default {
    structure: {
        name: 'checkin',
        category: 'Check-In',
        description: 'Log your current mood and reflect on how you are feeling.',
        handlers: {
            cooldown: 15000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: [
            {
                name: 'mood',
                description: 'How are you feeling right now?',
                required: true,
                type: cmdTypes.STRING,
                choices: moodChoices
            },
            {
                name: 'intensity',
                description: 'How strong is this mood? (1-5)',
                required: false,
                type: cmdTypes.INTEGER,
                choices: moodIntensities
            },
            {
                name: 'activity',
                description: 'What are you doing right now?',
                required: false,
                type: cmdTypes.STRING
            },
            {
                name: 'note',
                description: 'Anything else you want to add?',
                required: false,
                type: cmdTypes.STRING
            }
        ]
    },
    run: async (client, interaction) => {
        const mood = interaction.options.getString('mood')
        const intensity = interaction.options.getInteger('intensity') ?? 3
        const activity = interaction.options.getString('activity')
        const note = interaction.options.getString('note')
        const userId = interaction.user.id

        // Get or create user preferences for check-in
        const prefs = await client.db.users.findById(BigInt(userId), {
            include: { preferences: true }
        })

        // Get user's configured check-in interval (default to 12 hours if not set)
        const userCheckInInterval = prefs?.preferences?.checkInInterval ?? 720 // minutes

        // Check cooldown based on user's configured interval
        const lastCheckInArr = await client.db.moodCheckIns.getAllForUser(userId, 1)
        if (lastCheckInArr.length > 0) {
            const lastCheckIn = lastCheckInArr[0]
            const lastTime = new Date(lastCheckIn.createdAt)
            const now = new Date()
            const diffMs = now - lastTime
            const cooldownMs = userCheckInInterval * 60 * 1000 // Convert minutes to milliseconds
            if (diffMs < cooldownMs) {
                const remainingMs = cooldownMs - diffMs
                const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000))
                const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
                const intervalHours = Math.floor(userCheckInInterval / 60)
                const intervalMinutes = userCheckInInterval % 60
                return interaction.reply({
                    content: `You can only check in once every ${intervalHours}h ${intervalMinutes}m (your configured interval). Please wait ${remainingHours}h ${remainingMinutes}m before checking in again.`
                })
            }
        }

        let nextCheckInTime

        if (!prefs?.preferences) {
            const createdPrefs = await client.db.userPreferences.upsert(userId, {
                checkInInterval: 720, // Default to 12 hours
                nextCheckIn: new Date(Date.now() + 720 * 60 * 1000)
            })

            nextCheckInTime = createdPrefs.nextCheckIn
        } else {
            const checkInInterval = prefs.preferences.checkInInterval ?? 720

            const updatedPrefs = await client.db.userPreferences.upsert(userId, {
                nextCheckIn: new Date(Date.now() + checkInInterval * 60 * 1000)
            })

            nextCheckInTime = updatedPrefs.nextCheckIn
        }

        await client.db.moodCheckIns.create({
            userId: BigInt(userId),
            mood,
            note,
            intensity,
            activity
        })

        const recent = await client.db.moodCheckIns.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { createdAt: 'desc' },
            take: 5
        })

        const history = recent
            .map(c => {
                const moodEmoji = moodEmojis[c.mood] || '❓'
                return `- ${moodEmoji} **${c.mood}** (${c.intensity}/5) ${c.activity ? ` — ${c.activity}` : ''} ${c.note ? `\n  _${c.note}_` : ''} <t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R>`
            })
            .join('\n')

        // Log check-in if in a guild and logging is enabled
        if (interaction.guild) {
            try {
                const guildSettings = await client.db.guilds.findById(interaction.guild.id)
                if (guildSettings?.checkInChannelId && guildSettings?.enableCheckIns) {
                    const logChannel = await interaction.guild.channels
                        .fetch(guildSettings.checkInChannelId)
                        .catch(() => null)
                    if (logChannel && logChannel.isTextBased()) {
                        const moodEmoji = moodEmojis[mood] || '😐'
                        const logEmbed = new client.Gateway.EmbedBuilder()
                            .setTitle('📝 Mood Check-In')
                            .setDescription(
                                `**User:** <@${interaction.user.id}>\n**Mood:** ${moodEmoji} ${mood} (${intensity}/5)${activity ? `\n**Activity:** ${activity}` : ''}`
                            )
                            .setColor(client.colors.primary)
                            .setTimestamp()
                            .setFooter({ text: client.footer, iconURL: client.logo })

                        await logChannel.send({ embeds: [logEmbed] })
                    }
                }
            } catch (error) {
                console.error('Failed to log check-in:', error)
            }
        }

        return interaction.reply({
            embeds: [
                new client.Gateway.EmbedBuilder()
                    .setTitle('Check-In Complete')
                    .setColor(client.colors.primary)
                    .setThumbnail(client.logo)
                    .setDescription(
                        `Thank you for checking in.\n\n` +
                            `- **Current Mood:** ${moodEmojis[mood] || '❓'} ${mood} (${intensity}/5)` +
                            `- ${activity ? `- **Activity:** ${activity}\n` : ''}` +
                            `- ${note ? `- **Note:** ${note}\n\n` : ''}` +
                            `\n\nIf you have reminders enabled i'll remind you to check in again <t:${Math.floor(new Date(nextCheckInTime).getTime() / 1000)}:R>.`
                    )
                    .addFields({
                        name: 'Recent Check-Ins',
                        value: history
                    })
            ]
        })
    }
}
