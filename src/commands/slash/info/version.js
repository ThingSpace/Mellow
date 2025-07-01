import { cmdTypes } from '../../../configs/cmdTypes.config.js'
import { versionHandler } from '../../../handlers/version.js'

export default {
    structure: {
        name: 'version',
        category: 'Info',
        description: 'View Mellow version information and changelogs',
        handlers: {
            cooldown: 10000,
            requiredRoles: []
        },
        options: [
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'current',
                description: 'Show current version information',
                options: []
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'latest',
                description: 'Check for updates and show latest release',
                options: []
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'changelog',
                description: 'View changelog for a specific version',
                options: [
                    {
                        name: 'version',
                        description: 'Version to view changelog for (e.g., 1.1.0)',
                        required: false,
                        type: cmdTypes.STRING
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'releases',
                description: 'View recent releases',
                options: [
                    {
                        name: 'count',
                        description: 'Number of releases to show (default: 5)',
                        required: false,
                        type: cmdTypes.INTEGER,
                        min_value: 1,
                        max_value: 10
                    }
                ]
            },
            {
                type: cmdTypes.SUB_COMMAND,
                name: 'repo',
                description: 'View repository information',
                options: []
            }
        ]
    },

    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand()

        try {
            switch (subcommand) {
                case 'current':
                    await versionHandler.handleCurrentVersion(client, interaction)
                    break
                case 'latest':
                    await versionHandler.handleLatestVersion(client, interaction)
                    break
                case 'changelog':
                    await versionHandler.handleChangelog(client, interaction)
                    break
                case 'releases':
                    await versionHandler.handleReleases(client, interaction)
                    break
                case 'repo':
                    await versionHandler.handleRepoInfo(client, interaction)
                    break
                default:
                    await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true })
            }
        } catch (error) {
            console.error('Error in version command:', error)
            await versionHandler.sendErrorEmbed(
                client,
                interaction,
                'An unexpected error occurred. Please try again later.'
            )
        }
    }
}
