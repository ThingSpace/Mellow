import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

export default {
    structure: {
        name: 'trivia',
        category: 'Fun',
        description: 'Play a trivia game with mental health and general knowledge questions',
        handlers: {
            cooldown: 15000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: [
            {
                name: 'category',
                description: 'Choose a trivia category',
                required: false,
                type: cmdTypes.STRING,
                choices: [
                    { name: 'Mental Health Awareness', value: 'mental_health' },
                    { name: 'General Knowledge', value: 'general' },
                    { name: 'Science & Nature', value: 'science' },
                    { name: 'Random Mix', value: 'random' }
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
        const category = interaction.options.getString('category') || 'random'
        const difficulty = interaction.options.getString('difficulty') || 'medium'

        await interaction.deferReply()

        try {
            // Generate trivia question using AI
            const triviaContent = await client.ai.generateResponse(
                `Generate a ${difficulty} difficulty trivia question about ${category === 'mental_health' ? 'mental health awareness, coping strategies, or wellness' : category === 'general' ? 'general knowledge' : category === 'science' ? 'science and nature' : 'any interesting topic'}. 

Format your response as:
Question: [the question]
A) [option A]
B) [option B] 
C) [option C]
D) [option D]
Correct Answer: [letter]
Explanation: [brief explanation of the answer]

Make it educational and engaging. If it's mental health related, keep it positive and informative.`,
                interaction.user.id,
                { guildId: interaction.guildId, channelId: interaction.channelId }
            )

            // Parse the AI response to extract question components
            const lines = triviaContent.split('\n').filter(line => line.trim())
            const question = lines
                .find(line => line.startsWith('Question:'))
                ?.replace('Question:', '')
                .trim()
            const options = lines.filter(line => /^[A-D]\)/.test(line))
            const correctAnswer = lines
                .find(line => line.startsWith('Correct Answer:'))
                ?.replace('Correct Answer:', '')
                .trim()
            const explanation = lines
                .find(line => line.startsWith('Explanation:'))
                ?.replace('Explanation:', '')
                .trim()

            if (!question || options.length !== 4) {
                throw new Error('Failed to parse trivia question')
            }

            // Create buttons for A, B, C, D options
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`trivia_A_${interaction.user.id}`)
                    .setLabel('A')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`trivia_B_${interaction.user.id}`)
                    .setLabel('B')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`trivia_C_${interaction.user.id}`)
                    .setLabel('C')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`trivia_D_${interaction.user.id}`)
                    .setLabel('D')
                    .setStyle(ButtonStyle.Primary)
            )

            // Update the footer text to mention buttons instead of reactions
            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('🧠 Trivia Time!')
                .setDescription(
                    `**Category:** ${category.replace('_', ' ').toUpperCase()}\n**Difficulty:** ${difficulty.toUpperCase()}`
                )
                .setColor(client.colors.primary)
                .addFields(
                    {
                        name: 'Question',
                        value: question,
                        inline: false
                    },
                    {
                        name: 'Options',
                        value: options.join('\n'),
                        inline: false
                    }
                )
                .setFooter({ text: `${client.footer} • Click a button to answer!`, iconURL: client.logo })
                .setTimestamp()

            // Send the message with buttons
            await interaction.editReply({ embeds: [embed], components: [buttons] })

            // Create button interaction collector
            const filter = i =>
                i.customId.startsWith('trivia_') &&
                i.customId.endsWith(interaction.user.id) &&
                i.user.id === interaction.user.id

            const collector = interaction.channel.createMessageComponentCollector({
                filter,
                time: 30000,
                max: 1
            })

            collector.on('collect', async i => {
                // Get the selected answer from the button custom ID
                const userAnswer = i.customId.split('_')[1]
                const isCorrect = userAnswer === correctAnswer

                // Disable all buttons
                buttons.components.forEach(button => button.setDisabled(true))

                // Change the color of the selected button
                const selectedButton = buttons.components.find(
                    button => button.data.custom_id === `trivia_${userAnswer}_${interaction.user.id}`
                )

                if (selectedButton) {
                    selectedButton.setStyle(isCorrect ? ButtonStyle.Success : ButtonStyle.Danger)
                }

                // Show the result
                const resultEmbed = new client.Gateway.EmbedBuilder()
                    .setTitle(isCorrect ? '✅ Correct!' : '❌ Incorrect')
                    .setDescription(`Your answer: **${userAnswer}**\nCorrect answer: **${correctAnswer}**`)
                    .setColor(isCorrect ? client.colors.success : client.colors.error)
                    .addFields(
                        {
                            name: 'Question',
                            value: question,
                            inline: false
                        },
                        {
                            name: 'Explanation',
                            value: explanation || 'No explanation provided.',
                            inline: false
                        }
                    )
                    .setFooter({ text: client.footer, iconURL: client.logo })
                    .setTimestamp()

                // Update the original message to show the result and disabled buttons
                await i.update({ embeds: [resultEmbed], components: [buttons] })

                if (client.systemLogger) {
                    await client.systemLogger.logUserEvent(
                        interaction.user.id,
                        interaction.user.username,
                        'trivia_answered',
                        `Answered ${category} trivia question - ${isCorrect ? 'correct' : 'incorrect'}`
                    )
                }
            })

            collector.on('end', async collected => {
                if (collected.size === 0) {
                    // Disable all buttons
                    buttons.components.forEach(button => button.setDisabled(true))

                    const timeoutEmbed = new client.Gateway.EmbedBuilder()
                        .setTitle("⏰ Time's Up!")
                        .setDescription(`The correct answer was: **${correctAnswer}**`)
                        .setColor(client.colors.warning)
                        .addFields(
                            {
                                name: 'Question',
                                value: question,
                                inline: false
                            },
                            {
                                name: 'Explanation',
                                value: explanation || 'No explanation provided.',
                                inline: false
                            }
                        )
                        .setFooter({ text: client.footer, iconURL: client.logo })
                        .setTimestamp()

                    await interaction.editReply({ embeds: [timeoutEmbed], components: [buttons] })
                }
            })
        } catch (error) {
            console.error('Error generating trivia:', error)

            if (client.systemLogger) {
                await client.systemLogger.logError(
                    'TRIVIA_GENERATION_ERROR',
                    'Failed to generate trivia question: ' + error.message,
                    { userId: interaction.user.id, category, difficulty, error: error.stack }
                )
            }

            return interaction.editReply({
                content:
                    '❌ Sorry, I encountered an error while generating the trivia question. Please try again later.',
                ephemeral: true
            })
        }
    }
}
