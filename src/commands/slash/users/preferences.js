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
                        name: 'context_logging',
                        description: 'Allow AI to use your messages for conversation context (improves responses)',
                        required: false,
                        type: cmdTypes.BOOLEAN
                    }
                ]
            },
            {
                name: 'reset',
                type: cmdTypes.SUB_COMMAND,
                description: 'Reset all preferences to default values',
                options: []
            }
        ]
    },
    run: async (client, interaction) => {
        const userId = interaction.user.id

        switch (interaction.options.getSubcommand()) {
            case 'view': {
                const settings = await client.db.userPreferences.findById(userId)

                if (!settings) {
                    return interaction.reply({
                        content:
                            "You don't have any preferences set yet. Use `/preferences update` to configure your settings!",
                        ephemeral: true
                    })
                }

                return interaction.reply({
                    embeds: [
                        new client.Gateway.EmbedBuilder()
                            .setTitle('Your Preferences')
                            .setColor(client.colors.primary)
                            .setDescription('Here are your current preferences and settings:')
                            .addFields(
                                {
                                    name: 'Check-In Settings',
                                    value: [
                                        `**Interval:** ${settings.checkInInterval ? `${settings.checkInInterval / 60} hours` : 'Not set'}`,
                                        `**Reminders:** ${settings.remindersEnabled ? '✅ Enabled' : '❌ Disabled'}`,
                                        `**Method:** ${settings.reminderMethod || 'dm'}`,
                                        `**Next Check-In:** ${settings.nextCheckIn ? `<t:${Math.floor(settings.nextCheckIn.getTime() / 1000)}:R>` : 'Not scheduled'}`
                                    ].join('\n'),
                                    inline: true
                                },
                                {
                                    name: 'Personal Settings',
                                    value: [
                                        `**AI Personality:** ${settings.aiPersonality || 'gentle'}`,
                                        `**Theme:** ${settings.profileTheme || 'blue'}`,
                                        `**Language:** ${settings.language || 'en'}`,
                                        `**Journal Privacy:** ${settings.journalPrivacy ? '🔒 Private' : '🌐 Public'}`,
                                        `**Context Logging:** ${!settings.disableContextLogging ? '✅ Enabled' : '❌ Disabled'}`
                                    ].join('\n'),
                                    inline: true
                                },
                                {
                                    name: 'Account Info',
                                    value: [
                                        `**Created:** <t:${Math.floor(settings.createdAt.getTime() / 1000)}:R>`,
                                        `**Updated:** <t:${Math.floor(settings.updatedAt.getTime() / 1000)}:R>`
                                    ].join('\n'),
                                    inline: false
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

            case 'update': {
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

                const contextLogging = interaction.options.getBoolean('context_logging')
                if (contextLogging !== null) {
                    updates.disableContextLogging = !contextLogging // Note: inverted logic
                }

                if (Object.keys(updates).length === 0) {
                    return interaction.reply({
                        content: '❌ No settings provided to update.',
                        ephemeral: true
                    })
                }

                try {
                    await client.db.userPreferences.upsert(userId, updates)

                    // Log preference changes
                    if (client.systemLogger) {
                        const changes = Object.keys(updates).join(', ')
                        await client.systemLogger.logUserEvent(
                            interaction.user.id,
                            interaction.user.username,
                            'preferences_updated',
                            `Updated: ${changes}`
                        )
                    }

                    return interaction.reply({
                        content: '✅ Your preferences have been updated!'
                    })
                } catch (error) {
                    console.error('Failed to update preferences:', error)

                    return interaction.reply({
                        content: '❌ Failed to update your preferences. Please try again later.',
                        ephemeral: true
                    })
                }
            }

            case 'reset': {
                try {
                    await client.db.userPreferences.delete(userId)

                    // Log preference reset
                    if (client.systemLogger) {
                        await client.systemLogger.logUserEvent(
                            userId,
                            interaction.user.username,
                            'preferences_reset',
                            'All preferences reset to defaults'
                        )
                    }

                    return interaction.reply({
                        content: '✅ Your preferences have been reset to default values!'
                    })
                } catch (error) {
                    console.error('Failed to reset preferences:', error)

                    return interaction.reply({
                        content: '❌ Failed to reset your preferences. Please try again later.',
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
