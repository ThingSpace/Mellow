---
layout: default
title: Commands
nav_order: 3
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

-   **Check-in Intervals:** 1-72 hours
-   **AI Personality:** supportive, professional, friendly
-   **Theme Colors:** purple, blue, green, pink
-   **Language:** Currently English
-   **Privacy:** Journal visibility settings

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

View bot usage statistics and community metrics.

**Usage:** `/stats`

**Statistics:**

-   Server and user counts
-   Total check-ins processed
-   Coping tools used
-   Community engagement metrics
-   Bot performance data

---

### `/status`

Get current bot performance and system status.

**Usage:** `/status`

**Metrics:**

-   System performance indicators
-   AI service status
-   Database connectivity
-   Response time metrics
-   Error rates and uptime

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
