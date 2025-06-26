import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import { personalityChoices, themeChoices, languageChoices } from '../../../configs/userPreferences.config.js'

export default {
    structure: {
        name: 'preferences',
        category: 'Users',
        description: 'Configure your preferences and settings.',
        handlers: {
            cooldown: 15000,
            requiredRoles: [],
            requiredPerms: []
        },
        options: [
            {
                name: 'view',
                type: cmdTypes.SUB_COMMAND,
                description: 'View your current preferences and settings',
                options: []
            },
            {
                name: 'update',
                type: cmdTypes.SUB_COMMAND,
                description: 'Update your preferences and settings',
                options: [
                    {
                        name: 'checkin_interval',
                        description: 'How often would you like to be reminded to check in? (in hours)',
                        required: false,
                        type: cmdTypes.INTEGER,
                        min_value: 1,
                        max_value: 24
                    },
                    {
                        name: 'reminders_enabled',
                        description: 'Enable or disable reminders',
                        required: false,
                        type: cmdTypes.BOOLEAN
                    },
                    {
                        name: 'reminder_method',
                        description: 'How do you want to receive reminders?',
                        required: false,
                        type: cmdTypes.STRING,
                        choices: [
                            { name: 'Direct Message', value: 'dm' },
                            { name: 'Channel', value: 'channel' }
                        ]
                    },
                    {
                        name: 'journal_privacy',
                        description: 'Should your journal entries be private?',
                        required: false,
                        type: cmdTypes.BOOLEAN
                    },
                    {
                        name: 'ai_personality',
                        description: 'Choose your preferred AI personality',
                        required: false,
                        type: cmdTypes.STRING,
                        choices: personalityChoices
                    },
                    {
                        name: 'profile_theme',
                        description: 'Choose your profile theme color',
                        required: false,
                        type: cmdTypes.STRING,
                        choices: themeChoices
                    },
                    {
                        name: 'language',
                        description: 'Preferred language',
                        required: false,
                        type: cmdTypes.STRING,
                        choices: languageChoices
                    },
                    {
                        name: 'timezone',
                        description: 'Your timezone (e.g., America/New_York)',
                        required: false,
                        type: cmdTypes.STRING
                    }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const userId = interaction.user.id

        switch (interaction.options.getSubcommand()) {
            /** VIEW A USERS PREFERENCES/SETTINGS */
            case 'view': {
                const settings = await client.db.userPreferences.findById(userId)

                if (!settings) {
                    return interaction.reply({
                        content:
                            'Whoops, I was unable to locate your preferences. If this issue continues please contact my support team!',
                        ephemeral: true
                    })
                }

                return interaction.reply({
                    embeds: [
                        new client.Gateway.EmbedBuilder()
                            .setTitle('User Preferences')
                            .setColor(client.colors.primary)
                            .setDescription('Here are your current preferences and settings:')
                            .addFields(
                                {
                                    name: 'Check-In Interval',
                                    value: settings.checkInInterval
                                        ? `${settings.checkInInterval / 60} hours`
                                        : 'Not set',
                                    inline: true
                                },
                                {
                                    name: 'Reminders Enabled',
                                    value: settings.remindersEnabled ? '✅ Yes' : '❌ No',
                                    inline: true
                                },
                                {
                                    name: 'Reminder Method',
                                    value: settings.reminderMethod || 'dm',
                                    inline: true
                                },
                                {
                                    name: 'Journal Privacy',
                                    value: settings.journalPrivacy ? 'Private' : 'Public',
                                    inline: true
                                },
                                {
                                    name: 'AI Personality',
                                    value: settings.aiPersonality || 'gentle',
                                    inline: true
                                },
                                {
                                    name: 'Profile Theme',
                                    value: settings.profileTheme || 'blue',
                                    inline: true
                                },
                                {
                                    name: 'Language',
                                    value: settings.language || 'en',
                                    inline: true
                                },
                                {
                                    name: 'Timezone',
                                    value: settings.timezone || 'Not set',
                                    inline: true
                                }
                            )
                            .setTimestamp()
                            .setFooter({
                                text: 'Use /preferences update to change your settings.',
                                iconURL: client.logo
                            })
                    ]
                })
            }

            /** UPDATE A USERS PREFERENCES/SETTINGS */
            case 'update': {
                // Gather all possible fields
                const updates = {}

                const checkinInterval = interaction.options.getInteger('checkin_interval')

                if (checkinInterval !== null) {
                    updates.checkInInterval = checkinInterval * 60 // store as minutes
                }

                const remindersEnabled = interaction.options.getBoolean('reminders_enabled')

                if (remindersEnabled !== null) {
                    updates.remindersEnabled = remindersEnabled
                }

                const reminderMethod = interaction.options.getString('reminder_method')

                if (reminderMethod) {
                    updates.reminderMethod = reminderMethod
                }

                const journalPrivacy = interaction.options.getBoolean('journal_privacy')

                if (journalPrivacy !== null) {
                    updates.journalPrivacy = journalPrivacy
                }

                const aiPersonality = interaction.options.getString('ai_personality')

                if (aiPersonality) {
                    updates.aiPersonality = aiPersonality
                }

                const profileTheme = interaction.options.getString('profile_theme')

                if (profileTheme) {
                    updates.profileTheme = profileTheme
                }

                const language = interaction.options.getString('language')

                if (language) {
                    updates.language = language
                }

                const timezone = interaction.options.getString('timezone')

                if (timezone) {
                    updates.timezone = timezone
                }

                if (Object.keys(updates).length === 0) {
                    return interaction.reply({
                        content: 'Please specify at least one setting to update.',
                        ephemeral: true
                    })
                }

                try {
                    await client.db.userPreferences.upsert(userId, updates)

                    return interaction.reply({
                        content: '✅ Your preferences have been updated!',
                        ephemeral: true
                    })
                } catch (error) {
                    console.error('Failed to update preferences:', error)

                    return interaction.reply({
                        content: '❌ Failed to update your preferences. Please try again later.',
                        ephemeral: true
                    })
                }
            }

            default: {
                return interaction.reply({
                    content: 'Please choose a valid subcommand to continue!',
                    ephemeral: true
                })
            }
        }
    }
}
