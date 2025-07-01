---
layout: default
title: Privacy Controls
nav_order: 5
description: 'Comprehensive guide to privacy controls, context logging, and data management in Mellow'
collection: guides
---

# Privacy Controls & Context Logging

Mellow prioritizes your privacy while providing personalized AI support. This document explains how you can control what information the AI has access to and how your data is used.

## 🔒 What is Context Logging?

Context logging allows Mellow's AI to access conversation history to provide better, more personalized responses. This includes:

-   **Your direct messages** with the bot
-   **Your conversation history** across sessions
-   **Recent channel messages** for context (in servers only)
-   **Conversation themes** and patterns over time

### How It Improves the Experience

When context logging is enabled, the AI can:

-   Remember previous conversations and build upon them
-   Provide continuity in support across multiple sessions
-   Understand ongoing situations and offer relevant help
-   Recognize patterns in your mental health journey
-   Give more personalized coping suggestions

## 👤 User Privacy Controls

### Individual User Settings

You have full control over your personal privacy through the `/preferences` command:

#### View Your Current Settings

```
/preferences view
```

This shows your current privacy settings including context logging status.

#### Enable/Disable Context Logging

```
/preferences update context_logging:true    # Enable context logging
/preferences update context_logging:false   # Disable context logging
```

#### Your Context Logging Options:

-   **✅ Enabled (Default):** AI can access your message history for better responses
-   **❌ Disabled:** AI has no access to your previous messages (limited memory)

#### What's Protected:

-   **Your choice is respected:** When disabled, your messages are never logged for AI context
-   **Existing data:** Disabling stops future logging but doesn't delete existing history
-   **DM priority:** Your personal preference always overrides server settings for DMs

### Check Your AI Memory

Use the `/context` command to see what conversation history the AI has access to:

```
/context
```

This shows:

-   Total conversation messages stored
-   Recent messages used for AI context
-   Conversation themes detected
-   How much memory the AI has about you

## 🏠 Server/Guild Controls

### For Server Administrators

Server admins can control context logging for their entire server using `/guildsettings`:

#### View Current Server Settings

```
/guildsettings view
```

#### Configure Context Logging for Your Server

```
/guildsettings features context_logging:true    # Enable server-wide context logging
/guildsettings features context_logging:false   # Disable server-wide context logging
```

### Server-Level Privacy Options:

#### ✅ Enabled (Default)

-   AI can use server messages for conversation context
-   Helps AI understand ongoing conversations in channels
-   Provides better support in public channels
-   Individual users can still opt-out personally

#### ❌ Disabled

-   No server messages are logged for AI context
-   AI responses are limited to individual user history only
-   Applies to all channels in the server
-   Individual user preferences for DMs are still respected

### Permission Requirements

-   **Administrator** or **Manage Guild** permissions required
-   Changes are logged to audit channels when configured

## 🛡️ Privacy Safeguards

### What We Protect:

-   **User consent:** Both user and server must allow context logging
-   **Privacy first:** Disabled by default if user opts out
-   **Secure storage:** All data encrypted and securely stored
-   **Limited retention:** Old conversation history is automatically cleaned up
-   **No sensitive data:** Only conversation content, not personal details

### How Settings Interact:

| User Setting | Server Setting | Result                                    |
| ------------ | -------------- | ----------------------------------------- |
| ✅ Enabled   | ✅ Enabled     | Full context logging (best AI experience) |
| ✅ Enabled   | ❌ Disabled    | User DMs only, no server context          |
| ❌ Disabled  | ✅ Enabled     | No logging for this user                  |
| ❌ Disabled  | ❌ Disabled    | No logging for this user                  |

### Data Retention:

-   **90 days:** Conversation history automatically cleaned up
-   **System messages:** Kept longer for functionality
-   **User deletion:** Use `/preferences reset` to clear all data

## 🔧 Technical Details

### What Gets Logged:

-   Message content and timestamps
-   Channel/server context (if enabled)
-   User ID and basic metadata
-   Conversation threading information

### What Doesn't Get Logged:

-   Personal Discord information
-   Messages from users who opt-out
-   Sensitive commands or data
-   Messages from servers with logging disabled

### Security Measures:

-   Database encryption at rest
-   Secure API communications
-   Privacy-aware error handling
-   Regular security audits

## 📋 Privacy Best Practices

### For Users:

1. **Review your settings** regularly with `/preferences view`
2. **Use `/context`** to see what the AI remembers
3. **Disable logging** if you prefer complete privacy
4. **Reset preferences** to clear all stored data if needed

### For Server Admins:

1. **Inform your community** about context logging policies
2. **Review server settings** periodically with `/guildsettings view`
3. **Consider your community's needs** - support channels benefit from context
4. **Respect user privacy** - some users may prefer to opt-out individually

## ❓ Frequently Asked Questions

### Q: What happens if I disable context logging?

A: The AI will have limited memory of previous conversations, but basic functionality remains. New messages won't be stored for context, but existing data remains until automatic cleanup.

### Q: Can I delete my existing conversation history?

A: Yes, use `/preferences reset` to delete all your stored preferences and conversation history.

### Q: Does disabling affect other bot features?

A: No, all other features like check-ins, coping tools, and crisis detection work normally regardless of context logging settings.

### Q: Can server admins see my private conversations?

A: No, server admins cannot access individual user conversation histories. They can only control server-wide logging policies.

### Q: Is my data shared with third parties?

A: No, your conversation data is never shared. It's only used to improve your experience with Mellow's AI support.

---

**Need Help?**

-   Use `/privacy` for a quick overview
-   Contact support through `/feedback`
-   Read our full [Privacy Policy](privacy-policy.md)

_Last updated: July 2025_
