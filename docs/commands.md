---
layout: default
title: Commands
nav_order: 1
description: 'Complete reference guide for all Mellow commands including mental health, moderation, and technical features'
parent: Reference
redirect_from:
    - /commands/
    - /reference/
    - /cmd/
---

# Command Reference

Complete reference for all Mellow commands, organized by category.

## 🧘 Mental Health & Wellness

### `/checkin`

Log your current mood and feelings with structured tracking.

**Usage:** `/checkin`

**Features:**

-   Structured mood options (happy, calm, sad, anxious, etc.)
-   Intensity rating (1-5 scale)
-   Activity tracking for context
-   Automatic next check-in scheduling

**Example Flow:**

1. Select your current mood from emoji options
2. Rate intensity from 1 (barely) to 5 (extremely)
3. Choose activities you've been doing
4. Receive supportive response and next check-in time

---

### `/insights`

View mood trends and analysis over different timeframes.

**Usage:** `/insights [timeframe]`

**Options:**

-   `timeframe`: `week`, `month`, `all-time` (default: week)

**Provides:**

-   Mood distribution with percentages
-   Average intensity ratings
-   Activity variety tracking
-   Visual mood representation
-   Trend analysis and patterns

---

### `/profile`

Comprehensive overview of your mental health journey.

**Usage:** `/profile`

**Includes:**

-   Wellness score calculation
-   Total check-ins and streak information
-   Recent mood trends
-   Most frequent moods and activities
-   Coping tool usage statistics
-   Account settings and preferences

---

### `/preferences`

Manage your personal settings and privacy controls.

**Usage:**

-   `/preferences view` - Display current settings
-   `/preferences update` - Modify settings
-   `/preferences reset` - Reset to defaults

**Settings:**

-   **Check-in Intervals:** 1-24 hours
-   **AI Personality:** gentle, supportive, direct, playful, professional, encouraging
-   **Theme Colors:** blue, purple, green, orange, pink, red, teal, yellow
-   **Language:** English, Spanish, French, German, Italian, Portuguese, Dutch, Japanese
-   **Timezone:** 25+ timezone options including US, Canada, Europe, Asia-Pacific
-   **Privacy:** Journal visibility and context logging settings
-   **Reminder Method:** DM or channel notifications

**Special Features:**

-   **Late-Night Companion Mode:** Automatically enabled based on your timezone for gentler support during late hours (10 PM - 6 AM)
-   **Context Logging:** Allow AI to remember conversations for better personalized support
-   **Smart Reminders:** Timezone-aware check-in scheduling

## 🛠️ Coping & Support

### `/coping`

Access grounding and breathing techniques for emotional support.

**Usage:** `/coping [tool] [mood]`

**Options:**

-   `tool`: `breathing`, `grounding`, `muscle-relaxation`, `mindfulness`
-   `mood`: Auto-suggests based on recent check-ins

**Features:**

-   Guided breathing exercises
-   5-4-3-2-1 grounding technique
-   Progressive muscle relaxation
-   Mindfulness exercises
-   AI-powered tool suggestions

---

### `/toolbox`

Manage your favorite coping tools for quick access.

**Usage:**

-   `/toolbox view` - Show favorite tools
-   `/toolbox add [tool]` - Add to favorites
-   `/toolbox remove [tool]` - Remove from favorites

**Benefits:**

-   Quick access to preferred techniques
-   Personalized tool recommendations
-   Usage tracking and streaks
-   Emergency tool access

---

### `/plan`

Create and manage personalized coping plans.

**Usage:**

-   `/plan create [name]` - Create new plan
-   `/plan view [name]` - Display existing plan
-   `/plan list` - Show all plans

**Features:**

-   Step-by-step coping strategies
-   Crisis-specific plans
-   Trigger identification
-   Resource integration
-   Personalized recommendations

---

### `/music`

Get calming music suggestions for relaxation.

**Usage:** `/music [mood] [genre]`

**Options:**

-   `mood`: Based on current emotional state
-   `genre`: `ambient`, `classical`, `nature`, `lo-fi`

**Provides:**

-   Curated playlists for different moods
-   Calming music recommendations
-   Nature sounds and ambient tracks
-   Guided meditation music

---

### `/support`

Access crisis resources and professional help information.

