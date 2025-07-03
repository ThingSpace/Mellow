/**
 * Example: Custom Twitter Integration Examples
 *
 * This file demonstrates various ways to integrate and use the Twitter service
 * in custom code, commands, or automated workflows.
 */

// Import the client (adjust path as needed)
// import { client } from '../path/to/your/client.js'

/**
 * Example 1: Post Daily Stats Summary
 * Automatically post daily statistics about bot usage
 */
export async function postDailyStatsSummary() {
    // Check if Twitter service is available
    if (!client.twitterService?.initialized) {
        console.log('Twitter service not available')
        return
    }

    try {
        // Get daily statistics from database
        const today = new Date()
        const stats = {
            checkIns: await client.db.moodCheckIns.countToday(),
            copingToolsUsed: await client.db.copingToolUsage.countToday(),
            guildsServed: await client.guilds.cache.size,
            usersHelped: await client.db.users.countActiveToday()
        }

        // Generate AI content with stats
        const content = await client.ai.generateTwitterContent({
            type: 'weeklyUpdate',
            topic: `Daily impact: ${stats.checkIns} mood check-ins, ${stats.copingToolsUsed} coping tools used, supporting ${stats.guildsServed} communities`,
            maxLength: 200
        })

        // Post to Twitter
        const result = await client.twitterService.postTweet(content, {
            type: 'daily_stats',
            metadata: stats,
            source: 'automated_summary'
        })

        if (result.success) {
            console.log('Daily stats posted successfully:', result.tweetId)
        } else {
            console.error('Failed to post daily stats:', result.error)
        }

        return result
    } catch (error) {
        console.error('Error posting daily stats:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Example 2: Post Crisis Resource Reminder
 * Post important crisis resources during high-activity periods
 */
export async function postCrisisResourceReminder() {
    if (!client.twitterService?.initialized) return

    try {
        // Generate crisis support content
        const content = await client.ai.generateTwitterContent({
            type: 'crisisSupport',
            mood: 'gentle',
            maxLength: 220
        })

        const result = await client.twitterService.postTweet(content, {
            type: 'crisis_reminder',
            priority: 'high',
            source: 'automated_safety'
        })

        return result
    } catch (error) {
        console.error('Error posting crisis reminder:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Example 3: Weekly Community Highlight
 * Share positive community achievements and milestones
 */
export async function postWeeklyCommunityHighlight() {
    if (!client.twitterService?.initialized) return

    try {
        // Get weekly community data
        const weeklyData = await getWeeklyCommunityData()

        const content = await client.ai.generateTwitterContent({
            type: 'weeklyUpdate',
            topic: `This week: ${weeklyData.newMembers} new members joined our supportive community, ${weeklyData.supportiveMessages} supportive messages shared`,
            mood: 'celebrating',
            maxLength: 200
        })

        const result = await client.twitterService.postTweet(content, {
            type: 'community_highlight',
            metadata: weeklyData,
            source: 'weekly_automation'
        })

        return result
    } catch (error) {
        console.error('Error posting community highlight:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Example 4: Event-Triggered Posting
 * Post when significant events occur in your bot
 */
export async function postMilestoneAchievement(milestone) {
    if (!client.twitterService?.initialized) return

    try {
        let content

        switch (milestone.type) {
            case 'user_milestone':
                content = `🎉 Milestone achieved! We've now supported over ${milestone.count.toLocaleString()} individuals on their mental health journey. Thank you for being part of our caring community! 💚`
                break

            case 'guild_milestone':
                content = `🌟 Amazing news! Mellow is now active in ${milestone.count.toLocaleString()} supportive communities, spreading mental health awareness and support everywhere! 🤖💙`
                break

            case 'feature_launch':
                content = await client.ai.generateTwitterContent({
                    type: 'botUpdates',
                    topic: `New feature launched: ${milestone.featureName} - ${milestone.description}`,
                    maxLength: 200
                })
                break

            default:
                content = `🎊 Exciting milestone reached! ${milestone.description} Thank you for your continued support! #MentalHealthMatters`
        }

        const result = await client.twitterService.postTweet(content, {
            type: 'milestone',
            milestone: milestone.type,
            metadata: milestone,
            priority: 'high'
        })

        return result
    } catch (error) {
        console.error('Error posting milestone:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Example 5: Scheduled Content with Custom Logic
 * Advanced scheduling with custom conditions
 */
export async function smartScheduledPosting() {
    if (!client.twitterService?.initialized) return

    try {
        const now = new Date()
        const hour = now.getUTCHours()
        const dayOfWeek = now.getUTCDay()

        // Different content for different times
        let contentType
        let topic = null

        if (hour >= 6 && hour <= 10) {
            // Morning motivation
            contentType = 'dailyTip'
            topic = 'morning motivation and starting the day positively'
        } else if (hour >= 11 && hour <= 14) {
            // Midday stress management
            contentType = 'dailyTip'
            topic = 'midday stress relief and productivity balance'
        } else if (hour >= 18 && hour <= 22) {
            // Evening wind-down
            contentType = 'dailyTip'
            topic = 'evening relaxation and winding down'
        } else {
            // Late night/early morning - crisis support focus
            contentType = 'crisisSupport'
        }

        // Weekly content on specific days
        if (dayOfWeek === 1 && hour === 12) {
            // Monday noon
            contentType = 'weeklyUpdate'
            topic = 'Monday motivation and weekly mental health goals'
        }

        const result = await client.twitterService.postAIContent(contentType, {
            topic,
            source: 'smart_scheduler',
            timeSlot: `${hour}:00 UTC`
        })

        return result
    } catch (error) {
        console.error('Error in smart scheduled posting:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Example 6: User-Triggered Posting
 * Allow users to trigger special posts through Discord interactions
 */
export async function handleUserRequestedPost(interaction, postType, customMessage = null) {
    // Verify user permissions
    const userRoles = await client.db.users.getUserRoles(interaction.user.id)
    const canPost = userRoles?.includes('OWNER') || userRoles?.includes('ADMIN')

    if (!canPost) {
        return {
            success: false,
            error: 'Insufficient permissions'
        }
    }

    if (!client.twitterService?.initialized) {
        return {
            success: false,
            error: 'Twitter service not available'
        }
    }

    try {
        let result

        if (customMessage) {
            // Post custom message
            result = await client.twitterService.postTweet(customMessage, {
                type: 'user_custom',
                userId: interaction.user.id,
                username: interaction.user.username,
                source: 'discord_interaction'
            })
        } else {
            // Post AI-generated content
            result = await client.twitterService.postAIContent(postType, {
                userId: interaction.user.id,
                username: interaction.user.username,
                source: 'discord_interaction'
            })
        }

        // Log the activity
        if (client.systemLogger) {
            await client.systemLogger.logUserEvent(interaction.user.id, interaction.user.username, 'twitter_post', {
                postType,
                success: result.success,
                tweetId: result.tweetId
            })
        }

        return result
    } catch (error) {
        console.error('Error handling user-requested post:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Example 7: Health Check and Auto-Recovery
 * Monitor Twitter service health and attempt recovery
 */
export async function performTwitterHealthCheck() {
    if (!client.twitterService) {
        console.log('Twitter service not configured')
        return { healthy: false, reason: 'Service not configured' }
    }

    try {
        // Test connection
        const connectionTest = await client.twitterService.testConnection()

        if (!connectionTest.success) {
            console.log('Twitter connection failed, attempting recovery...')

            // Attempt to reinitialize
            const reinitResult = await client.twitterService.initialize()

            if (reinitResult) {
                console.log('Twitter service recovery successful')
                return { healthy: true, recovered: true }
            } else {
                console.log('Twitter service recovery failed')
                return {
                    healthy: false,
                    reason: 'Recovery failed',
                    error: connectionTest.error
                }
            }
        }

        // Check rate limits
        const rateCheck = client.twitterService.checkRateLimit()

        return {
            healthy: true,
            connection: connectionTest,
            rateLimit: rateCheck,
            dailyPosts: client.twitterService.dailyPostCount
        }
    } catch (error) {
        console.error('Twitter health check error:', error)
        return {
            healthy: false,
            reason: 'Health check error',
            error: error.message
        }
    }
}

/**
 * Helper function to get weekly community data
 */
async function getWeeklyCommunityData() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    return {
        newMembers: await client.db.users.countSince(oneWeekAgo),
        supportiveMessages: await client.db.conversationHistory.countSince(oneWeekAgo),
        copingToolsUsed: await client.db.copingToolUsage.countSince(oneWeekAgo),
        checkIns: await client.db.moodCheckIns.countSince(oneWeekAgo)
    }
}

/**
 * Example Integration in Discord Command
 *
 * Here's how you might use these functions in a Discord command:
 */
/*
export default {
    structure: {
        name: 'tweetstats',
        description: 'Post current bot statistics to Twitter',
        // ... other options
    },
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true })
        
        const result = await postDailyStatsSummary()
        
        if (result.success) {
            interaction.editReply('✅ Statistics posted to Twitter successfully!')
        } else {
            interaction.editReply(`❌ Failed to post to Twitter: ${result.error}`)
        }
    }
}
*/

/**
 * Example Integration in Event Handler
 *
 * Here's how you might trigger posts based on events:
 */
/*
// In your guild create event
client.on('guildCreate', async (guild) => {
    const totalGuilds = client.guilds.cache.size
    
    // Post milestone if it's a significant number
    if (totalGuilds % 100 === 0) {
        await postMilestoneAchievement({
            type: 'guild_milestone',
            count: totalGuilds,
            description: `Now supporting ${totalGuilds} communities!`
        })
    }
})
*/
