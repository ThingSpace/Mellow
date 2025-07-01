import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import { isLateNight, isEarlyMorning, isLateEvening, getTimePeriod } from '../../../functions/timeHelper.js'

export default {
    structure: {
        name: 'timemode',
        category: 'Users',
        description: 'Check what time-based companion mode is active for you.',
        handlers: {
            cooldown: 5000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: []
    },
    run: async (client, interaction) => {
        const userId = interaction.user.id
        const userPrefs = await client.db.userPreferences.findById(userId)

        if (!userPrefs?.timezone) {
            return interaction.reply({
                embeds: [
                    new client.Gateway.EmbedBuilder()
                        .setTitle('⏰ Time-Based Companion Mode')
                        .setDescription(
                            "You haven't set a timezone yet! Set your timezone with `/preferences update timezone:` to enable automatic late-night companion mode.\n\n" +
                                'Late-night companion mode provides:\n' +
                                '• Calmer, more gentle responses during late hours\n' +
                                '• Sleep-friendly suggestions and support\n' +
                                '• Understanding for late-night emotional intensity\n' +
                                "• Morning encouragement when you're starting your day"
                        )
                        .setColor(client.colors.warning)
                        .setTimestamp()
                        .setFooter({ text: client.footer, iconURL: client.logo })
                ]
            })
        }

        const timezone = userPrefs.timezone
        const timePeriod = getTimePeriod(timezone)

        let modeActive = 'Standard Mode'
        let modeDescription = 'Regular supportive responses and interactions.'
        let modeEmoji = '☀️'

        if (isLateNight(timezone)) {
            modeActive = 'Late-Night Companion Mode'
            modeDescription =
                'Extra gentle, calming responses with sleep-friendly suggestions and understanding for late-night feelings.'
            modeEmoji = '🌙'
        } else if (isEarlyMorning(timezone)) {
            modeActive = 'Early Morning Mode'
            modeDescription =
                'Gentle encouragement for starting the day with positive affirmations and morning support.'
            modeEmoji = '🌅'
        } else if (isLateEvening(timezone)) {
            modeActive = 'Evening Wind-Down Mode'
            modeDescription = 'Calming, reflective responses to help you unwind from your day.'
            modeEmoji = '🌆'
        }

        return interaction.reply({
            embeds: [
                new client.Gateway.EmbedBuilder()
                    .setTitle(`${modeEmoji} Time-Based Companion Mode`)
                    .setColor(client.colors.primary)
                    .addFields(
                        {
                            name: 'Current Time',
                            value: `${timePeriod} in ${timezone}`,
                            inline: true
                        },
                        {
                            name: 'Active Mode',
                            value: modeActive,
                            inline: true
                        },
                        {
                            name: 'What This Means',
                            value: modeDescription,
                            inline: false
                        }
                    )
                    .setDescription(
                        "Mellow automatically adapts its responses based on your timezone and time of day. This helps provide more appropriate support whether it's late at night, early morning, or throughout your day."
                    )
                    .setTimestamp()
                    .setFooter({ text: client.footer, iconURL: client.logo })
            ]
        })
    }
}
