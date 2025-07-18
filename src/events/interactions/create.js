import { Events, PermissionFlagsBits } from 'discord.js'
import { log } from '../../functions/logger.js'

const cooldown = new Map()

export default {
    event: Events.InteractionCreate,

    run: async (client, interaction) => {
        // Handle modal submissions for word games
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('wordgame_modal_')) {
                const gameId = interaction.customId.replace('wordgame_modal_', '')
                const userAnswer = interaction.fields.getTextInputValue('answer_input')

                // Get the game data
                if (!client.wordGames || !client.wordGames.has(gameId)) {
                    return interaction.reply({
                        content: '❌ Sorry, this game session has expired or was not found.',
                        ephemeral: true
                    })
                }

                const gameData = client.wordGames.get(gameId)

                // Ensure the user who submitted is the one who started the game
                if (interaction.user.id !== gameData.userId) {
                    return interaction.reply({
                        content: '❌ You can only answer your own word games.',
                        ephemeral: true
                    })
                }

                try {
                    // Validate the answer - compare to stored correct answer
                    // Create a simple fuzzy matching by converting both to lowercase
                    // and checking if the user's answer contains any of the acceptable answers
                    const correctAnswers = gameData.correctAnswer
                        .toLowerCase()
                        .split(',')
                        .map(a => a.trim())
                    const normalizedUserAnswer = userAnswer.toLowerCase().trim()

                    const isCorrect = correctAnswers.some(
                        answer => normalizedUserAnswer.includes(answer) || answer.includes(normalizedUserAnswer)
                    )

                    // Prepare the evaluation prompt
                    const evaluationPrompt = `
                        The user was playing a ${gameData.type} word game at ${gameData.difficulty} difficulty.
                        The correct answer was: ${gameData.correctAnswer}
                        The user's answer was: ${userAnswer}
                        
                        Please evaluate their answer and provide encouraging feedback. 
                        If they're close but not exactly right, be supportive. 
                        If they're completely wrong, give them a hint and encourage them to try again.
                        Keep your response positive and supportive for mental wellness.
                        
                        Start your response with either "Correct!" or "Not quite, but" based on your evaluation.
                    `

                    // Generate feedback using AI
                    const feedback = await client.ai.generateResponse(evaluationPrompt, interaction.user.id, {
                        guildId: interaction.guild.id,
                        channelId: interaction.channel.id
                    })

                    // Create the response embed
                    const feedbackEmbed = new client.Gateway.EmbedBuilder()
                        .setTitle(isCorrect ? '🎉 Great Job!' : '🤔 Keep Thinking!')
                        .setDescription(feedback)
                        .setColor(isCorrect ? '#43B581' : '#F9A62B')
                        .setFooter({ text: `${client.footer} • Word games for mental wellness`, iconURL: client.logo })
                        .setTimestamp()

                    // Add a button to play again
                    const playAgainButton = new client.Gateway.ButtonBuilder()
                        .setCustomId(`wordgame_playagain_${gameData.type}_${gameData.difficulty}`)
                        .setLabel('Play Again')
                        .setStyle(client.Gateway.ButtonStyle.Success)
                        .setEmoji('🎮')

                    const row = new client.Gateway.ActionRowBuilder().addComponents(playAgainButton)

                    await interaction.reply({
                        embeds: [feedbackEmbed],
                        components: [row],
                        ephemeral: false
                    })

                    // Log the answer submission
                    if (client.systemLogger) {
                        await client.systemLogger.logUserEvent(
                            interaction.user.id,
                            interaction.user.username,
                            'word_game_answered',
                            `Answered ${gameData.type} word game: ${isCorrect ? 'correctly' : 'incorrectly'}`
                        )
                    }

                    // Clean up - remove the game data
                    client.wordGames.delete(gameId)
                } catch (error) {
                    console.error('Error processing word game answer:', error)
                    log(`Error processing word game answer: ${error.message}`, 'error')

                    if (client.systemLogger) {
                        await client.systemLogger.logError(
                            'WORD_GAME_ANSWER_ERROR',
                            'Failed to process word game answer: ' + error.message,
                            { userId: interaction.user.id, gameId, error: error.stack }
                        )
                    }

                    return interaction.reply({
                        content:
                            '❌ Sorry, I encountered an error while processing your answer. Please try again later.',
                        ephemeral: true
                    })
                }

                return // Exit after handling the modal
            }
        }

        // Handle button interactions for "Play Again" word game
        if (interaction.isButton()) {
            // Handle Would You Rather button interactions
            if (interaction.customId.startsWith('wyr_option')) {
                // Extract the option and question ID
                // The format is wyr_optionA_wyr_12345_userid
                // So we need to handle this properly to get the full question ID
                const parts = interaction.customId.split('_')
                const option = parts[1] // optionA or optionB

                // Reconstruct the question ID from remaining parts
                // This will combine all parts after "optionA" or "optionB" with underscores
                const questionId = parts.slice(2).join('_')

                // Get question data
                if (!client.wyrVotes || !client.wyrVotes.has(questionId)) {
                    console.log(`Question not found: ${questionId}`)
                    console.log('Available questions:', Array.from(client.wyrVotes.keys()))

                    return interaction.reply({
                        content: '❌ This question has expired or was not found.',
                        ephemeral: true
                    })
                }

                const questionData = client.wyrVotes.get(questionId)
                const voterId = interaction.user.id

                // Check if user already voted
                if (questionData.voters.has(voterId)) {
                    return interaction.reply({
                        content: 'You have already voted on this question!',
                        ephemeral: true
                    })
                }

                // Record the vote
                const voteOption = option === 'optionA' ? 'A' : 'B'
                questionData.votes[voteOption]++
                questionData.voters.add(voterId)

                // Create updated embed with current vote counts
                const voteEmbed = new client.Gateway.EmbedBuilder()
                    .setTitle(`You chose: ${voteOption === 'A' ? 'Option A 🅰️' : 'Option B 🅱️'}`)
                    .setDescription(
                        `You selected: **${voteOption === 'A' ? questionData.optionA : questionData.optionB}**`
                    )
                    .setColor(client.colors.success)
                    .addFields({
                        name: 'Current Votes',
                        value: `🅰️: ${questionData.votes.A} votes\n🅱️: ${questionData.votes.B} votes`,
                        inline: false
                    })
                    .setFooter({ text: `${client.footer} • Thanks for participating!`, iconURL: client.logo })

                // Log the vote
                if (client.systemLogger) {
                    await client.systemLogger.logUserEvent(
                        interaction.user.id,
                        interaction.user.username,
                        'would_you_rather_voted',
                        `Voted for Option ${voteOption} on question`
                    )
                }

                return interaction.reply({
                    embeds: [voteEmbed]
                })
            }

            // Handle new Would You Rather question request
            if (interaction.customId.startsWith('wyr_new_')) {
                const category = interaction.customId.replace('wyr_new_', '')

                // Get the would-you-rather command
                const command = client.slash.get('wouldyourather')
                if (command) {
                    try {
                        await interaction.deferUpdate()

                        // Create a fake interaction object with the needed properties
                        const wyrInteraction = {
                            ...interaction,
                            commandName: 'wouldyourather',
                            options: {
                                getString: name => {
                                    if (name === 'category') return category
                                    return null
                                }
                            },
                            // These are already handled by deferUpdate
                            deferred: true,
                            replied: false,
                            // We'll use update instead of editReply
                            editReply: interaction.editReply.bind(interaction)
                        }

                        // Execute the command with our custom interaction
                        await command.run(client, wyrInteraction)
                    } catch (error) {
                        console.error('Error generating new would-you-rather question:', error)
                        log(`Error generating new would-you-rather question: ${error.message}`, 'error')

                        await interaction.followUp({
                            content:
                                '❌ I encountered an error while generating a new question. Please try again later.',
                            ephemeral: true
                        })
                    }

                    return
                }
            }

            // Handle word game play again button
            if (interaction.customId.startsWith('wordgame_playagain_')) {
                const [_, __, type, difficulty] = interaction.customId.split('_')

                // Get the wordgame command
                const command = client.slash.get('wordgame')
                if (command) {
                    try {
                        // Instead of trying to reuse the command, we'll create a new game directly
                        await interaction.deferUpdate() // Use deferUpdate instead of deferReply for button responses

                        // Create a new game with the same settings
                        let gamePrompt = ''
                        let gameTitle = ''
                        let gameId = `game_${Date.now()}_${interaction.user.id}`

                        switch (type) {
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
                            gamePrompt +
                                '\n\nFormat your response with clear instructions and make it engaging and supportive.',
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
                            type,
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
                                    value: type.replace('_', ' ').toUpperCase(),
                                    inline: true
                                },
                                {
                                    name: 'Difficulty',
                                    value: difficulty.toUpperCase(),
                                    inline: true
                                }
                            )
                            .setFooter({
                                text: `${client.footer} • Mental stimulation for wellness!`,
                                iconURL: client.logo
                            })
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
                                'word_game_restarted',
                                `Restarted ${type} word game at ${difficulty} difficulty`
                            )
                        }

                        // Create a collector for the button interaction
                        const filter = i =>
                            i.customId === `wordgame_answer_${gameId}` && i.user.id === interaction.user.id
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
                        console.error('Error restarting word game:', error)
                        log(`Error restarting word game: ${error.message}`, 'error')

                        // Use followUp instead of reply since we've already deferred
                        await interaction.followUp({
                            content:
                                '❌ Sorry, I encountered an error while starting a new game. Please try using the /wordgame command again.',
                            ephemeral: true
                        })
                    }

                    return // Exit after handling the button
                }
            }
        }

        // Original command handling logic
        if (interaction.isContextMenuCommand() || !interaction.isChatInputCommand() || !interaction.isCommand()) {
            return
        }

        const command = client.slash.get(interaction.commandName) || client.private.get(interaction.commandName)
        if (!command) {
            return
        }

        // Dual permission system
        const requiredDiscordPermissions = command.structure.handlers.requiredPerms || []
        const requiredRoles = command.structure.handlers.requiredRoles || []
        const isGuildOnly = command.structure.handlers.guildOnly || false

        // Check if the command is guild-only
        if (isGuildOnly && !interaction.guild) {
            return interaction.reply({
                ephemeral: true,
                content: '❌ This command can only be used in a server.'
            })
        }

        // Discord permissions check
        if (requiredDiscordPermissions.length > 0 && interaction.guild) {
            const member = await interaction.guild.members.fetch(interaction.user.id)
            const hasPermission = requiredDiscordPermissions.some(perm => {
                // Convert string permission names to PermissionFlagsBits
                const permFlag = typeof perm === 'string' ? PermissionFlagsBits[perm] : perm
                return permFlag && member.permissions.has(permFlag)
            })

            if (!hasPermission) {
                return interaction.reply({
                    ephemeral: true,
                    embeds: [
                        new client.Gateway.EmbedBuilder()
                            .setTitle('Permission Denied')
                            .setColor(client.colors.error)
                            .setDescription('You lack the required Discord permissions for this command.')
                            .addFields({
                                name: 'Required Permissions',
                                value: requiredDiscordPermissions.map(p => `\`${p}\``).join(', ')
                            })
                            .setThumbnail(client.logo)
                    ]
                })
            }
        }

        // DB role check
        if (requiredRoles.length > 0) {
            const user = await client.db.users.findById(BigInt(interaction.user.id))
            if (!user) {
                return interaction.reply({
                    ephemeral: true,
                    embeds: [
                        new client.Gateway.EmbedBuilder()
                            .setTitle('ERROR: User not registered')
                            .setColor(client.colors.error)
                            .setDescription('You need to be registered in the system to use this command.')
                            .setThumbnail(client.logo)
                    ]
                })
            }
            if (user.isBanned) {
                const banText = user.bannedUntil
                    ? `You are banned until ${user.bannedUntil.toLocaleString()}`
                    : 'You are permanently banned'

                return interaction.reply({
                    ephemeral: true,
                    embeds: [
                        new client.Gateway.EmbedBuilder()
                            .setTitle('Access Denied')
                            .setColor(client.colors.error)
                            .setDescription(banText)
                            .setThumbnail(client.logo)
                    ]
                })
            }
            // OWNER bypass: OWNERs always have access
            if (user.role === 'OWNER') {
                // OWNERs bypass all role checks
            } else if (!requiredRoles.includes(user.role)) {
                return interaction.reply({
                    ephemeral: true,
                    embeds: [
                        new client.Gateway.EmbedBuilder()
                            .setTitle('Permission Denied')
                            .setColor(client.colors.error)
                            .setDescription('You lack the required role for this command.')
                            .addFields(
                                {
                                    name: 'Required Roles',
                                    value: requiredRoles.map(r => `\`${r}\``).join(', ')
                                },
                                {
                                    name: 'Your Role',
                                    value: `\`${user.role}\``
                                }
                            )
                            .setThumbnail(client.logo)
                    ]
                })
            }
        }

        // Cooldown logic
        if (command.handlers?.cooldown) {
            const isGlobalCooldown = command.handlers.globalCooldown
            const cooldownKey = isGlobalCooldown ? 'global_' + command.structure.name : interaction.user.id

            const cooldownFunction = () => {
                const data = cooldown.get(cooldownKey) || []
                data.push(interaction.commandName)
                cooldown.set(cooldownKey, data)
                setTimeout(() => {
                    let data = cooldown.get(cooldownKey)
                    data = data.filter(v => v !== interaction.commandName)
                    if (data.length <= 0) {
                        cooldown.delete(cooldownKey)
                    } else {
                        cooldown.set(cooldownKey, data)
                    }
                }, command.handlers.cooldown)
            }

            if (cooldown.has(cooldownKey)) {
                const data = cooldown.get(cooldownKey)
                if (data.some(v => v === interaction.commandName)) {
                    const message = (
                        isGlobalCooldown
                            ? 'Slow down buddy, this command is on a global cooldown and you are using it too fast!'
                            : 'You are using this command too fast! Please wait: (${cooldown}s)'
                    ).replace('/${cooldown}/g', command.handlers.cooldown / 1000)
                    await interaction.reply({
                        content: message,
                        ephemeral: true
                    })
                    return
                }
                cooldownFunction()
            } else {
                cooldown.set(cooldownKey, [interaction.commandName])
                cooldownFunction()
            }
        }

        // Actually run the command
        try {
            await command.run(client, interaction)

            // Log successful command usage
            if (client.systemLogger) {
                await client.systemLogger.logCommandUsage(
                    interaction,
                    interaction.commandName,
                    command.structure.category || 'Unknown',
                    true
                )
            }
        } catch (err) {
            log(`Failed to execute command: ${interaction.commandName}`, 'error')
            log(err, 'debug')

            // Log failed command usage
            if (client.systemLogger) {
                await client.systemLogger.logCommandUsage(
                    interaction,
                    interaction.commandName,
                    command.structure.category || 'Unknown',
                    false
                )

                // Log the error details
                await client.systemLogger.logError(err, `Command: ${interaction.commandName}`)
            }

            if (!interaction.replied) {
                try {
                    await interaction.reply({
                        ephemeral: true,
                        content: 'An error occurred while executing this command!'
                    })
                } catch (replyError) {
                    console.error('Failed to send error reply:', replyError)
                }
            }
        }
    }
}
