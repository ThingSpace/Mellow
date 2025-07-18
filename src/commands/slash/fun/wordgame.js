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
            let gameId = `game_${Date.now()}_${interaction.user.id}`

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

            // Add a specific request for the AI to include a "correct answer" for validation
            gamePrompt +=
                '\n\nInclude a CORRECT_ANSWER field at the end of your response that contains the answer or possible answers separated by commas. This field will be hidden from the user but will be used to validate their response.'

            const fullResponse = await client.ai.generateResponse(
                gamePrompt + '\n\nFormat your response with clear instructions and make it engaging and supportive.',
                interaction.user.id,
                { guildId: interaction.guildId, channelId: interaction.channelId }
            )

            // Extract the correct answer and remove it from the displayed content
            let gameContent = fullResponse
            let correctAnswer = ''

            if (fullResponse.includes('CORRECT_ANSWER:')) {
                const parts = fullResponse.split('CORRECT_ANSWER:')
                gameContent = parts[0].trim()
                correctAnswer = parts[1].trim()
            }

            // Store the game data for validation when the user submits their answer
            if (!client.wordGames) client.wordGames = new Map()
            client.wordGames.set(gameId, {
                type: gameType,
                difficulty,
                correctAnswer,
                userId: interaction.user.id,
                createdAt: Date.now()
            })

            // Clean up old games after 1 hour to prevent memory leaks
            setTimeout(() => {
                if (client.wordGames.has(gameId)) {
                    client.wordGames.delete(gameId)
                }
            }, 3600000) // 1 hour

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
                    }
                )
                .setFooter({ text: `${client.footer} • Mental stimulation for wellness!`, iconURL: client.logo })
                .setTimestamp()

            // Create a button for submitting answers
            const answerButton = new client.Gateway.ButtonBuilder()
                .setCustomId(`wordgame_answer_${gameId}`)
                .setLabel('Submit Your Answer')
                .setStyle(client.Gateway.ButtonStyle.Primary)
                .setEmoji('✏️')

            const row = new client.Gateway.ActionRowBuilder().addComponents(answerButton)

            await interaction.editReply({
                embeds: [embed],
                components: [row]
            })

            // Log word game usage
            if (client.systemLogger) {
                await client.systemLogger.logUserEvent(
                    interaction.user.id,
                    interaction.user.username,
                    'word_game_started',
                    `Started ${gameType} word game at ${difficulty} difficulty`
                )
            }

            // Create a collector for the button interaction
            const filter = i => i.customId === `wordgame_answer_${gameId}` && i.user.id === interaction.user.id
            const collector = interaction.channel.createMessageComponentCollector({
                filter,
                time: 900000 // 15 minutes
            })

            collector.on('collect', async i => {
                // Create and show the modal for answer submission
                const modal = new client.Gateway.ModalBuilder()
                    .setCustomId(`wordgame_modal_${gameId}`)
                    .setTitle(`Your Answer - ${gameTitle.replace(/[^\w\s]/gi, '')}`)

                // Create the text input component
                const answerInput = new client.Gateway.TextInputBuilder()
                    .setCustomId('answer_input')
                    .setLabel('Type your answer here')
                    .setStyle(client.Gateway.TextInputStyle.Paragraph)
                    .setPlaceholder('Enter your answer...')
                    .setRequired(true)
                    .setMaxLength(1000)

                // Add the text input to the modal
                const actionRow = new client.Gateway.ActionRowBuilder().addComponents(answerInput)
                modal.addComponents(actionRow)

                // Show the modal to the user
                await i.showModal(modal)
            })
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
