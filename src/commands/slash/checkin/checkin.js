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

        // 12-hour check-in cooldown logic
        const lastCheckInArr = await client.db.moodCheckIns.getAllForUser(userId, 1)
        if (lastCheckInArr.length > 0) {
            const lastCheckIn = lastCheckInArr[0]
            const lastTime = new Date(lastCheckIn.createdAt)
            const now = new Date()
            const diffMs = now - lastTime
            const hours12 = 12 * 60 * 60 * 1000
            if (diffMs < hours12) {
                const remainingMs = hours12 - diffMs
                const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000))
                const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
                return interaction.reply({
                    content: `You can only check in once every 12 hours. Please wait ${remainingHours}h ${remainingMinutes}m before checking in again.`,
                    ephemeral: true
                })
            }
        }

        // Get or create user preferences for check-in
        const prefs = await client.db.users.findById(userId, {
            include: { preferences: true }
        })

        let nextCheckInTime

        if (!prefs?.preferences) {
            const createdPrefs = await client.db.userPreferences.upsert(userId, {
                checkInInterval: prefs?.preferences?.checkInInterval || 720, // Default to 12 hours
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
            userId,
            mood,
            note,
            intensity,
            activity
        })

        const recent = await client.db.moodCheckIns.getAllForUser(userId, 5)

        const history = recent
            .map(c => {
                const moodEmoji = moodEmojis[c.mood] || '❓'
                return `- ${moodEmoji} **${c.mood}** (${c.intensity}/5) ${c.activity ? ` — ${c.activity}` : ''} ${c.note ? `\n  _${c.note}_` : ''} <t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R>`
            })
            .join('\n')

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