**Usage:** `/support [region]`

**Includes:**

-   Crisis hotlines by country/region
-   Professional resource directories
-   Emergency contact information
-   Local mental health services
-   Online therapy options

---

### `/streaks`

Track your coping tool usage and maintain healthy habits.

**Usage:** `/streaks [tool]`

**Tracking:**

-   Daily tool usage streaks
-   Weekly and monthly statistics
-   Tool effectiveness ratings
-   Progress visualization
-   Motivation and encouragement

## 💭 Expression & Privacy

### `/ghostletter`

Write private messages for safe emotional venting.

**Usage:** `/ghostletter [action]`

**Actions:**

-   `write` - Compose new private message
-   `view` - Read previous letters
-   `clear` - Delete all letters

**Features:**

-   Completely private and encrypted
-   No judgment or response
-   Therapeutic writing space
-   Safe emotional release
-   Auto-deletion options

## ⚙️ Server Management (Admin Only)

### `/guildsettings`

Configure server features and channels.

**Usage:** `/guildsettings [subcommand] [options]`

**Subcommands:**

#### `/guildsettings view`

Display current server configuration and settings.

#### `/guildsettings channels`

Configure channel assignments for different bot features.

**Options:**

-   `mod_alert_channel` - Channel for crisis alerts and serious moderation events
-   `mod_log_channel` - Channel for moderation action logs
-   `checkin_channel` - Channel for mental health check-in logs
-   `coping_tool_log` - Channel for coping tool usage logs
-   `system_channel` - Channel for system notifications
-   `audit_log_channel` - Channel for audit logs

#### `/guildsettings features`

Enable or disable bot features for your server.

**Options:**

-   `check_ins` - Enable/disable mood tracking and check-ins
-   `ghost_letters` - Enable/disable private venting feature
-   `crisis_alerts` - Enable/disable crisis detection and alerts
-   `system_logs` - Enable/disable system event logging

#### `/guildsettings moderation`

Configure auto-moderation and role settings.

**Options:**

-   `auto_mod_enabled` - Enable/disable automatic moderation
-   `auto_mod_level` - Set moderation sensitivity (1-5 scale)
-   `moderator_role` - Assign mental health moderator role
-   `system_role` - Role automatically assigned to new members

#### `/guildsettings general`

Configure general server preferences.

**Options:**

-   `language` - Set default server language (English, Spanish, French, German)

**Permission Requirements:**

-   Server Administrator or Manage Guild permissions required
-   Changes are logged to audit channels when configured

---

### `/twitter`

Manage Twitter/X social media integration and posting (Owner/Admin only).

**Usage:** `/twitter <subcommand>`

**Subcommands:**

#### `/twitter post`

Post content to your connected Twitter/X account.

**Options:**

-   `type` (required) - Content type:
    -   **Daily Tip** - AI-generated mental health tips
    -   **Weekly Update** - Community highlights and progress
    -   **Awareness Post** - Educational mental health content
    -   **Crisis Resources** - Support resources and helplines
    -   **Custom Content** - Manual content input
-   `content` (optional) - Custom text for manual posts (240 chars max)
-   `topic` (optional) - Specific topic focus for AI-generated content

#### `/twitter status`

Check Twitter service connection, configuration, and daily statistics.

**Information Displayed:**
-   Connection status and authenticated username
-   Service configuration (posting enabled, limits, cooldowns)
-   Content type settings (daily tips, weekly updates, etc.)
-   Today's posting statistics and limits

#### `/twitter schedule`

Manage automated posting schedules.

**Actions:**
-   `view` - Show current scheduled posting configuration
-   `start` - Enable automatic posting according to configuration
-   `stop` - Disable all automatic posting

**Features:**
-   **Automated Daily Tips** - Morning mental health tips
-   **Weekly Updates** - Regular community and progress updates
-   **Smart Rate Limiting** - Prevents spam and respects Twitter limits
-   **Content Moderation** - Automatic filtering of inappropriate content

**Permission Requirements:**
-   OWNER or ADMIN role in Mellow system required
-   Twitter/X API credentials must be configured
-   See [Twitter Integration Guide]({{ site.baseurl }}/technical/twitter-integration/) for setup

