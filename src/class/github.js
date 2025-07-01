import axios from 'axios'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class GithubClient {
    static instance = null
    static client = null
    static repoOwner = 'ThingSpace'
    static repoName = 'Mellow'

    constructor(token) {
        if (!GithubClient.client) {
            GithubClient.client = axios.create({
                baseURL: 'https://api.github.com',
                headers: {
                    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Mellow-Bot'
                },
                timeout: 10000
            })
        }
        GithubClient.instance = this
    }

    static init(token) {
        if (!GithubClient.instance) {
            new GithubClient(token)
        }
        return GithubClient.instance
    }

    static getInstance() {
        if (!GithubClient.instance) {
            throw new Error('GithubClient not initialized. Call GithubClient.init() first.')
        }
        return GithubClient.instance
    }

    // Version Management Methods

    /**
     * Get the current version from package.json
     * @returns {string} Current version
     */
    getCurrentVersion() {
        try {
            const packagePath = join(__dirname, '../../package.json')
            const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
            return packageJson.version
        } catch (error) {
            console.error('Error reading package.json:', error)
            return 'unknown'
        }
    }

    /**
     * Get the latest release from GitHub
     * @returns {Promise<Object>} Latest release information
     */
    async getLatestRelease() {
        try {
            const response = await GithubClient.client.get(
                `/repos/${GithubClient.repoOwner}/${GithubClient.repoName}/releases/latest`
            )
            return {
                success: true,
                data: {
                    tagName: response.data.tag_name,
                    name: response.data.name,
                    body: response.data.body,
                    publishedAt: response.data.published_at,
                    htmlUrl: response.data.html_url,
                    assets: response.data.assets
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: error.response?.status
            }
        }
    }

    /**
     * Get all releases from GitHub
     * @param {number} limit - Number of releases to fetch (default: 10)
     * @returns {Promise<Object>} List of releases
     */
    async getReleases(limit = 10) {
        try {
            const response = await GithubClient.client.get(
                `/repos/${GithubClient.repoOwner}/${GithubClient.repoName}/releases`,
                { params: { per_page: limit } }
            )
            return {
                success: true,
                data: response.data.map(release => ({
                    tagName: release.tag_name,
                    name: release.name,
                    body: release.body,
                    publishedAt: release.published_at,
                    htmlUrl: release.html_url,
                    prerelease: release.prerelease,
                    draft: release.draft
                }))
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: error.response?.status
            }
        }
    }

    /**
     * Check if current version is up to date
     * @returns {Promise<Object>} Update status information
     */
    async checkForUpdates() {
        try {
            const currentVersion = this.getCurrentVersion()
            const latestRelease = await this.getLatestRelease()

            if (!latestRelease.success) {
                return {
                    success: false,
                    error: 'Failed to fetch latest release',
                    details: latestRelease.error
                }
            }

            const latestVersion = latestRelease.data.tagName.replace(/^v/, '')
            const isUpToDate = currentVersion === latestVersion

            return {
                success: true,
                currentVersion,
                latestVersion,
                isUpToDate,
                updateAvailable: !isUpToDate,
                releaseInfo: latestRelease.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    // Changelog Methods

    /**
     * Get the changelog content from the repository
     * @returns {Promise<Object>} Changelog content
     */
    async getChangelog() {
        try {
            const response = await GithubClient.client.get(
                `/repos/${GithubClient.repoOwner}/${GithubClient.repoName}/contents/CHANGELOG.md`
            )

            if (response.data.content) {
                const content = Buffer.from(response.data.content, 'base64').toString('utf8')
                return {
                    success: true,
                    content,
                    lastModified: response.data.last_modified,
                    size: response.data.size
                }
            }
        } catch (error) {
            // Try alternative paths
            const altPaths = ['ignored/CHANGELOG.md', 'docs/CHANGELOG.md']

            for (const path of altPaths) {
                try {
                    const altResponse = await GithubClient.client.get(
                        `/repos/${GithubClient.repoOwner}/${GithubClient.repoName}/contents/${path}`
                    )
                    if (altResponse.data.content) {
                        const content = Buffer.from(altResponse.data.content, 'base64').toString('utf8')
                        return {
                            success: true,
                            content,
                            path,
                            lastModified: altResponse.data.last_modified,
                            size: altResponse.data.size
                        }
                    }
                } catch (altError) {
                    continue
                }
            }

            return {
                success: false,
                error: error.message,
                status: error.response?.status
            }
        }
    }

    /**
     * Parse changelog and get version-specific entries
     * @param {string} version - Version to get changelog for (optional)
     * @returns {Promise<Object>} Parsed changelog data
     */
    async getVersionChangelog(version = null) {
        try {
            const changelog = await this.getChangelog()
            if (!changelog.success) {
                return changelog
            }

            const content = changelog.content
            const versionRegex = /## \[([\d.]+)\]/g
            const sections = []

            let match
            const positions = []

            while ((match = versionRegex.exec(content)) !== null) {
                positions.push({
                    version: match[1],
                    start: match.index,
                    headerEnd: match.index + match[0].length
                })
            }

            // Extract content for each version
            for (let i = 0; i < positions.length; i++) {
                const current = positions[i]
                const next = positions[i + 1]
                const endPos = next ? next.start : content.length

                const versionContent = content.substring(current.headerEnd, endPos).trim()
                sections.push({
                    version: current.version,
                    content: versionContent
                })
            }

            if (version) {
                const versionData = sections.find(s => s.version === version)
                return {
                    success: true,
                    version,
                    content: versionData?.content || `No changelog found for version ${version}`,
                    found: !!versionData
                }
            }

            return {
                success: true,
                versions: sections,
                totalVersions: sections.length
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    // Repository Information Methods

    /**
     * Get repository information
     * @returns {Promise<Object>} Repository data
     */
    async getRepoInfo() {
        try {
            const response = await GithubClient.client.get(`/repos/${GithubClient.repoOwner}/${GithubClient.repoName}`)
            return {
                success: true,
                data: {
                    name: response.data.name,
                    fullName: response.data.full_name,
                    description: response.data.description,
                    stars: response.data.stargazers_count,
                    forks: response.data.forks_count,
                    issues: response.data.open_issues_count,
                    language: response.data.language,
                    license: response.data.license?.name,
                    createdAt: response.data.created_at,
                    updatedAt: response.data.updated_at,
                    htmlUrl: response.data.html_url
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: error.response?.status
            }
        }
    }

    /**
     * Get commit information
     * @param {number} limit - Number of commits to fetch (default: 10)
     * @returns {Promise<Object>} Commit history
     */
    async getCommits(limit = 10) {
        try {
            const response = await GithubClient.client.get(
                `/repos/${GithubClient.repoOwner}/${GithubClient.repoName}/commits`,
                { params: { per_page: limit } }
            )
            return {
                success: true,
                data: response.data.map(commit => ({
                    sha: commit.sha.substring(0, 7),
                    message: commit.commit.message.split('\n')[0],
                    author: commit.commit.author.name,
                    date: commit.commit.author.date,
                    htmlUrl: commit.html_url
                }))
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: error.response?.status
            }
        }
    }

    /**
     * Get repository contributors
     * @returns {Promise<Object>} Contributors list
     */
    async getContributors() {
        try {
            const response = await GithubClient.client.get(
                `/repos/${GithubClient.repoOwner}/${GithubClient.repoName}/contributors`
            )
            return {
                success: true,
                data: response.data.map(contributor => ({
                    login: contributor.login,
                    contributions: contributor.contributions,
                    avatarUrl: contributor.avatar_url,
                    htmlUrl: contributor.html_url
                }))
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: error.response?.status
            }
        }
    }

    // Utility Methods

    /**
     * Set repository configuration
     * @param {string} owner - Repository owner
     * @param {string} name - Repository name
     */
    static setRepository(owner, name) {
        GithubClient.repoOwner = owner
        GithubClient.repoName = name
    }

    /**
     * Test GitHub API connection
     * @returns {Promise<Object>} Connection status
     */
    async testConnection() {
        try {
            const response = await GithubClient.client.get('/user')
            return {
                success: true,
                authenticated: true,
                user: response.data.login,
                rateLimit: {
                    remaining: response.headers['x-ratelimit-remaining'],
                    total: response.headers['x-ratelimit-limit'],
                    resetTime: new Date(response.headers['x-ratelimit-reset'] * 1000)
                }
            }
        } catch (error) {
            return {
                success: false,
                authenticated: false,
                error: error.message,
                status: error.response?.status
            }
        }
    }

    /**
     * Get current rate limit status
     * @returns {Promise<Object>} Rate limit information
     */
    async getRateLimit() {
        try {
            const response = await GithubClient.client.get('/rate_limit')
            return {
                success: true,
                data: response.data.rate
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Compare two semantic versions
     * @param {string} current - Current version (e.g., "1.0.0")
     * @param {string} latest - Latest version (e.g., "1.1.0")
     * @returns {number} -1 if current < latest, 0 if equal, 1 if current > latest
     */
    compareVersions(current, latest) {
        const parseVersion = version => {
            return version.replace(/^v/, '').split('.').map(Number)
        }

        const currentParts = parseVersion(current)
        const latestParts = parseVersion(latest)

        for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
            const currentPart = currentParts[i] || 0
            const latestPart = latestParts[i] || 0

            if (currentPart < latestPart) return -1
            if (currentPart > latestPart) return 1
        }

        return 0
    }

    /**
     * Get version history with release dates
     * @param {number} limit - Number of versions to fetch
     * @returns {Promise<Object>} Version history with dates
     */
    async getVersionHistory(limit = 20) {
        try {
            const releases = await this.getReleases(limit)

            if (!releases.success) {
                return { success: false, error: releases.error }
            }

            const versionHistory = releases.data.map(release => ({
                version: release.tagName.replace(/^v/, ''),
                name: release.name,
                publishedAt: release.publishedAt,
                prerelease: release.prerelease,
                bodyPreview: release.body?.substring(0, 300) + (release.body?.length > 300 ? '...' : '') || ''
            }))

            return {
                success: true,
                data: versionHistory,
                totalVersions: versionHistory.length
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Get repository statistics and insights
     * @returns {Promise<Object>} Repository analytics
     */
    async getRepoStats() {
        try {
            const [repoInfo, releases, commits] = await Promise.all([
                this.getRepoInfo(),
                this.getReleases(10),
                this.getCommits(50)
            ])

            if (!repoInfo.success) {
                return { success: false, error: repoInfo.error }
            }

            const stats = {
                repository: {
                    stars: repoInfo.data.stars,
                    forks: repoInfo.data.forks,
                    issues: repoInfo.data.issues,
                    language: repoInfo.data.language,
                    size: repoInfo.data.size || 0,
                    createdAt: repoInfo.data.createdAt,
                    lastUpdated: repoInfo.data.updatedAt
                },
                releases: {
                    total: releases.success ? releases.data.length : 0,
                    latest: releases.success && releases.data.length > 0 ? releases.data[0] : null,
                    releaseFrequency: this.calculateReleaseFrequency(releases.data || [])
                },
                commits: {
                    recent: commits.success ? commits.data.length : 0,
                    lastCommit: commits.success && commits.data.length > 0 ? commits.data[0] : null
                }
            }

            return {
                success: true,
                data: stats
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Calculate release frequency based on release history
     * @param {Array} releases - Array of release objects
     * @returns {string} Human-readable release frequency
     */
    calculateReleaseFrequency(releases) {
        if (releases.length < 2) return 'Insufficient data'

        const dates = releases.map(r => new Date(r.publishedAt)).sort((a, b) => b - a)
        const intervals = []

        for (let i = 0; i < dates.length - 1; i++) {
            const interval = (dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24) // days
            intervals.push(interval)
        }

        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length

        if (avgInterval < 7) return 'Multiple releases per week'
        if (avgInterval < 30) return 'Weekly releases'
        if (avgInterval < 90) return 'Monthly releases'
        if (avgInterval < 180) return 'Quarterly releases'
        return 'Irregular releases'
    }

    /**
     * Get security and dependency information
     * @returns {Promise<Object>} Security insights
     */
    async getSecurityInfo() {
        try {
            // Get vulnerability alerts (requires appropriate permissions)
            const response = await GithubClient.client.get(
                `/repos/${GithubClient.repoOwner}/${GithubClient.repoName}/vulnerability-alerts`
            )

            return {
                success: true,
                data: {
                    vulnerabilityAlertsEnabled: true
                    // Additional security info would go here
                }
            }
        } catch (error) {
            // This endpoint requires special permissions, so we'll return basic info
            return {
                success: true,
                data: {
                    vulnerabilityAlertsEnabled: false,
                    message: 'Security information requires additional permissions'
                }
            }
        }
    }

    /**
     * Search for specific content in the repository
     * @param {string} query - Search query
     * @param {string} type - Type of search ('code', 'commits', 'issues')
     * @returns {Promise<Object>} Search results
     */
    async searchRepository(query, type = 'code') {
        try {
            const searchEndpoint =
                type === 'code' ? 'search/code' : type === 'commits' ? 'search/commits' : 'search/issues'

            const response = await GithubClient.client.get(
                `/${searchEndpoint}?q=${encodeURIComponent(query)}+repo:${GithubClient.repoOwner}/${GithubClient.repoName}`
            )

            return {
                success: true,
                data: {
                    totalCount: response.data.total_count,
                    items: response.data.items.slice(0, 10), // Limit to first 10 results
                    type: type
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: error.response?.status
            }
        }
    }
}
