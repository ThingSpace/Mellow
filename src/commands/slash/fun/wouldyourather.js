import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'wouldyourather',
        category: 'Fun',
        description: 'Get a thought-provoking would-you-rather question',
        handlers: {
            cooldown: 15000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: [
            {
                name: 'category',
                description: 'Choose a question category',
                required: false,
                type: cmdTypes.STRING,
                choices: [
                    { name: 'Self-Care & Wellness', value: 'wellness' },
                    { name: 'Fun & Silly', value: 'silly' },
                    { name: 'Deep Thoughts', value: 'deep' },
                    { name: 'Superpowers', value: 'powers' },
                    { name: 'Random', value: 'random' }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const category = interaction.options.getString('category') || 'random'

        // Check if we need to defer the reply (for first-time command use)
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply()
        }

        try {
            let questionPrompt = ''

            switch (category) {
                case 'wellness':
                    questionPrompt =
                        'Create a would-you-rather question about self-care, mental wellness, relaxation, or healthy habits. Make it positive and thought-provoking.'
                    break
                case 'silly':
                    questionPrompt =
                        'Create a fun, silly would-you-rather question that would make someone laugh or smile. Keep it light and playful.'
                    break
                case 'deep':
                    questionPrompt =
                        'Create a deep, philosophical would-you-rather question that makes someone think about life, values, or personal growth.'
                    break
                case 'powers':
                    questionPrompt =
                        'Create a would-you-rather question about having different superpowers or magical abilities. Make it fun and imaginative.'
                    break
                case 'random':
                    questionPrompt =
                        'Create an interesting would-you-rather question that could be about anything wholesome and engaging.'
                    break
            }

            // Modify the prompt to get two clearly labeled options
            const formattedPrompt =
                questionPrompt +
                '\n\nFormat it as: "Would you rather [option A] or [option B]?" and then provide a brief explanation of why both options are interesting. Make it engaging and appropriate for all ages.' +
                '\n\nClearly label the two options as OPTION_A: and OPTION_B: at the end of your response so I can extract them for buttons.'

            const fullResponse = await client.ai.generateResponse(formattedPrompt, interaction.user.id, {
                guildId: interaction.guildId,
                channelId: interaction.channelId
            })

            // Extract option A and option B for buttons if they exist
            let questionContent = fullResponse
            let optionA = 'Option A'
            let optionB = 'Option B'

            if (fullResponse.includes('OPTION_A:')) {
                const optionAPart = fullResponse.split('OPTION_A:')[1]
                if (optionAPart && optionAPart.includes('OPTION_B:')) {
                    optionA = optionAPart.split('OPTION_B:')[0].trim()
                    optionB = optionAPart.split('OPTION_B:')[1].trim()

                    // Remove the options from the displayed content
                    questionContent = fullResponse.split('OPTION_A:')[0].trim()
                }
            }

            // Limit button labels to reasonable length (80 characters maximum)
            const trimOption = (option, maxLength = 80) => {
                if (option.length <= maxLength) return option
                return option.substring(0, maxLength - 3) + '...'
            }

            optionA = trimOption(optionA)
            optionB = trimOption(optionB)

            // Create unique ID for this question
            const questionId = `wyr_${Date.now()}_${interaction.user.id}`

            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('🤔 Would You Rather...')
                .setDescription(questionContent)
                .setColor(client.colors.primary)
                .addFields(
                    {
                        name: 'Category',
                        value: category.replace('_', ' ').toUpperCase(),
                        inline: true
                    },
                    {
                        name: 'How to Play',
                        value: 'Click one of the buttons below to choose!',
                        inline: false
                    }
                )
                .setFooter({ text: `${client.footer} • Great for conversations!`, iconURL: client.logo })
                .setTimestamp()

            // Create buttons for options A and B with simpler custom IDs
            const buttonA = new client.Gateway.ButtonBuilder()
                .setCustomId(`wyr_optionA_${questionId}`)
                .setLabel(optionA)
                .setStyle(client.Gateway.ButtonStyle.Primary)
                .setEmoji('🅰️')

            const buttonB = new client.Gateway.ButtonBuilder()
                .setCustomId(`wyr_optionB_${questionId}`)
                .setLabel(optionB)
                .setStyle(client.Gateway.ButtonStyle.Primary)
                .setEmoji('🅱️')

            // Create a "New Question" button
            const newQuestionButton = new client.Gateway.ButtonBuilder()
                .setCustomId(`wyr_new_${category}`)
                .setLabel('New Question')
                .setStyle(client.Gateway.ButtonStyle.Secondary)
                .setEmoji('🔄')

            // Add buttons to action row
            const row = new client.Gateway.ActionRowBuilder().addComponents(buttonA, buttonB, newQuestionButton)

            // Store voting data to track responses
            if (!client.wyrVotes) client.wyrVotes = new Map()
            client.wyrVotes.set(questionId, {
                question: questionContent,
                optionA,
                optionB,
                votes: { A: 0, B: 0 },
                voters: new Set(),
                category,
                userId: interaction.user.id,
                createdAt: Date.now()
            })

            // Clean up old questions after 6 hours
            setTimeout(() => {
                if (client.wyrVotes && client.wyrVotes.has(questionId)) {
                    client.wyrVotes.delete(questionId)
                }
            }, 21600000) // 6 hours

            // Check if we're responding to a normal command or updating after a button press
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    embeds: [embed],
                    components: [row]
                })
            } else {
                await interaction.update({
                    embeds: [embed],
                    components: [row]
                })
            }

            // Log would-you-rather usage
            if (client.systemLogger) {
                await client.systemLogger.logUserEvent(
                    interaction.user.id,
                    interaction.user.username,
                    'would_you_rather_asked',
                    `Asked ${category} would-you-rather question`
                )
            }
        } catch (error) {
            console.error('Error generating would-you-rather question:', error)

            if (client.systemLogger) {
                await client.systemLogger.logError(
                    'WOULD_YOU_RATHER_ERROR',
                    'Failed to generate would-you-rather question: ' + error.message,
                    { userId: interaction.user.id, category, error: error.stack }
                )
            }

            // Fallback questions
            const fallbackQuestions = [
                'Would you rather have the ability to fly or be invisible?',
                'Would you rather always be 10 minutes late or always be 20 minutes early?',
                'Would you rather have unlimited books or unlimited movies?',
                'Would you rather be able to speak any language or play any instrument?',
                'Would you rather have a rewind button or a pause button for your life?'
            ]

            const randomQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)]

            // Prepare a simple message with a new question button
            const fallbackEmbed = new client.Gateway.EmbedBuilder()
                .setTitle('🤔 Would You Rather...')
                .setDescription(
                    `**${randomQuestion}**\n\n*Sorry, I had trouble generating a custom question, but I hope this one sparks some interesting thoughts!*`
                )
                .setColor(client.colors.primary)
                .setFooter({ text: `${client.footer} • Great for conversations!`, iconURL: client.logo })

            // Add a new question button
            const newQuestionButton = new client.Gateway.ButtonBuilder()
                .setCustomId(`wyr_new_${category}`)
                .setLabel('Try Again')
                .setStyle(client.Gateway.ButtonStyle.Secondary)
                .setEmoji('🔄')

            const row = new client.Gateway.ActionRowBuilder().addComponents(newQuestionButton)

            // Use the appropriate response method
            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({
                    embeds: [fallbackEmbed],
                    components: [row]
                })
            } else {
                return interaction.update({
                    embeds: [fallbackEmbed],
                    components: [row]
                })
            }
        }
    }
}
