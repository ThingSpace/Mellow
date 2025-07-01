import { GithubClient } from '../class/github.js'

/**
 * Version Handler
 * Manages version-related operations for the /version command
 */
export class VersionHandler {
    constructor() {
        this.github = null
    }

    /**
     * Initialize the handler with GitHub client
     */
    async initialize() {
        try {
            this.github = GithubClient.getInstance()
            return { success: true }
        } catch (error) {
            console.error('Failed to initialize GitHub client:', error)
            return {
                success: false,
                error: 'GitHub client not properly configured. Please contact an administrator.'
            }
        }
    }

    /**
     * Handle current version subcommand
     */
    async handleCurrentVersion(client, interaction) {
        await interaction.deferReply()

        const initResult = await this.initialize()
        if (!initResult.success) {
            return this.sendErrorEmbed(client, interaction, initResult.error)
        }

        try {
            const currentVersion = this.github.getCurrentVersion()
            const updateCheck = await this.github.checkForUpdates()

            const embed = new client.Gateway.EmbedBuilder()
                .setColor(client.colors.primary)
                .setTitle('📋 Current Version Information')
                .addFields(
                    { name: '🏷️ Current Version', value: `v${currentVersion}`, inline: true },
                    { name: '📅 Release Date', value: 'July 1, 2025', inline: true },
                    { name: '🔧 Environment', value: process.env.NODE_ENV || 'development', inline: true }
                )
                .setThumbnail(client.logo)
                .setTimestamp()
                .setFooter({ text: client.footer, iconURL: client.logo })

            if (updateCheck.success) {
                const status = updateCheck.isUpToDate ? '✅ Up to date' : '🔄 Update available'
                const latestVersion = updateCheck.latestVersion

                embed.addFields(
                    { name: '📊 Update Status', value: status, inline: true },
                    { name: '🆕 Latest Version', value: `v${latestVersion}`, inline: true }
                )

                if (!updateCheck.isUpToDate) {
                    embed.setColor(client.colors.warning || '#ffa500')
                    embed.addFields({
                        name: '📦 Latest Release',
                        value: `[${updateCheck.releaseInfo.name}](${updateCheck.releaseInfo.htmlUrl})`,
                        inline: false
                    })
                }
            } else {
                embed.addFields({
                    name: '⚠️ Update Check',
                    value: 'Unable to check for updates',
                    inline: true
                })
            }

            await interaction.editReply({ embeds: [embed] })
        } catch (error) {
            console.error('Error in handleCurrentVersion:', error)
            return this.sendErrorEmbed(client, interaction, 'Unable to fetch current version information.')
        }
    }

    /**
     * Handle latest version subcommand
     */
    async handleLatestVersion(client, interaction) {
        await interaction.deferReply()

        const initResult = await this.initialize()
        if (!initResult.success) {
            return this.sendErrorEmbed(client, interaction, initResult.error)
        }

        try {
            const latestRelease = await this.github.getLatestRelease()
            const currentVersion = this.github.getCurrentVersion()

            if (!latestRelease.success) {
                return this.sendErrorEmbed(client, interaction, 'Could not connect to GitHub or repository not found.')
            }

            const release = latestRelease.data
            const isUpToDate = currentVersion === release.tagName.replace(/^v/, '')

            const embed = new client.Gateway.EmbedBuilder()
                .setColor(isUpToDate ? client.colors.success : client.colors.warning)
                .setTitle(`🚀 Latest Release: ${release.name}`)
                .setDescription(
                    release.body?.substring(0, 1000) + (release.body?.length > 1000 ? '...' : '') ||
                        'No description available'
                )
                .addFields(
                    { name: '🏷️ Version', value: release.tagName, inline: true },
                    { name: '📅 Published', value: new Date(release.publishedAt).toLocaleDateString(), inline: true },
                    {
                        name: '📊 Status',
                        value: isUpToDate ? '✅ You have the latest version' : '🔄 Update available',
                        inline: true
                    }
                )
                .setThumbnail(client.logo)
                .setTimestamp()
                .setFooter({ text: client.footer, iconURL: client.logo })

            if (release.htmlUrl) {
                embed.setURL(release.htmlUrl)
            }

            await interaction.editReply({ embeds: [embed] })
        } catch (error) {
            console.error('Error in handleLatestVersion:', error)
            return this.sendErrorEmbed(client, interaction, 'Unable to fetch latest release information.')
        }
    }