**Example Usage:**
```
/twitter post type:dailyTip topic:"mindfulness techniques"
/twitter post type:custom content:"🌟 Mellow is here to support your mental health journey!"
/twitter status
/twitter schedule action:start
```

---

### `/mod`

Moderation tools for server management.

**Subcommands:**

-   `/mod timeout [user] [duration] [reason]` - Timeout user
-   `/mod untimeout [user]` - Remove timeout
-   `/mod ban [user] [reason]` - Ban user from server
-   `/mod unban [user]` - Remove server ban
-   `/mod role add [user] [role]` - Assign role
-   `/mod role remove [user] [role]` - Remove role
-   `/mod logs [user] [limit]` - View moderation logs

**Features:**

-   Complete moderation action logging
-   Reason tracking and history
-   User-specific log filtering
-   Audit trail maintenance

---

### `/guildcontext`

View server-level conversation context statistics for administrators.

**Usage:** `/guildcontext`

**Admin-Only Features:**

-   **Guild Message Context:** Total messages, user messages, AI responses, channels involved
-   **Activity Breakdown:** Recent activity (24h, 7 days), context types, direct conversations
-   **Privacy Settings:** Context logging status, individual opt-outs respected, data retention info
-   **Privacy Information:** Clear transparency about what data is tracked (counts only, not content)

**Permission Requirements:**

-   Server Administrator or Manage Guild permissions required
-   Displays server-wide context statistics while respecting individual privacy
-   Shows notification if guild context logging is disabled

**Privacy Note:** Only shows message counts and statistics - never actual message content. Respects both server-wide and individual user privacy settings.

## 📚 Information & Help

### `/help`

Display command help and information.

**Usage:** `/help [command] [private]`

**Options:**

-   `command` - Specific command for detailed info
-   `private` - Send response privately (default: true)

**Features:**

-   Categorized command listing
-   Detailed command information
-   Usage examples and syntax
-   Permission requirements

---

### `/about`

Learn about Mellow's mission and capabilities.

**Usage:** `/about`

**Information:**

-   Project mission and goals
-   Mental health philosophy
-   Open source details
-   Important disclaimers
-   Contact information

---

### `/stats`

View Mellow community statistics and impact metrics.

**Usage:** `/stats`

**Enhanced Features:**

-   **Community Reach:** Server counts, user base, total conversations, feedback received
-   **Mental Health Support:** Mood check-ins, coping tools used, ghost letters, gratitude entries
-   **Recent Activity:** 30-day activity breakdown and engagement trends
-   **Safety & Moderation:** Reports handled, crisis interventions, privacy compliance

**Visual Display:** Rich embed with organized metrics and community impact visualization

---

### `/status`

Get comprehensive system status and performance metrics.

**Usage:** `/status`

**Enhanced Metrics:**

-   **System Performance:** Real-time status indicators, uptime, memory usage, latency
-   **Connection Status:** Server count, user count, shard information, loaded commands
-   **AI Service Status:** AI performance metrics and health indicators
-   **Privacy & Safety:** Status of context logging, crisis detection, privacy controls

**Features:**

-   Color-coded status indicators (🟢 Excellent, 🟡 Good, 🔴 Monitoring)
-   Performance alerts for high-load situations
-   Fallback status display if detailed metrics are unavailable

---

## 🔧 Technical Commands & Diagnostics

### `/health`

Quick system health check - verify all core services and components are operational.

**Usage:** `/health`

**Health Checks:**

-   **Discord Connection:** Latency and connection readiness
-   **Database:** Query performance and connectivity status
-   **AI Service:** Service availability and error rates
-   **Memory Usage:** Process memory analysis and health
-   **System Logger:** Configuration and operational status
-   **Commands:** Registry completeness and loading status

**Features:**

-   Overall health assessment (healthy/degraded/unhealthy)
-   Component-specific health indicators
-   Performance recommendations for issues
-   Quick action suggestions
-   Emergency fallback response if health check fails

---

### `/metrics`

View detailed performance metrics, analytics, and system resource usage.

**Usage:** `/metrics`

**Comprehensive Analytics:**

-   **Performance Overview:** Overall status, uptime, response time, error rate
-   **Connection Metrics:** Discord latency, database query time, server/user counts
-   **Memory Usage:** Process memory, heap usage, system memory percentages
-   **System Resources:** CPU usage, system load, available/total memory
-   **Performance Analytics:** Commands loaded, database records, cache efficiency

