import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'wordgame',
        category: 'Fun',
        description: 'Play word games for mental stimulation and relaxation',
        handlers: {
            cooldown: 15000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: [
            {
                name: 'type',
                description: 'Choose a word game type',
                required: false,
                type: cmdTypes.STRING,
                choices: [
                    { name: 'Word Association', value: 'association' },
                    { name: 'Rhyme Time', value: 'rhyme' },
                    { name: 'Word Puzzle', value: 'puzzle' },
                    { name: 'Positive Words', value: 'positive' }
                ]
            },
            {
                name: 'difficulty',
                description: 'Choose difficulty level',
                required: false,
                type: cmdTypes.STRING,
                choices: [
                    { name: 'Easy', value: 'easy' },
                    { name: 'Medium', value: 'medium' },
                    { name: 'Hard', value: 'hard' }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const gameType = interaction.options.getString('type') || 'association'
        const difficulty = interaction.options.getString('difficulty') || 'medium'

        await interaction.deferReply()

        try {
            let gamePrompt = ''
            let gameTitle = ''

            switch (gameType) {
                case 'association':
                    gamePrompt = `Create a word association game. Give me 5 words and I'll try to find the connection between them. Make it ${difficulty} difficulty level and include some positive, wellness-related words when possible.`
                    gameTitle = '🔗 Word Association Game'
                    break
                case 'rhyme':
                    gamePrompt = `Create a rhyming word game. Give me a word and ask me to find words that rhyme with it. Make it ${difficulty} difficulty and include uplifting words when possible.`
                    gameTitle = '🎵 Rhyme Time Game'
                    break
                case 'puzzle':
                    gamePrompt = `Create a word puzzle where letters are scrambled and I need to unscramble them. Make it ${difficulty} difficulty and use positive, encouraging words when possible.`
                    gameTitle = '🧩 Word Puzzle Game'
                    break
                case 'positive':
                    gamePrompt = `Create a positive word game focused on mental wellness, self-care, and positive emotions. Ask me to find words related to wellbeing, happiness, or personal growth. Make it ${difficulty} difficulty.`
                    gameTitle = '🌟 Positive Words Game'
                    break
            }

            const gameContent = await client.ai.generateResponse(
                gamePrompt + '\n\nFormat your response with clear instructions and make it engaging and supportive.',
                interaction.user.id,
                { guildId: interaction.guildId, channelId: interaction.channelId }
            )

            const embed = new client.Gateway.EmbedBuilder()
                .setTitle(gameTitle)
                .setDescription(gameContent)
                .setColor(client.colors.primary)
                .addFields(
                    {
                        name: 'Game Type',
                        value: gameType.replace('_', ' ').toUpperCase(),
                        inline: true
                    },
                    {
                        name: 'Difficulty',
                        value: difficulty.toUpperCase(),
                        inline: true
                    },
                    {
                        name: 'How to Play',
                        value: 'Reply to this message with your answer!',
                        inline: false
                    }
                )
                .setFooter({ text: `${client.footer} • Mental stimulation for wellness!`, iconURL: client.logo })
                .setTimestamp()

            await interaction.editReply({ embeds: [embed] })

            // Log word game usage
            if (client.systemLogger) {
                await client.systemLogger.logUserEvent(
                    interaction.user.id,
                    interaction.user.username,
                    'word_game_started',
                    `Started ${gameType} word game at ${difficulty} difficulty`
                )
            }
        } catch (error) {
            console.error('Error generating word game:', error)

            if (client.systemLogger) {
                await client.systemLogger.logError(
                    'WORD_GAME_ERROR',
                    'Failed to generate word game: ' + error.message,
                    { userId: interaction.user.id, gameType, difficulty, error: error.stack }
                )
            }

            return interaction.editReply({
                content: '❌ Sorry, I encountered an error while generating the word game. Please try again later.',
                ephemeral: true
            })
        }
    }
}
