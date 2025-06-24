export default {
    structure: {
        name: 'checkin',
        category: 'Check-In',
        description: 'Log your current mood and reflect on how you are feeling.',
        handlers: {
            cooldown: 300,
            requiredRoles: []
        },
        options: [
            {
                name: 'mood',
                description: 'How are you feeling right now?',
                required: true,
                type: 3, // STRING
                choices: [
                    { name: '😊 Happy', value: 'happy' },
                    { name: '😌 Calm', value: 'calm' },
                    { name: '😐 Neutral', value: 'neutral' },
                    { name: '😔 Sad', value: 'sad' },
                    { name: '😟 Anxious', value: 'anxious' },
                    { name: '😤 Frustrated', value: 'frustrated' },
                    { name: '😴 Tired', value: 'tired' },
                    { name: '🤔 Confused', value: 'confused' }
                ]
            },
            {
                name: 'intensity',
                description: 'How strong is this mood? (1-5)',
                required: false,
                type: 4, // INTEGER
                choices: [
                    { name: '1 (Very Low)', value: 1 },
                    { name: '2 (Low)', value: 2 },
                    { name: '3 (Moderate)', value: 3 },
                    { name: '4 (High)', value: 4 },
                    { name: '5 (Very High)', value: 5 }
                ]
            },
            {
                name: 'activity',
                description: 'What are you doing right now?',
                required: false,
                type: 3 // STRING
            },
            {
                name: 'note',
                description: 'Anything else you want to add?',
                required: false,
                type: 3 // STRING
            }
        ]
    },
    run: async (client, interaction) => {
        const mood = interaction.options.getString('mood')
        const intensity = interaction.options.getInteger('intensity') ?? 3
        const activity = interaction.options.getString('activity')
        const note = interaction.options.getString('note')
        const userId = interaction.user.id

        // Get or create user preferences for check-in interval
        const prefs = await client.db.prisma.user.findUnique({
            where: { id: BigInt(userId) },
            include: { preferences: true }
        })

        if (!prefs?.preferences) {
            await client.db.prisma.userPreferences.create({
                data: {
                    id: BigInt(userId),
                    checkInInterval: 720 // 12 hours default
                }
            })
        }

        // Calculate next check-in time based on interval
        const checkInInterval = prefs?.preferences?.checkInInterval ?? 720
        const nextCheckIn = new Date(Date.now() + checkInInterval * 60 * 1000)

        // Add the check-in
        await client.db.moodCheckIns.add(userId, mood, note, intensity, activity, nextCheckIn)
        const recent = await client.db.moodCheckIns.getAllForUser(userId, 5)

        // Format history with emojis and intensity
        const history = recent
            .map(c => {
                const moodEmoji =
                    {
                        happy: '😊',
                        calm: '😌',
                        neutral: '😐',
                        sad: '😔',
                        anxious: '😟',
                        frustrated: '😤',
                        tired: '😴',
                        confused: '🤔'
                    }[c.mood] || '❓'

                return `• ${moodEmoji} **${c.mood}** (${c.intensity}/5)${c.activity ? ` — ${c.activity}` : ''}${c.note ? `\n  _${c.note}_` : ''} <t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R>`
            })
            .join('\n')

        await interaction.reply({
            embeds: [
                new client.Gateway.EmbedBuilder()
                    .setTitle('Mood Check-In Complete!')
                    .setDescription(
                        `Thank you for checking in.\n\n` +
                            `**Current Mood:** ${mood} (${intensity}/5)` +
                            `${activity ? `\n**Activity:** ${activity}` : ''}` +
                            `${note ? `\n**Note:** ${note}` : ''}` +
                            `\n\nI'll remind you to check in again <t:${Math.floor(nextCheckIn.getTime() / 1000)}:R>.`
                    )
                    .addFields({ name: 'Recent Check-Ins', value: history || 'No recent check-ins.' })
                    .setColor(client.colors.primary)
                    .setTimestamp()
                    .setFooter({ text: client.footer, iconURL: client.logo })
            ]
        })
    }
}
