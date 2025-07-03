---
layout: default
title: Twitter Integration
nav_order: 3
description: 'Debug, health, and diagnostic commands for technical users'
parent: Technical Documentation
---

# Twitter/X Integration Guide

Mellow includes comprehensive Twitter/X integration capabilities, allowing the bot to automatically post mental health content, tips, and updates to your Twitter/X account.

## Features

### 🤖 AI-Powered Content Generation

-   **Daily Mental Health Tips** - Supportive, actionable wellness advice
-   **Weekly Progress Updates** - Community highlights and progress sharing
-   **Mental Health Awareness Posts** - Educational content and resources
-   **Crisis Support Resources** - Helpful resources and support information
-   **Custom Content** - Manual posting with AI assistance

### ⏰ Automated Scheduling

-   **Daily Posting** - Schedule daily tips at specific times
-   **Weekly Updates** - Post weekly content on specific days
-   **Rate Limiting** - Built-in controls to prevent spam
-   **Content Moderation** - Automatic filtering of inappropriate content

### 📊 Management & Analytics

-   **Real-time Status** - Monitor connection and posting health
-   **Activity Logging** - Track all posting activity
-   **Rate Limit Management** - Automatic cooldown and daily limits
-   **Manual Controls** - Start/stop scheduling and manual posting

## Setup & Configuration

### 1. Twitter/X Developer Account Setup

