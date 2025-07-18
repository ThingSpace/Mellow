import { cmdTypes } from '../../../configs/cmdTypes.config.js'

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
                .setFooter({ text: `${client.footer} • React with 🇦 🇧 🇨 🇩 to answer!`, iconURL: client.logo })
                .setTimestamp()

            const message = await interaction.editReply({ embeds: [embed] })

            // Add reaction options
            const reactions = ['🇦', '🇧', '🇨', '🇩']
            for (const reaction of reactions) {
                await message.react(reaction)
            }

            // Set up collector for reactions
            const filter = (reaction, user) => {
                return reactions.includes(reaction.emoji.name) && user.id === interaction.user.id
            }

            const collector = message.createReactionCollector({ filter, time: 30000, max: 1 })

            collector.on('collect', async reaction => {
                const userAnswer = reaction.emoji.name
                const answerMap = { '🇦': 'A', '🇧': 'B', '🇨': 'C', '🇩': 'D' }
                const userLetter = answerMap[userAnswer]
                const isCorrect = userLetter === correctAnswer

                const resultEmbed = new client.Gateway.EmbedBuilder()
                    .setTitle(isCorrect ? '✅ Correct!' : '❌ Incorrect')
                    .setDescription(`Your answer: **${userLetter}**\nCorrect answer: **${correctAnswer}**`)
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

                await interaction.editReply({ embeds: [resultEmbed] })

                // Log trivia participation
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

                    await interaction.editReply({ embeds: [timeoutEmbed] })
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