    /**
     * Handle changelog subcommand
     */
    async handleChangelog(client, interaction) {
        await interaction.deferReply()

        const initResult = await this.initialize()
        if (!initResult.success) {
            return this.sendErrorEmbed(client, interaction, initResult.error)
        }

        try {
            const version = interaction.options.getString('version')

            if (version) {
                // Get specific version changelog
                const changelog = await this.github.getVersionChangelog(version)

                if (!changelog.success) {
                    if (changelog.notFound) {
                        return this.sendErrorEmbed(
                            client,
                            interaction,
                            'No changelog information found. Version data may not be publicly available.'
                        )
                    }
                    return this.sendErrorEmbed(client, interaction, `Failed to retrieve changelog: ${changelog.error}`)
                }

                const embed = new client.Gateway.EmbedBuilder()
                    .setThumbnail(client.logo)
                    .setTimestamp()
                    .setFooter({ text: client.footer, iconURL: client.logo })

                if (changelog.found) {
                    let title = `📝 Changelog for v${changelog.version}`

                    // Add release name if available (from GitHub release)
                    if (changelog.releaseInfo?.name && changelog.releaseInfo.name !== changelog.version) {
                        title = `📝 ${changelog.releaseInfo.name}`
                    }

                    embed
                        .setColor(client.colors.primary)
                        .setTitle(title)
                        .setDescription(
                            changelog.content?.substring(0, 4000) || 'No changelog content found for this version.'
                        )

                    // Add additional information for GitHub releases
                    if (changelog.source === 'github-release' && changelog.releaseInfo) {
                        const fields = [{ name: '🏷️ Version', value: `v${changelog.version}`, inline: true }]

                        if (changelog.releaseInfo.publishedAt) {
                            fields.push({
                                name: '📅 Published',
                                value: new Date(changelog.releaseInfo.publishedAt).toLocaleDateString(),
                                inline: true
                            })
                        }

                        if (changelog.releaseInfo.htmlUrl) {
                            fields.push({
                                name: '🔗 Release Page',
                                value: `[View on GitHub](${changelog.releaseInfo.htmlUrl})`,
                                inline: true
                            })
                        }

                        embed.addFields(fields)
                    }
                } else {
                    embed
                        .setColor(client.colors.warning || '#ffa500')
                        .setTitle(`⚠️ Version v${changelog.version} not found`)
                        .setDescription(
                            `Changelog for version \`${changelog.version}\` was not found.\n\n` +
                                `Use \`/version changelog\` without specifying a version to see all available versions.`
                        )
                }

                await interaction.editReply({ embeds: [embed] })
            } else {
                // Get all versions
                const changelog = await this.github.getVersionChangelog()

                if (!changelog.success) {
                    if (changelog.notFound) {
                        return this.sendErrorEmbed(
                            client,
                            interaction,
                            'No changelog information found. Version data may not be publicly available.'
                        )
                    }
                    return this.sendErrorEmbed(client, interaction, `Failed to retrieve changelog: ${changelog.error}`)
                }

                const embed = new client.Gateway.EmbedBuilder()
                    .setColor(client.colors.primary)
                    .setTitle('📝 Available Versions')
                    .setThumbnail(client.logo)
                    .setTimestamp()
                    .setFooter({ text: client.footer, iconURL: client.logo })

                // Add description with source information
                let description = 'Use `/version changelog version:<version>` to view specific changelog.'

                if (changelog.source === 'github-releases') {
                    description += '\n\n*Changelogs sourced from GitHub releases*'
                } else if (changelog.source === 'markdown-fallback') {
                    description += '\n\n*Changelogs sourced from repository markdown files*'
                } else if (changelog.source === 'local') {
                    description += '\n\n*Note: Retrieved from local file (GitHub API unavailable)*'
                }

                embed.setDescription(description)

                const versions = changelog.versions?.slice(0, 10) // Show latest 10 versions
                if (versions && versions.length > 0) {
                    const versionList = versions
                        .map(v => {
                            let versionText = `• v${v.version}`
                            if (v.name && v.name !== v.version) {
                                versionText += ` - ${v.name}`
                            }
                            return versionText
                        })
                        .join('\n')

                    embed.addFields({
                        name: '📋 Recent Versions',
                        value: versionList,
                        inline: false
                    })

                    if (changelog.totalVersions > 10) {
                        embed.addFields({
                            name: 'ℹ️ Note',
                            value: `Showing ${versions.length} of ${changelog.totalVersions} total versions`,
                            inline: false
                        })
                    }
                } else {
                    embed
                        .setColor(client.colors.warning || '#ffa500')
                        .setDescription('No versions found.')
                        .addFields({
                            name: '⚠️ No Versions Available',
                            value: 'No version information could be found or parsed.',
                            inline: false
                        })
                }

                await interaction.editReply({ embeds: [embed] })
            }
        } catch (error) {
            console.error('Error in handleChangelog:', error)
            return this.sendErrorEmbed(client, interaction, 'Unable to fetch changelog information.')
        }
    }

