import { buildCopingPrompt } from '../../../services/tools/copingTool.js'

export default {
    structure: {
        name: 'support',
        category: 'Coping',
        description: 'Show support resources and crisis lines.',
        handlers: {
            cooldown: 30000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: []
    },
    run: async (client, interaction) => {
        try {
            // Log support resource access
            if (client.systemLogger) {
                await client.systemLogger.logUserEvent(
                    interaction.user.id,
                    interaction.user.username,
                    'support_resources_accessed',
                    'User accessed crisis support resources'
                )
            }

            const embed = new client.Gateway.EmbedBuilder()
                .setTitle('🆘 Crisis Support Resources')
                .setColor(client.colors.error)
                .setDescription("If you're in crisis or need immediate help, please reach out to these resources:")
                .addFields(
                    {
                        name: '🇺🇸 United States',
                        value: ['**988 Suicide & Crisis Lifeline**', 'Call or text: **988**', 'Available 24/7'].join(
                            '\n'
                        ),
                        inline: true
                    },
                    {
                        name: '🇺🇸 Crisis Text Line',
                        value: ['Text **HOME** to **741741**', 'Available 24/7', 'Free and confidential'].join('\n'),
                        inline: true
                    },
                    {
                        name: '🇬🇧 United Kingdom',
                        value: ['**Samaritans**', 'Call: **116 123**', 'Available 24/7'].join('\n'),
                        inline: true
                    },
                    {
                        name: '🇨🇦 Canada',
                        value: ['**Talk Suicide Canada**', 'Call: **1-833-456-4566**', 'Text: **45645**'].join('\n'),
                        inline: true
                    },
                    {
                        name: '🚨 Emergency',
                        value: [
                            "If you're in immediate danger:",
                            '**Call 911** (US/Canada)',
                            '**Call 999** (UK)',
                            '**Call 112** (EU)'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🌐 More Resources',
                        value: [
                            '[Crisis Text Line](https://www.crisistextline.org/)',
                            '[International Resources](https://findahelpline.com/)',
                            '[Mental Health America](https://www.mhanational.org/)'
                        ].join('\n'),
                        inline: true
                    }
                )
                .addFields({
                    name: '💙 Remember',
                    value: 'You are not alone. These feelings are temporary. Help is available, and you deserve support.',
                    inline: false
                })
                .setFooter({ text: client.footer, iconURL: client.logo })
                .setTimestamp()

            return interaction.reply({ embeds: [embed] })
        } catch (error) {
            console.error('Error in support command:', error)

            if (client.systemLogger) {
                await client.systemLogger.logError(error, 'Support Command')
            }

            return interaction.reply({
                content: '❌ An error occurred while fetching support resources. Please try again later.',
                ephemeral: true
            })
        }
    }
}
