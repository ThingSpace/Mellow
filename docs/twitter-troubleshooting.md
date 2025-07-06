---
layout: default
title: Twitter API Troubleshooting
parent: Technical Documentation
nav_order: 4
description: 'Troubleshooting guide for Twitter API integration issues'
---

# Twitter API Troubleshooting Guide

This guide helps resolve common Twitter API integration issues with Mellow Bot.

## Common Error Codes

### 403 Forbidden Error

**Error Message:** `Request failed with code 403`

**Cause:** The most common cause is insufficient permissions or invalid credentials.

**Solutions:**

1. **Check API Credentials**

    ```bash
    # Verify these environment variables are set correctly:
    TWITTER_API_KEY=your_api_key_here
    TWITTER_API_SECRET=your_api_secret_here
    TWITTER_ACCESS_TOKEN=your_access_token_here
    TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here
    TWITTER_BEARER_TOKEN=your_bearer_token_here
    ```

2. **Verify Twitter Developer Portal Settings**

    - Go to [Twitter Developer Portal](https://developer.twitter.com)
    - Check your app has **Read and Write** permissions
    - Ensure **API v2** access is enabled
    - Verify your app is **Active** (not suspended)

3. **Regenerate Access Tokens**

    - In Developer Portal, go to your app
    - Navigate to "Keys and Tokens"
    - Regenerate Access Token and Secret
    - Update your environment variables

4. **Check Account Status**
    - Ensure your Twitter account is not suspended
    - Verify account is not restricted
    - Check if account needs phone verification

### 401 Unauthorized Error

**Error Message:** `Request failed with code 401`

**Cause:** Invalid or expired API credentials.

**Solutions:**

1. **Verify API Key and Secret**

    - Check `TWITTER_API_KEY` and `TWITTER_API_SECRET`
    - Ensure no extra spaces or characters
    - Regenerate if necessary

2. **Check Access Tokens**
    - Verify `TWITTER_ACCESS_TOKEN` and `TWITTER_ACCESS_TOKEN_SECRET`
    - Ensure tokens match your app and account
    - Regenerate if expired

### 429 Rate Limit Exceeded

**Error Message:** `Request failed with code 429`

**Cause:** Too many requests made to Twitter API.

**Solutions:**

1. **Wait Before Retrying**

    - Rate limits reset every 15 minutes
    - Reduce posting frequency

2. **Check Rate Limit Settings**
    - Increase `TWITTER_POST_COOLDOWN` (default: 60 minutes)
    - Reduce `TWITTER_DAILY_LIMIT` (default: 10 posts)

## Configuration Steps

### 1. Twitter Developer Account Setup

1. Apply for a Twitter Developer Account
2. Create a new app in the Developer Portal
3. Set app permissions to **Read and Write**
4. Generate API keys and tokens

### 2. Environment Variables

Create a `.env` file or set these variables:

```env
# Twitter API Configuration
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here
TWITTER_BOT_USERNAME=your_bot_username

# Twitter Posting Settings
TWITTER_POSTING_ENABLED=true
TWITTER_POST_COOLDOWN=60
TWITTER_DAILY_LIMIT=10
TWITTER_INCLUDE_HASHTAGS=true
```

### 3. Bot Configuration

1. Restart the bot after setting environment variables
2. Use `/twitter status` to check connection
3. Look for diagnostic messages in the status output

## Diagnostic Commands

### Check Twitter Service Status

```
/twitter status
```

This command shows:

-   Connection status
-   API credentials validation
-   Configuration settings
-   Daily posting statistics
-   Detailed error diagnostics

### Test Twitter Connection

The status command automatically tests the connection and provides specific error messages and solutions.

## Common Issues and Solutions

### "Service Not Initialized"

**Cause:** Twitter service failed to start.

**Solutions:**

1. Check all environment variables are set
2. Verify `TWITTER_POSTING_ENABLED=true`
3. Restart the bot
4. Check bot logs for initialization errors

### "Content Blocked"

**Cause:** Content moderation is enabled and flagged the content.

**Solutions:**

1. Review the content for policy violations
2. Disable content moderation temporarily
3. Modify the content to comply with policies

### "Rate Limit Exceeded"

**Cause:** Too many posts in a short time.

**Solutions:**

1. Increase cooldown period
2. Reduce daily posting limit
3. Wait for rate limit reset

## API Version Compatibility

Mellow Bot uses **Twitter API v2** which requires:

-   Elevated access (free tier available)
-   Read and Write permissions
-   Valid OAuth 1.0a credentials

## Getting Help

1. Use `/twitter status` for automatic diagnostics
2. Check the bot logs for detailed error messages
3. Verify your Twitter Developer Portal settings
4. Contact support if issues persist

## Environment Variable Reference

| Variable                      | Required | Description           | Default         |
| ----------------------------- | -------- | --------------------- | --------------- |
| `TWITTER_API_KEY`             | Yes      | Twitter API Key       | None            |
| `TWITTER_API_SECRET`          | Yes      | Twitter API Secret    | None            |
| `TWITTER_ACCESS_TOKEN`        | Yes      | Access Token          | None            |
| `TWITTER_ACCESS_TOKEN_SECRET` | Yes      | Access Token Secret   | None            |
| `TWITTER_BEARER_TOKEN`        | Optional | Bearer Token          | None            |
| `TWITTER_BOT_USERNAME`        | Optional | Bot Username          | MellowMentalBot |
| `TWITTER_POSTING_ENABLED`     | Optional | Enable posting        | false           |
| `TWITTER_POST_COOLDOWN`       | Optional | Minutes between posts | 60              |
| `TWITTER_DAILY_LIMIT`         | Optional | Max posts per day     | 10              |
| `TWITTER_INCLUDE_HASHTAGS`    | Optional | Include hashtags      | true            |

---

_Last updated: July 3, 2025_
