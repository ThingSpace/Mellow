---
layout: default
title: Getting Started
nav_order: 2
---

# Getting Started with Mellow

This guide will help you set up and start using Mellow in your Discord server or as a personal companion.

## Installation

### Adding Mellow to Your Server

1. **Invite the Bot**

    - Use the [official invite link](https://discord.com/oauth2/authorize?client_id=1386810331367608371)
    - Select your server and authorize the required permissions

2. **Initial Setup**
    - Run `/guildsettings view` to see current configuration
    - Configure channels with `/guildsettings channels`
    - Enable features with `/guildsettings features`

### Required Permissions

Mellow needs these permissions to function properly:

-   **Send Messages** - Basic communication
-   **Use Slash Commands** - Modern command interface
-   **Embed Links** - Rich message formatting
-   **Manage Messages** - Moderation features
-   **Timeout Members** - Moderation actions
-   **Ban Members** - Moderation actions
-   **Manage Roles** - Role assignment features

## First Steps

### 1. Personal Setup

Start by configuring your personal preferences:

```
/preferences view          # See current settings
/preferences update        # Modify check-in intervals, themes, etc.
/profile                   # View your mental health journey
```

### 2. Your First Check-In

Begin tracking your mental health with structured check-ins:

```
/checkin                   # Start your first mood check-in
```

You'll be guided through:

-   **Mood Selection** - Choose from happy, calm, sad, anxious, etc.
-   **Intensity Rating** - Rate from 1-5 how strongly you feel
-   **Activity Tracking** - Note what you've been doing
-   **Next Check-In** - Schedule based on your preferences

### 3. Explore Coping Tools

Discover tools to support your mental health:

```
/coping                    # Access breathing, grounding exercises
/toolbox                   # Manage your favorite tools
/plan                      # Create personalized coping plans
/support                   # Crisis resources and hotlines
```

### 4. Server Configuration (Admins)

Set up Mellow for your community:

#### Channel Configuration

```
/guildsettings channels mod_alert_channel:#crisis-alerts
/guildsettings channels mod_log_channel:#mod-logs
/guildsettings channels checkin_channel:#mental-health
/guildsettings channels system_channel:#system-logs
```

#### Feature Toggles

```
/guildsettings features check_ins:true
/guildsettings features crisis_alerts:true
/guildsettings features ghost_letters:true
/guildsettings features system_logs:true
```

#### Moderation Setup

```
/guildsettings moderation auto_mod_enabled:true
/guildsettings moderation auto_mod_level:3
/guildsettings moderation moderator_role:@Mental Health Moderator
/guildsettings moderation system_role:@Member
```

## Key Commands Overview

### Mental Health & Wellness

-   `/checkin` - Log your current mood and feelings
-   `/insights` - View mood trends and analysis
-   `/profile` - Comprehensive mental health journey
-   `/preferences` - Manage personal settings

### Coping & Support

-   `/coping` - Access grounding and breathing techniques
-   `/toolbox` - Manage favorite coping tools
-   `/plan` - Create personalized coping plans
-   `/music` - Get calming music suggestions
-   `/support` - Access crisis resources
-   `/streaks` - Track coping tool usage

### Privacy & Expression

-   `/ghostletter` - Write private messages for venting

### Information & Help

-   `/help` - Command help and information
-   `/about` - Learn about Mellow
-   `/source` - Open source information

## Privacy & Safety

### Data Protection

-   All personal data is encrypted and secure
-   You control what information is shared
-   Crisis detection respects privacy while ensuring safety

### Crisis Support

-   AI monitors for distress signals
-   Immediate access to crisis resources
-   Automatic alerts to moderators when appropriate
-   Professional help information always available

### Safe Spaces

-   Ghost letters are completely private
-   Check-ins are confidential by default
-   Judgment-free environment encouraged

## Best Practices

### For Users

1. **Regular Check-Ins** - Consistency helps track patterns
2. **Honest Reporting** - Accurate mood tracking improves insights
3. **Explore Tools** - Try different coping techniques
4. **Privacy Settings** - Configure comfort levels
5. **Professional Help** - Use resources when needed

### For Server Admins

1. **Clear Guidelines** - Set mental health channel rules
2. **Mod Training** - Ensure mods understand crisis protocols
3. **Resource Sharing** - Pin crisis resources and guidelines
4. **Regular Monitoring** - Check crisis alerts and logs
5. **Community Culture** - Foster supportive environment

## Troubleshooting

### Common Issues

**Bot not responding to commands?**

-   Check bot permissions in server settings
-   Ensure slash commands are enabled
-   Try using commands in DMs

**Can't see check-in history?**

-   Use `/profile` for comprehensive overview
-   Try `/insights` for mood analysis
-   Check `/preferences` for privacy settings

**Reminders not working?**

-   Verify DM permissions are enabled
-   Check `/preferences` for reminder settings
-   Ensure proper intervals are configured

### Getting Help

1. **Documentation** - Check these docs first
2. **Help Command** - Use `/help` for specific command info
3. **Support Server** - Join our Discord for community help
4. **GitHub Issues** - Report bugs or request features
5. **Email Support** - Contact support@athing.space

## Next Steps

-   Explore the [full command reference](commands.md)
-   Read about [privacy policies](privacy-policy.md)
-   Learn about [contributing](contributing.md)
-   Check out the [API documentation](api.md)

---

Remember: You are not alone, and your feelings are valid. Mellow is here to support you, but professional help is always available when needed.