    /**
     * Handle releases subcommand
     */
    async handleReleases(client, interaction) {
        await interaction.deferReply()

        const initResult = await this.initialize()
        if (!initResult.success) {
            return this.sendErrorEmbed(client, interaction, initResult.error)
        }

        try {
            const count = interaction.options.getInteger('count') || 5
            const releases = await this.github.getReleases(count)

            if (!releases.success) {
                return this.sendErrorEmbed(client, interaction, 'Could not retrieve releases from repository.')
            }

            const embed = new client.Gateway.EmbedBuilder()
                .setColor(client.colors.primary)
                .setTitle(`🚀 Recent Releases (${releases.data.length})`)
                .setThumbnail(client.logo)
                .setTimestamp()
                .setFooter({ text: client.footer, iconURL: client.logo })

            releases.data.forEach((release, index) => {
                const publishDate = new Date(release.publishedAt).toLocaleDateString()
                const shortDescription =
                    release.body?.substring(0, 200) + (release.body?.length > 200 ? '...' : '') || 'No description'

                embed.addFields({
                    name: `${index + 1}. ${release.name || release.tagName}`,
                    value: `📅 **Published:** ${publishDate}\n📝 **Description:** ${shortDescription}\n🔗 [View Release](${release.htmlUrl})`,
                    inline: false
                })
            })

            await interaction.editReply({ embeds: [embed] })
        } catch (error) {
            console.error('Error in handleReleases:', error)
            return this.sendErrorEmbed(client, interaction, 'Unable to fetch releases information.')
        }
    }

    /**
     * Handle repository info subcommand
     */
    async handleRepoInfo(client, interaction) {
        await interaction.deferReply()

        const initResult = await this.initialize()
        if (!initResult.success) {
            return this.sendErrorEmbed(client, interaction, initResult.error)
        }

        try {
            const [repoInfo, commits, contributors] = await Promise.all([
                this.github.getRepoInfo(),
                this.github.getCommits(5),
                this.github.getContributors()
            ])

            if (!repoInfo.success) {
                return this.sendErrorEmbed(client, interaction, 'Could not retrieve repository data from GitHub.')
            }

            const repo = repoInfo.data
            const embed = new client.Gateway.EmbedBuilder()
                .setColor(client.colors.primary)
                .setTitle(`📂 ${repo.name} Repository`)
                .setDescription(repo.description || 'No description available')
                .setURL(repo.htmlUrl)
                .setThumbnail(client.logo)
                .addFields(
                    { name: '🌟 Stars', value: repo.stars.toLocaleString(), inline: true },
                    { name: '🍴 Forks', value: repo.forks.toLocaleString(), inline: true },
                    { name: '🐛 Issues', value: repo.issues.toLocaleString(), inline: true },
                    { name: '💻 Language', value: repo.language || 'Unknown', inline: true },
                    { name: '📜 License', value: repo.license || 'Not specified', inline: true },
                    { name: '📅 Created', value: new Date(repo.createdAt).toLocaleDateString(), inline: true }
                )

            if (commits.success && commits.data.length > 0) {
                const recentCommits = commits.data
                    .slice(0, 3)
                    .map(commit => `\`${commit.sha}\` ${commit.message} - ${commit.author}`)
                    .join('\n')

                embed.addFields({
                    name: '📝 Recent Commits',
                    value: recentCommits,
                    inline: false
                })
            }

            if (contributors.success && contributors.data.length > 0) {
                const contributorList = contributors.data
                    .slice(0, 5)
                    .map(contrib => `${contrib.login} (${contrib.contributions} contributions)`)
                    .join('\n')

                embed.addFields({
                    name: '👥 Contributors',
                    value: contributorList,
                    inline: false
                })
            }

            embed.setTimestamp().setFooter({ text: client.footer, iconURL: client.logo })

            await interaction.editReply({ embeds: [embed] })
        } catch (error) {
            console.error('Error in handleRepoInfo:', error)
            return this.sendErrorEmbed(client, interaction, 'Unable to fetch repository information.')
        }
    }

    /**
     * Send error embed helper
     */
    async sendErrorEmbed(client, interaction, message) {
        const errorEmbed = new client.Gateway.EmbedBuilder()
            .setColor(client.colors.error)
            .setTitle('❌ Error')
            .setDescription(message)
            .setTimestamp()
            .setFooter({ text: client.footer, iconURL: client.logo })

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] })
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true })
        }
    }
}

// Export singleton instance
export const versionHandler = new VersionHandler()
