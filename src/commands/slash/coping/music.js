import { buildCopingPrompt } from '../../../services/tools/copingTool.js'

export default {
    structure: {
        name: 'music',
        category: 'Coping',
        description: 'Get calming music suggestions for relaxation.',
        handlers: {
            cooldown: 15000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: []
    },
    run: async (client, interaction) => {
        try {
            // Log music suggestion access
            if (client.systemLogger) {
                await client.systemLogger.logUserEvent(
                    interaction.user.id,
                    interaction.user.username,
                    'music_suggestion_accessed',
                    'User requested calming music suggestions'
                )
            }

            const musicSuggestions = [
                {
                    title: 'Lo-fi Hip Hop Radio',
                    description: 'Chill beats perfect for relaxation and focus',
                    link: 'https://www.youtube.com/watch?v=jfKfPfyJRdk'
                },
                {
                    title: 'Calm Piano Music',
                    description: 'Peaceful piano melodies for stress relief',
                    link: 'https://www.youtube.com/watch?v=1ZYbU82GVz4'
                },
                {
                    title: 'Rain Sounds',
                    description: 'Natural rain sounds for deep relaxation',
                    link: 'https://www.youtube.com/watch?v=DWcJFNfaw9c'
                },
                {
                    title: 'Forest Sounds',
                    description: 'Peaceful nature sounds and birds chirping',
                    link: 'https://www.youtube.com/watch?v=OdIJ2x3nxzQ'
                },
                {
                    title: 'Meditation Music',
                    description: 'Soft ambient music for mindfulness practice',
                    link: 'https://www.youtube.com/watch?v=Pj5TNndww4I'
                }
            ]

            const randomSuggestion = musicSuggestions[Math.floor(Math.random() * musicSuggestions.length)]

            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('🎵 Calming Music Suggestion')
                .setColor(client.colors.primary)
                .setDescription(`Here's something peaceful to listen to:`)
                .addFields(
                    {
                        name: randomSuggestion.title,
                        value: `${randomSuggestion.description}\n[Listen here](${randomSuggestion.link})`,
                        inline: false
                    },
                    {
                        name: '💡 Tip',
                        value: 'Try using headphones for a more immersive experience. Music can be a powerful tool for managing stress and emotions.',
                        inline: false
                    }
                )
                .setFooter({ text: client.footer, iconURL: client.logo })
                .setTimestamp()

            return interaction.reply({ embeds: [embed] })
        } catch (error) {
            console.error('Error in music command:', error)

            if (client.systemLogger) {
                await client.systemLogger.logError(error, 'Music Command')
            }

            return interaction.reply({
                content: '❌ An error occurred while fetching music suggestions. Please try again later.',
                ephemeral: true
            })
        }
    }
}