1. **Create Twitter Developer Account:**

    - Go to [developer.twitter.com](https://developer.twitter.com)
    - Apply for a developer account
    - Create a new app for your bot

2. **Twitter API Use Case Information:**
   When applying for API access, provide these details:

    - **Use Case:** Mental health support and awareness platform
    - **Description:** "Automated posting of mental health tips, educational content, and community support resources. Our Discord bot serves mental health communities and uses Twitter to share helpful wellness content, crisis resources, and supportive messaging to reach people who need mental health support."
    - **Will you make Twitter content available to government entities?** No
    - **Will you display Twitter content?** No (we only post content)
    - **Academic Research?** No
    - **Tweet Volume:** Approximately 5-10 tweets per day, focused on mental health awareness and support resources

3. **Generate API Keys:**

    - API Key and Secret
    - Access Token and Secret
    - Bearer Token (for v2 API features)

4. **Set Permissions:**
    - Ensure "Read and Write" permissions are enabled
    - This allows the bot to post tweets

### 2. Environment Variables

Add these variables to your `.env` file:

```bash
# Twitter/X API Credentials (Required)
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here
TWITTER_BOT_USERNAME=YourBotUsername

# Twitter Posting Settings (Optional)
TWITTER_POSTING_ENABLED=true
TWITTER_POST_COOLDOWN=60
TWITTER_DAILY_LIMIT=10
TWITTER_INCLUDE_HASHTAGS=true
TWITTER_MONITOR_MENTIONS=false
TWITTER_REQUIRE_APPROVAL=false

# Analytics (Optional)
TWITTER_ANALYTICS_WEBHOOK=https://your-analytics-webhook.com/twitter
```

### 3. Configuration Options

The Twitter service can be configured in `src/configs/twitter.config.js`:

#### Content Types

```javascript
contentTypes: {
    dailyTips: {
        enabled: true,
        schedule: '09:00', // 9 AM UTC
        frequency: 'daily'
    },
    weeklyUpdates: {
        enabled: true,
        schedule: 'monday 12:00', // Monday at 12 PM UTC
        frequency: 'weekly'
    },
    awarenessPost: {
        enabled: true,
        frequency: 'as-needed'
    }
}
```

#### Rate Limiting

```javascript
rateLimiting: {
    postsPerHour: 5,
    minInterval: 15, // Minutes between posts
    retryAttempts: 3,
    retryBackoff: 2
}
```

## Usage

### Discord Commands

Use the `/twitter` command to manage Twitter integration:

#### Post Content

```
/twitter post type:dailyTip
/twitter post type:custom content:"Your custom message here"
/twitter post type:awarenessPost topic:"anxiety management"
```

#### Check Status

```
/twitter status
```

#### Manage Scheduling

```
/twitter schedule action:view
/twitter schedule action:start
/twitter schedule action:stop
```

### Programmatic Usage

#### Manual Posting

```javascript
// Post AI-generated content
const result = await client.twitterService.postAIContent('dailyTip', {
    topic: 'mindfulness',
    mood: 'encouraging'
})

// Post custom content
const result = await client.twitterService.postTweet('Custom message here', {
    type: 'manual',
    source: 'api'
})

// Post specific content types
await client.twitterService.postDailyTip()
await client.twitterService.postWeeklyUpdate()
await client.twitterService.postBotUpdate('Bot is now online!')
```

#### Check Service Status

```javascript
// Test connection
const connectionTest = await client.twitterService.testConnection()
console.log(connectionTest) // { success: true, username: 'botname' }

// Check if initialized
const isReady = client.twitterService.initialized
```

#### Control Scheduling

```javascript
// Start automatic posting
client.twitterService.startScheduledPosting()

// Stop automatic posting
client.twitterService.stopScheduledPosting()
```

## Content Generation

### AI Integration

The Twitter service uses Mellow's AI service to generate appropriate content:

```javascript
// The AI service includes special Twitter content generation
const content = await client.ai.generateTwitterContent({
    type: 'dailyTip',
    topic: 'stress management',
    maxLength: 240, // Leave room for hashtags
    mood: 'supportive'
})
```

### Content Types

1. **Daily Tips (`dailyTip`)**

    - Practical mental health advice
    - Coping strategies
    - Wellness reminders

2. **Weekly Updates (`weeklyUpdate`)**

    - Community highlights
    - Progress sharing
    - Encouraging statistics

3. **Awareness Posts (`awarenessPost`)**

    - Educational content
    - Mental health facts
    - Support resources

4. **Crisis Support (`crisisSupport`)**

    - Crisis resources
    - Emergency contacts
    - Immediate help options

5. **Custom Content (`custom`)**
    - Manual content input
    - Bot announcements
    - Special messages

### Hashtag Management

The service automatically adds relevant hashtags:

```javascript
defaultHashtags: ['#MentalHealth', '#Wellness', '#SelfCare', '#Support', '#MentalHealthMatters']
```

Hashtags are intelligently added if there's space, or omitted if the content would exceed Twitter's character limit.

## Monitoring & Analytics

### Activity Logging

All Twitter activity is logged through the system logger:

-   Post attempts and results
-   Rate limiting events
-   Connection issues
-   Scheduled posting events

### System Logger Integration

```javascript
// View Twitter activity in system logs
await client.systemLogger.logStartupEvent('twitter_service', 'Daily tip posted', {
    type: 'dailyTip',
    success: true,
    tweetId: '1234567890'
})
```

### Analytics Webhook

Configure an external webhook to receive Twitter analytics:

```bash
TWITTER_ANALYTICS_WEBHOOK=https://your-analytics-service.com/webhook
```

The webhook receives data about:

-   Post engagement
-   Successful/failed posts
-   Rate limiting events
-   Service health

## Rate Limiting & Safety

### Built-in Protection

The service includes comprehensive rate limiting:

1. **Daily Limits** - Maximum posts per day
2. **Hourly Limits** - Maximum posts per hour
3. **Cooldown Periods** - Minimum time between posts
4. **Content Moderation** - Automatic filtering of inappropriate content

### Error Handling

-   **Automatic Retries** - Failed posts are retried with exponential backoff
-   **Graceful Degradation** - Service continues working even if some features fail
-   **Detailed Logging** - All errors are logged for debugging

### Content Safety

-   **Topic Filtering** - Blocks sensitive or inappropriate topics
-   **Manual Approval** - Optional manual review before posting
-   **Content Length** - Automatic truncation and formatting

## Troubleshooting

### Common Issues

**"Twitter service not initialized"**

-   Check API credentials in environment variables
-   Verify Twitter app permissions (Read and Write)
-   Check network connectivity

**"Rate limit exceeded"**

-   Wait for cooldown period to expire
-   Check daily/hourly posting limits
-   Review posting frequency settings

**"Content moderation failed"**

-   Review content filtering settings
-   Check for blocked topics in content
-   Verify AI service is working properly

### Debug Commands

```javascript
// Test connection
const test = await client.twitterService.testConnection()
console.log(test)

// Check current rate limits
const limits = client.twitterService.checkRateLimit()
console.log(limits)

// View configuration
console.log(client.twitterService.config)
```

## Security Best Practices

1. **Environment Variables** - Store all credentials in environment variables
2. **Rate Limiting** - Don't exceed Twitter's API limits
3. **Content Review** - Review automated content periodically
4. **Monitoring** - Monitor posting activity and engagement
5. **Backup Planning** - Have fallback procedures for service failures

## Integration Examples

### Ready Event Integration

The Twitter service is automatically initialized in the ready event:

```javascript
// In ready.js - already implemented
if (client.twitterService) {
    const twitterInitialized = await client.twitterService.initialize()
    if (twitterInitialized) {
        log('Twitter service initialized successfully', 'done')
        // Connection test is automatically performed during initialization
        // No startup tweet is posted to conserve API limits
    } else {
        log('Twitter service disabled or failed to initialize', 'warn')
    }
}
```

### Custom Posting Integration

```javascript
// In your custom code
export async function postWeeklyStats(stats) {
    if (!client.twitterService?.initialized) return

    const content = await client.ai.generateTwitterContent({
        type: 'weeklyUpdate',
        topic: `Weekly stats: ${stats.checkIns} check-ins, ${stats.copingToolsUsed} coping tools used`,
        maxLength: 200
    })

    return await client.twitterService.postTweet(content, {
        type: 'weekly_stats',
        metadata: stats
    })
}
```

---

For more information, see the [API documentation](./api.md#twitter-service) or join our [support server](https://discord.gg/C3ZuXPP7Hc).
