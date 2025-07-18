import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'memegen',
        category: 'Fun',
        description: 'Generate a fun meme idea with AI',
        handlers: {
            cooldown: 30000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: [
            {
                name: 'template',
                description: 'Meme template to use (optional)',
                required: false,
                type: cmdTypes.STRING,
                choices: [
                    { name: 'Distracted Boyfriend', value: 'distracted boyfriend' },
                    { name: 'Drake', value: 'drake' },
                    { name: 'Expanding Brain', value: 'expanding brain' },
                    { name: 'Two Buttons', value: 'two buttons' },
                    { name: 'Change My Mind', value: 'change my mind' },
                    { name: 'This Is Fine', value: 'this is fine' },
                    { name: 'Pointing Spider-Man', value: 'pointing spider-man' }
                ]
            },
            {
                name: 'topic',
                description: 'Topic for the meme (optional)',
                required: false,
                type: cmdTypes.STRING
            },
            {
                name: 'mood',
                description: 'Mood of the meme',
                required: false,
                type: cmdTypes.STRING,
                choices: [
                    { name: 'Funny', value: 'funny' },
                    { name: 'Wholesome', value: 'wholesome' },
                    { name: 'Relatable', value: 'relatable' },
                    { name: 'Supportive', value: 'supportive' }
                ]
            },
            {
                name: 'mental-health',
                description: 'Focus on mental health themes',
                required: false,
                type: cmdTypes.BOOLEAN
            }
        ]
    },
    run: async (client, interaction) => {
        const template = interaction.options.getString('template')
        const topic = interaction.options.getString('topic')
        const mood = interaction.options.getString('mood') || 'funny'
        const mentalHealthFocused = interaction.options.getBoolean('mental-health') || false

        await interaction.deferReply()

        try {
            // Generate meme content using AI service
            const memeContent = await client.ai.generateMemeContent({
                template,
                topic,
                mood,
                mentalHealthFocused
            })

            // Create embed with meme content
            const embed = new client.Gateway.EmbedBuilder()
                .setTitle(`🎭 ${memeContent.title || 'Your Generated Meme Idea'}`)
                .setColor(client.colors.primary)

            // Add image to embed
            if (memeContent.imageUrl) {
                embed.setImage(memeContent.imageUrl)

                // Check if we're using a fallback image (doesn't contain text)
                const isFallbackImage =
                    memeContent.imageUrl.includes('imgflip.com/') && !memeContent.imageUrl.includes('i.imgflip.com/')

                if (isFallbackImage) {
                    embed.setDescription(
                        `*Note: Using template image only. For memes with text, the bot needs ImgFlip credentials.*\n\n**Top Text:** ${memeContent.topText}\n**Bottom Text:** ${memeContent.bottomText}`
                    )
                }
            } else {
                // If no image URL is available
                embed.setDescription("*Image generation failed. Here's the meme content instead:*")
            }

            embed
                .addFields(
                    {
                        name: 'Top Text',
                        value: memeContent.topText || 'No top text generated',
                        inline: false
                    },
                    {
                        name: 'Bottom Text',
                        value: memeContent.bottomText || 'No bottom text generated',
                        inline: false
                    }
                )
                .setFooter({ text: client.footer, iconURL: client.logo })
                .setTimestamp()

            // Add image description if available
            if (memeContent.imageDescription) {
                embed.addFields({
                    name: 'Image Description',
                    value: memeContent.imageDescription,
                    inline: false
                })
            }

            // Add template and topic information
            const details = []
            if (template) details.push(`**Template:** ${template}`)
            if (topic) details.push(`**Topic:** ${topic}`)
            details.push(`**Mood:** ${mood}`)

            if (details.length > 0) {
                embed.setDescription(details.join('\n'))
            }

            // Log meme generation
            if (client.systemLogger) {
                await client.systemLogger.logUserEvent(
                    interaction.user.id,
                    interaction.user.username,
                    'meme_generated',
                    `Generated a ${mood} meme${template ? ` using ${template} template` : ''}${topic ? ` about ${topic}` : ''}`
                )
            }

            return interaction.editReply({ embeds: [embed] })
        } catch (error) {
            console.error('Error generating meme:', error)

            // Log the error
            if (client.systemLogger) {
                await client.systemLogger.logError(
                    'MEME_GENERATION_ERROR',
                    'Failed to generate meme: ' + error.message,
                    {
                        userId: interaction.user.id,
                        template,
                        topic,
                        mood,
                        error: error.stack
                    }
                )
            }

            return interaction.editReply({
                content:
                    '❌ Sorry, I encountered an error while generating your meme. Please try again later or with different options.',
                ephemeral: true
            })
        }
    }
}