**Smart Features:**

-   Performance alerts for high resource usage
-   Optimization suggestions based on current metrics
-   Real-time status indicators and color coding
-   Fallback metrics for error scenarios

---

### `/debug` (Owner Only)

Advanced debugging tools for system diagnostics and troubleshooting.

**Usage:** `/debug <subcommand>`

**Subcommands:**

-   **`database`** - Test database connectivity and performance
-   **`ai`** - Diagnose AI service health and performance
-   **`commands`** - Inspect command registry and loading status
-   **`logs`** - View recent error logs and system events
-   **`memory`** - Detailed memory usage analysis and GC info
-   **`performance`** - Performance profiling and bottleneck analysis

**Owner-Only Features:**

-   Deep system diagnostics and sensitive performance data
-   Detailed error logs and debugging information
-   Memory analysis and garbage collection recommendations
-   Performance bottleneck identification and suggestions

---

### `/guilddebug`

Comprehensive guild debugging and support request system for troubleshooting and team assistance.

**Usage:** `/guilddebug <subcommand>`

**Available to All Guild Admins:**

-   **`request-support`** - Request help from the Mellow support team

**Available to Mellow Team Only:**

-   **`diagnostics`** - Run comprehensive guild health diagnostics
-   **`settings`** - View detailed guild configuration and settings
-   **`logs`** - Review recent guild-specific system logs
-   **`database`** - Check guild database health and statistics

#### Support Request (`/guilddebug request-support`)

**Parameters:**
-   `issue` (required) - Brief description of the problem (max 1000 chars)
-   `severity` (required) - Issue severity level:
    -   🔴 **Critical** - Bot completely broken (2-4 hour response)
    -   🟡 **High** - Major features not working (8-12 hour response)
    -   🟢 **Medium** - Some features affected (24-48 hour response)
    -   🔵 **Low** - Minor issues or questions (2-5 day response)
-   `contact` (optional) - How to contact you for follow-up

**Features:**
-   Automatic routing to support team
-   Thread creation for request tracking
-   Severity-based response time commitments
-   Integration with external support systems

**Example:**
```
/guilddebug request-support issue:"Crisis alerts not working" severity:critical contact:"admin@example.com"
```

#### Diagnostic Tools (Team Only)

**System Health Diagnostics:**
-   Guild overview and basic information
-   Bot permission and access verification
-   Channel configuration health checks
-   Recent activity and feature usage statistics
-   Database connectivity and performance metrics

**Detailed Configuration Review:**
-   Complete guild settings and feature flags
-   Channel and role configuration validation
-   Moderation and automation settings
-   Performance and resource usage analysis

**For detailed usage, see:** [Guild Debug Documentation](./guilddebug-command.html)

---

### `/source`

Open source project information and repository links.

**Usage:** `/source`

**Includes:**

-   GitHub repository links
-   License information (AGPL-3.0)
-   Contributing guidelines
-   Project features overview
-   Development information

---

### `/context`

View your AI conversation context, understand how conversation summaries work, and see how your chat history personalizes support.

**Usage:** `/context [details:true/false]`

**Options:**

-   `details` (optional) - Show detailed information about context types and how they work

**Features:**

#### Standard View (`/context`)

-   **Total Conversation History:** Your messages, AI responses, and data storage status
-   **Active Context Memory:** Current messages I remember for ongoing conversations
-   **Context Types Breakdown:** Conversation, channel context, system notes, and advanced features
-   **Context Analysis & Summary:** Conversation summary status, history timeline, and memory effectiveness
-   **Smart Tips:** Suggestions for getting better personalized support

#### Detailed View (`/context details:true`)

-   **Context Types & How They Work:** Detailed breakdown of conversation, channel, and system context with purposes and retention
-   **Conversation Summaries Explained:** How smart compression, pattern recognition, and context preservation work
-   **Context Processing & AI Memory:** Recent memory, context blending, adaptive learning, and crisis detection
-   **Advanced Context Features:** Crisis, therapeutic, and moderation context when available
-   **Privacy & Data Control:** Complete privacy controls and data management options

