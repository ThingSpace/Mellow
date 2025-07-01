---
layout: default
title: Getting Started
nav_order: 1
description: 'Complete setup guide for Mellow - from server configuration to personal settings'
parent: User Guides
---

# Getting Started with Mellow

This guide will help you set up and start using Mellow's comprehensive mental health features in your Discord server or as a personal companion.

## 🚀 Quick Setup

### Adding Mellow to Your Server

1. **Invite the Bot**

    - Use the [official invite link](https://discord.com/oauth2/authorize?client_id=1386810331367608371)
    - Select your server and authorize the required permissions
    - Mellow will introduce itself and provide setup guidance

2. **Initial Server Configuration** (Admins Only)
    ```
    /guildsettings view          # See current configuration
    /guildsettings channels      # Configure feature channels
    /guildsettings features      # Enable/disable features
    ```

### Required Permissions

Mellow needs these permissions to function properly:

**Core Functionality:**

-   **Send Messages** - Basic communication
-   **Use Slash Commands** - Modern command interface
-   **Embed Links** - Rich message formatting
-   **Read Message History** - Context understanding

**Moderation Features:**

-   **Manage Messages** - Message management
-   **Timeout Members** - User timeout actions
-   **Ban Members** - Ban/unban functionality
-   **Manage Roles** - Role assignment features

## 🎯 Essential First Steps

### 1. Personal Configuration

Set up your personalized Mellow experience:

```
/preferences view                    # See current settings
/preferences update                  # Configure all your preferences
/profile                            # View your mental health journey
```

**Critical Settings to Configure:**

-   **🕐 Timezone** - Enables automatic late-night companion mode with gentle, time-appropriate responses
-   **🤖 AI Personality** - Choose: gentle, supportive, direct, playful, professional, or encouraging
-   **🔔 Check-in Reminders** - Set intervals from 1-24 hours for mental health tracking
-   **🎨 Profile Theme** - Select your preferred color scheme for embeds
-   **💭 Context Logging** - Allow AI to remember conversations for personalized support
-   **📱 Reminder Method** - Choose DM or channel notifications

### 2. Understanding Privacy & Context

**Context Logging** is one of Mellow's most powerful features:

```
/context                            # See what the AI remembers about you
/preferences update context_logging:true     # Enable for better responses
/preferences update context_logging:false    # Disable for more privacy
```

**How Context Improves Your Experience:**

-   AI remembers your previous conversations and builds upon them
-   More personalized coping suggestions based on your patterns
-   Continuity in support across multiple sessions
-   Recognition of your mental health journey over time

See our [Privacy Controls guide](privacy-controls.md) for complete details.

### 3. Your First Mental Health Check-In

Begin tracking your mental wellness:

```
/checkin                            # Start your first mood check-in
```

**The Check-In Process:**

-   **🎭 Mood Selection** - Choose from happy, calm, sad, anxious, stressed, excited, etc.
-   **📊 Intensity Rating** - Rate 1-5 how strongly you feel this mood
-   **🏃 Activity Tracking** - Note what you've been doing (work, social, exercise, etc.)
-   **⏰ Next Check-In** - Automatically scheduled based on your preferences

### 4. Discover Time-Based Support

**Late-Night Companion Mode** automatically activates based on your timezone:

```
/timemode                           # Check your current time-based mode
```

**Automatic Mode Features:**

-   **🌙 Late-Night Mode (10 PM - 6 AM)** - Extra gentle, calming responses with sleep-friendly suggestions
-   **🌅 Early Morning Mode (6 AM - 10 AM)** - Encouraging support for starting your day
-   **🌆 Evening Wind-Down (8 PM - 10 PM)** - Calming, reflective responses for day's end
-   **☀️ Standard Mode** - Regular supportive interactions throughout the day

### 5. Explore Mental Health Tools

Discover Mellow's comprehensive toolkit:

```
/coping                             # Access breathing & grounding exercises
/toolbox                            # Manage your favorite coping tools
/plan                               # Create personalized coping plans
/music                              # Get calming music suggestions
/support                            # Crisis resources and hotlines
/streaks                            # Track your tool usage patterns
```

**Specialized Features:**

-   **Ghost Letters** (`/ghostletter`) - Private, safe venting that gets cleared
-   **Insights** (`/insights`) - Detailed mood analysis and trends
-   **Crisis Detection** - Automatic support when you need it most

## 🏥 Understanding Crisis Support

**Automatic Crisis Detection:**

-   Mellow's AI automatically detects signs of distress in messages
-   Provides appropriate resources and coping strategies discreetly
-   Can alert server moderators in serious situations (if enabled)
-   Always respects your privacy and autonomy

**Getting Help:**

```
/support                            # Immediate crisis resources
```

## ⚙️ Server Setup (Administrators)

### Essential Channel Configuration

Set up dedicated channels for Mellow's features:

```
/guildsettings channels mod_alert_channel:#crisis-alerts
/guildsettings channels mod_log_channel:#mod-logs
/guildsettings channels checkin_channel:#mental-health
/guildsettings channels system_channel:#system-logs
/guildsettings channels audit_log_channel:#audit-logs
```

### Feature Management

Control which features are available in your server:

```
/guildsettings features check_ins:true           # Enable mood tracking
/guildsettings features crisis_alerts:true       # Enable crisis detection
/guildsettings features ghost_letters:true       # Enable private venting
/guildsettings features system_logs:true         # Enable system logging
```

### Moderation Tools

Access comprehensive moderation features:

```
/mod timeout user:@user duration:1h reason:"Breaking rules"
/mod ban user:@user reason:"Severe violation"
/mod role add user:@user role:@Helper
/mod logs user:@user                            # View user's mod history
```

## 🔧 Advanced Features

### AI Personality Customization

Each user can customize how Mellow interacts with them:

**Available Personalities:**

-   **Gentle** - Soft, nurturing, and understanding approach
-   **Supportive** - Encouraging and optimistic responses
-   **Direct** - Clear, straightforward guidance
-   **Playful** - Light-hearted but caring interactions
-   **Professional** - Formal, structured support approach
-   **Encouraging** - Motivational and uplifting tone

### Analytics & Insights

Track your mental health journey:

```
/insights week                      # Weekly mood analysis
/insights month                     # Monthly trends
/insights all                       # All-time patterns
/profile                           # Complete wellness overview
```

### Privacy Controls

Manage your data and privacy:

```
/preferences view                   # Review all settings
/preferences reset                  # Clear all data and reset
/context                           # View AI conversation history
```

## 🆘 Need Help?

-   **Command Help:** Use `/help` for quick command references
-   **Crisis Support:** Use `/support` for immediate crisis resources
-   **Technical Issues:** See our [Troubleshooting guide](troubleshooting.md)
-   **Questions:** Check our [FAQ](faq.md) or join the [support server](https://discord.gg/C3ZuXPP7Hc)

## 🎯 Next Steps

1. **Complete your first week** of check-ins to see trend analysis
2. **Explore coping tools** and add favorites to your toolbox
3. **Create a coping plan** for challenging situations
4. **Configure server features** if you're an administrator
5. **Join the community** in our support server for tips and updates

Remember: Mellow is here to support your mental health journey, not replace professional care. If you're experiencing a mental health crisis, please reach out to a professional or use the crisis resources provided by `/support`.
