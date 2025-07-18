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

        await interaction.deferReply()

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

            const questionContent = await client.ai.generateResponse(
                questionPrompt +
                    '\n\nFormat it as: "Would you rather [option A] or [option B]?" and then provide a brief explanation of why both options are interesting. Make it engaging and appropriate for all ages.',
                interaction.user.id,
                { guildId: interaction.guildId, channelId: interaction.channelId }
            )

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
                        value: 'React with 🅰️ for option A or 🅱️ for option B!',
                        inline: false
                    }
                )
                .setFooter({ text: `${client.footer} • Great for conversations!`, iconURL: client.logo })
                .setTimestamp()

            const message = await interaction.editReply({ embeds: [embed] })

            // Add reaction options
            await message.react('🅰️')
            await message.react('🅱️')

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

            return interaction.editReply({
                content: `Here's a would-you-rather question for you:\n\n**${randomQuestion}**\n\n*Sorry, I had trouble generating a custom question, but I hope this one sparks some interesting thoughts!*`
            })
        }
    }
}
