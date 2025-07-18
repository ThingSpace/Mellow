import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'joke',
        category: 'Fun',
        description: 'Get a wholesome joke to brighten your day',
        handlers: {
            cooldown: 10000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: [
            {
                name: 'type',
                description: 'Choose a joke type',
                required: false,
                type: cmdTypes.STRING,
                choices: [
                    { name: 'Dad Jokes', value: 'dad' },
                    { name: 'Puns', value: 'pun' },
                    { name: 'Wholesome', value: 'wholesome' },
                    { name: 'Mental Health Humor', value: 'mental_health' },
                    { name: 'Random', value: 'random' }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const jokeType = interaction.options.getString('type') || 'random'

        await interaction.deferReply()

        try {
            let jokePrompt = ''

            switch (jokeType) {
                case 'dad':
                    jokePrompt = 'Tell me a clean, wholesome dad joke that would make someone smile.'
                    break
                case 'pun':
                    jokePrompt = 'Tell me a clever, family-friendly pun that would make someone chuckle.'
                    break
                case 'wholesome':
                    jokePrompt = "Tell me a wholesome, uplifting joke that would brighten someone's day."
                    break
                case 'mental_health':
                    jokePrompt =
                        'Tell me a gentle, supportive joke about mental health, therapy, or self-care that would make someone smile without being offensive or minimizing mental health struggles.'
                    break
                case 'random':
                    jokePrompt = 'Tell me a clean, family-friendly joke that would make someone laugh and feel good.'
                    break
            }

            const jokeContent = await client.ai.generateResponse(
                jokePrompt +
                    "\n\nMake it appropriate for all ages and uplifting in nature. If you can't think of a good joke, share a positive, encouraging message instead.",
                interaction.user.id,
                { guildId: interaction.guildId, channelId: interaction.channelId }
            )

            const embed = new client.Gateway.EmbedBuilder()
                .setTitle("😄 Here's a joke for you!")
                .setDescription(jokeContent)
                .setColor(client.colors.primary)
                .addFields(
                    {
                        name: 'Joke Type',
                        value: jokeType.replace('_', ' ').toUpperCase(),
                        inline: true
                    },
                    {
                        name: '💡 Remember',
                        value: 'Laughter is great medicine for the soul! 🌟',
                        inline: false
                    }
                )
                .setFooter({ text: `${client.footer} • Keep smiling!`, iconURL: client.logo })
                .setTimestamp()

            await interaction.editReply({ embeds: [embed] })

            // Log joke usage
            if (client.systemLogger) {
                await client.systemLogger.logUserEvent(
                    interaction.user.id,
                    interaction.user.username,
                    'joke_requested',
                    `Requested ${jokeType} joke`
                )
            }
        } catch (error) {
            console.error('Error generating joke:', error)

            if (client.systemLogger) {
                await client.systemLogger.logError(
                    'JOKE_GENERATION_ERROR',
                    'Failed to generate joke: ' + error.message,
                    { userId: interaction.user.id, jokeType, error: error.stack }
                )
            }

            // Fallback jokes
            const fallbackJokes = [
                "Why don't scientists trust atoms? Because they make up everything! 😄",
                'What do you call a bear with no teeth? A gummy bear! 🐻',
                'Why did the scarecrow win an award? Because he was outstanding in his field! 🌾',
                'What do you call a sleeping bull? A bulldozer! 😴',
                "Why don't eggs tell jokes? They'd crack each other up! 🥚"
            ]

            const randomJoke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)]

            return interaction.editReply({
                content: `Here's a backup joke for you:\n\n${randomJoke}\n\n*Sorry, I had trouble generating a custom joke, but I hope this one made you smile!*`
            })
        }
    }
}
