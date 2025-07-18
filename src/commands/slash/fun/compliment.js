import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'compliment',
        category: 'Fun',
        description: "Generate a personalized compliment to brighten someone's day",
        handlers: {
            cooldown: 10000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: [
            {
                name: 'for',
                description: 'Who is this compliment for? (optional)',
                required: false,
                type: cmdTypes.USER
            },
            {
                name: 'type',
                description: 'Choose a compliment type',
                required: false,
                type: cmdTypes.STRING,
                choices: [
                    { name: 'General Positivity', value: 'general' },
                    { name: 'Strength & Resilience', value: 'strength' },
                    { name: 'Creativity & Uniqueness', value: 'creativity' },
                    { name: 'Kindness & Compassion', value: 'kindness' },
                    { name: 'Personal Growth', value: 'growth' }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const targetUser = interaction.options.getUser('for')
        const complimentType = interaction.options.getString('type') || 'general'

        await interaction.deferReply()

        try {
            let complimentPrompt = ''
            const recipient = targetUser ? targetUser.username : 'the user'

            switch (complimentType) {
                case 'general':
                    complimentPrompt = `Generate a warm, genuine compliment that would make ${recipient} feel appreciated and valued. Make it uplifting and personal.`
                    break
                case 'strength':
                    complimentPrompt = `Generate a compliment about ${recipient}'s inner strength, resilience, and ability to overcome challenges. Make it empowering and encouraging.`
                    break
                case 'creativity':
                    complimentPrompt = `Generate a compliment about ${recipient}'s creativity, uniqueness, and the special perspective they bring to the world.`
                    break
                case 'kindness':
                    complimentPrompt = `Generate a compliment about ${recipient}'s kindness, compassion, and the positive impact they have on others.`
                    break
                case 'growth':
                    complimentPrompt = `Generate a compliment about ${recipient}'s personal growth, learning journey, and commitment to becoming their best self.`
                    break
            }

            const complimentContent = await client.ai.generateResponse(
                complimentPrompt +
                    '\n\nMake it heartfelt, specific, and genuinely uplifting. Avoid generic phrases and make it feel personal and meaningful.',
                interaction.user.id,
                { guildId: interaction.guildId, channelId: interaction.channelId }
            )

            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('🌟 A Special Compliment')
                .setDescription(complimentContent)
                .setColor(client.colors.success)
                .addFields(
                    {
                        name: 'For',
                        value: targetUser ? `<@${targetUser.id}>` : 'You',
                        inline: true
                    },
                    {
                        name: 'Type',
                        value: complimentType.replace('_', ' ').toUpperCase(),
                        inline: true
                    },
                    {
                        name: '💝 Remember',
                        value: 'You deserve all the kindness and positivity in the world!',
                        inline: false
                    }
                )
                .setFooter({ text: `${client.footer} • Spread positivity!`, iconURL: client.logo })
                .setTimestamp()

            await interaction.editReply({ embeds: [embed] })

            // Log compliment usage
            if (client.systemLogger) {
                await client.systemLogger.logUserEvent(
                    interaction.user.id,
                    interaction.user.username,
                    'compliment_generated',
                    `Generated ${complimentType} compliment${targetUser ? ` for ${targetUser.username}` : ''}`
                )
            }
        } catch (error) {
            console.error('Error generating compliment:', error)

            if (client.systemLogger) {
                await client.systemLogger.logError(
                    'COMPLIMENT_GENERATION_ERROR',
                    'Failed to generate compliment: ' + error.message,
                    { userId: interaction.user.id, complimentType, targetUserId: targetUser?.id, error: error.stack }
                )
            }

            // Fallback compliments
            const fallbackCompliments = [
                'You have such a wonderful way of making others feel valued and heard. Your presence truly brightens the day! 🌟',
                "Your resilience and strength in facing challenges is truly inspiring. You're capable of amazing things! 💪",
                'The kindness you show to others is a beautiful reflection of who you are. You make the world a better place! 💙',
                'Your unique perspective and creativity add such richness to conversations. You have something special to offer! ✨',
                "The way you care about your personal growth shows incredible wisdom and maturity. You're doing great! 🌱"
            ]

            const randomCompliment = fallbackCompliments[Math.floor(Math.random() * fallbackCompliments.length)]

            return interaction.editReply({
                content: `Here's a heartfelt compliment ${targetUser ? `for ${targetUser}` : 'for you'}:\n\n${randomCompliment}\n\n*I hope this brightens your day!*`
            })
        }
    }
}