**Context Types:**

-   **Conversation Context:** Direct messages between you and Mellow (90-day retention)
-   **Channel Context:** Recent server messages that help understand ongoing discussions (90-day retention)
-   **System Context:** Internal notes about preferences and interaction patterns (extended retention)
-   **Crisis Context:** Safety intervention and support patterns (when applicable)
-   **Therapeutic Context:** Coping tool usage and therapeutic insights (when applicable)
-   **Moderation Context:** Administrative interactions and warnings (when applicable)

**How Conversation Summaries Work:**

-   **Smart Compression:** Long conversations are intelligently summarized to preserve key information
-   **Pattern Recognition:** Identifies important themes, mood patterns, and coping strategies
-   **Memory Efficiency:** Allows remembering more history without overwhelming detail
-   **Context Preservation:** Maintains emotional context and ongoing situations

**Privacy Note:** Only shows data when context logging is enabled in your preferences. Use `/preferences update context_logging:true` to enable context logging for better personalized support.

---

### `/timemode`

Check what time-based companion mode is currently active for you.

**Usage:** `/timemode`

**Features:**

-   **Late-Night Mode (10 PM - 6 AM):** Extra gentle, calming responses with sleep-friendly suggestions
-   **Early Morning Mode (6 AM - 10 AM):** Gentle encouragement and morning support
-   **Evening Wind-Down Mode (8 PM - 10 PM):** Calming, reflective responses for day's end
-   **Standard Mode:** Regular supportive interactions

**Automatic Activation:** Based on your timezone preference set in `/preferences`

## ---

### `/version`

View version information, changelogs, and repository details.

**Usage:** `/version [subcommand] [options]`

**Subcommands:**

#### `/version current`

Display current version information and update status.

**Example:** `/version current`

#### `/version latest`

Check for updates and show the latest release information.

**Example:** `/version latest`

#### `/version changelog`

View changelog for a specific version or list all available versions. Changelogs are sourced primarily from GitHub release descriptions, with fallback to repository markdown files.

**Options:**

-   `version` - Specific version to view (e.g., "1.1.0") - Optional

**Examples:**

-   `/version changelog` - List all available versions
-   `/version changelog version:1.1.0` - View changelog for v1.1.0

**Features:**

-   Changelogs sourced from GitHub release descriptions
-   Full release information including publish dates and links
-   Automatic version normalization (works with or without 'v' prefix)
-   Fallback to markdown files when GitHub releases unavailable

#### `/version releases`

View recent releases from the repository.

**Options:**

-   `count` - Number of releases to show (1-10, default: 5) - Optional

**Example:** `/version releases count:10`

#### `/version repo`

View repository information including stats, contributors, and recent commits.

**Example:** `/version repo`

**Features:**

-   Real-time version checking and update notifications
-   Changelogs sourced directly from GitHub release descriptions
-   Automatic fallback to repository markdown files
-   Direct links to GitHub releases and repository
-   Repository statistics and contributor insights
-   Recent commit history and development activity
-   Recent commit history
-   Contributor information

## Command Permissions

### User Commands

All mental health, coping, and information commands are available to all users.

### Moderator Commands

-   `/mod` - Requires Discord permissions or Mellow moderator role
-   Crisis alert responses - Automatic for designated moderators

### Admin Commands

-   `/guildsettings` - Server administrators only
-   Private admin commands - Mellow admin role required

## Usage Tips

### Best Practices

1. **Regular Check-ins** - Use `/checkin` consistently for better insights
2. **Explore Tools** - Try different coping techniques with `/coping`
3. **Customize Experience** - Set preferences that work for you
4. **Privacy First** - Use ghost letters for sensitive thoughts
5. **Seek Help** - Use `/support` when professional help is needed

### Getting Started

1. Start with `/help` to explore available commands
2. Configure `/preferences` for your needs
3. Try your first `/checkin` to begin tracking
4. Explore `/coping` tools for emotional support
5. Set up `/toolbox` with your favorite techniques

### Crisis Situations

-   Mellow automatically detects distress in messages
-   Use `/support` for immediate crisis resources
-   Contact emergency services for life-threatening situations
-   Remember: Mellow is support, not professional treatment

---

_For more detailed information, see the full documentation or join our support server._
