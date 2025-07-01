---
layout: default
title: Troubleshooting
nav_order: 9
description: "Solutions to common issues and technical support"
---

# Troubleshooting

This guide helps you resolve common issues with Mellow. If you can't find a solution here, visit our [support server](https://discord.gg/C3ZuXPP7Hc).

## 🤖 Bot Commands & Responses

### Bot not responding to commands?

**Check Permissions:**

-   Ensure Mellow has "Send Messages", "Use Slash Commands", and "Embed Links" permissions
-   For moderation features, check "Timeout Members", "Ban Members", and "Manage Roles" permissions
-   Verify permissions in the specific channel you're using

**Test in Different Contexts:**

-   Try commands in DMs to isolate server-specific issues
-   Test in different channels if server commands aren't working
-   Use `/help` to verify the bot is responsive

**Slash Command Issues:**

-   Refresh Discord (Ctrl+R) to update slash command cache
-   Check if slash commands are enabled in your server settings
-   Try using commands without autocomplete

### AI responses seem limited or don't remember previous conversations?

**Context Logging Settings:**

-   Check your privacy settings with `/preferences view`
-   Enable context logging with `/preferences update context_logging:true` for better AI responses
-   Server admins may have disabled context logging - check with `/guildsettings view`

**View Your AI Context:**

-   Use `/context` to see what conversation history the AI has access to
-   If context is empty, previous conversations may have been cleared or logging was disabled

## 🧘 Mental Health Features

### Can't see check-in history or mood data?

**Check Your Profile:**

-   Use `/profile` to view your complete mental health journey
-   Use `/insights` to see mood trends and analysis
-   Ensure you've completed at least one check-in with `/checkin`

**Privacy Settings:**

-   Check journal privacy settings with `/preferences view`
-   Some data might be private depending on your configuration

### Reminders not working?

**Reminder Configuration:**

-   Check reminder settings with `/preferences view`
-   Ensure reminders are enabled with `/preferences update reminders_enabled:true`
-   Set check-in interval with `/preferences update checkin_interval:` (1-24 hours)
-   Verify your timezone is set with `/preferences update timezone:`

**Notification Issues:**

-   Ensure DMs are enabled for Mellow
-   Check if you've blocked DMs from server members
-   Try changing reminder method with `/preferences update reminder_method:dm`

### Late-night companion mode not working?

**Timezone Configuration:**

-   Set your timezone with `/preferences update timezone:` (required for late-night mode)
-   Use `/timemode` to check what mode is currently active
-   Verify your timezone is correct for your location

**Mode Activation:**

-   Late-night mode activates automatically from 10 PM - 6 AM in your timezone
-   The AI will provide gentler, more calming responses during these hours
-   Early morning mode activates from 6 AM - 10 AM for encouraging support

## 🛠️ Coping Tools & Crisis Support

### Coping tools or crisis resources not loading?

**Feature Availability:**

-   Check if features are enabled in your server with `/guildsettings view`
-   Some features may be disabled by server administrators
-   Try accessing tools via DMs if server features are limited

**Specific Tool Issues:**

-   Use `/coping` for basic tools (breathing, grounding, etc.)
-   Try `/toolbox` for personalized tool management
-   Use `/support` for crisis resources and hotlines

### Crisis detection not working as expected?

**Understanding Crisis Detection:**

-   Crisis detection works automatically in the background
-   It analyzes message content and provides appropriate resources
-   Moderators receive alerts for high-severity situations (if enabled)

**Privacy Concerns:**

-   Crisis detection respects your privacy settings
-   Resources are provided discreetly and supportively
-   Contact moderators directly if you need immediate help

## ⚙️ Server Configuration (Admins)

### Guild settings or moderation features not working?

**Permission Requirements:**

-   Ensure you have Administrator or Manage Server permissions
-   Check that Mellow has the required moderation permissions
-   Verify channel permissions for logging and alerts

**Configuration Steps:**

-   Use `/guildsettings view` to see current configuration
-   Configure channels with `/guildsettings channels`
-   Enable/disable features with `/guildsettings features`

### Mod alerts or logging not working?

**Channel Configuration:**

-   Set alert channels with `/guildsettings channels mod_alert_channel:#channel`
-   Configure log channels with `/guildsettings channels mod_log_channel:#channel`
-   Ensure the bot can send messages in configured channels

**Feature Toggles:**

-   Enable crisis alerts with `/guildsettings features crisis_alerts:true`
-   Enable system logging with `/guildsettings features system_logs:true`
-   Check if users have opted out of crisis detection

## 🔧 Technical Issues

### Getting errors or bugs?

**First Steps:**

-   Wait a few minutes and try again (may be temporary API issues)
-   Check the [support server](https://discord.gg/C3ZuXPP7Hc) for service announcements
-   Note the exact error message and steps to reproduce

**Persistent Issues:**

-   [Report bugs on GitHub](https://github.com/ThingSpace/Mellow/issues) with detailed information
-   Include screenshots if helpful
-   Mention your server size and configuration

### Bot left my server or appears offline?

**Re-invitation:**

-   Re-invite the bot using the [invite link](https://discord.com/oauth2/authorize?client_id=1386810331367608371)
-   Grant all required permissions during re-invitation
-   Check server audit logs to see why the bot was removed

**Status Verification:**

-   Check the [status page](https://status.athing.space) if available
-   Visit the support server to verify bot status
-   Check if your server hit Discord's bot limits

## 📞 Still Need Help?

If you've tried these solutions and still have issues:

-   **Support Server:** [Join here](https://discord.gg/C3ZuXPP7Hc) for live help
-   **Email Support:** [support@athing.space](mailto:support@athing.space)
-   **GitHub Issues:** [Report bugs or request features](https://github.com/ThingSpace/Mellow/issues)
-   **Emergency Support:** Use `/support` for crisis resources and hotlines

---
