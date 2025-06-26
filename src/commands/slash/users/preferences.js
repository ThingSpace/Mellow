import { cmdTypes } from '../../../configs/cmdTypes.config.js'

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
                        max_value: 12
                    }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        switch (interaction.options.getSubcommand()) {
            case 'view': {
                const userId = interaction.user.id

                const settings = await client.db.userPreferences.findById(userId)

                if (!settings || !settings.length)
                    return interaction.reply({
                        content:
                            'Whoops, i was unable to locate your preferences. If this issue continues please contact my support team!',
                        ephemeral: true
                    })

                return interaction.reply({
                    embeds: []
                })
            }

            case 'update': {
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
