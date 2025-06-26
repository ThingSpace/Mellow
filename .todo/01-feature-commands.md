# 01: Scaffold Feature Commands/Handlers

## Goal

Implement commands and handlers for Mellow's unique features.

## Steps

-   [x] Emotional Check-Ins
    -   [x] Scaffold `/checkin` command
    -   [x] Implement mood tracking database logic
    -   [x] Add gentle prompt/response flow
    -   [x] Add structured mood options with emojis
    -   [x] Add intensity tracking (1-5 scale)
    -   [x] Add activity tracking
    -   [x] Add next check-in time calculation
    -   [x] Create `/preferences` command for reminder settings
    -   [x] Create `/insights` command for mood analysis
    -   [x] Implement ReminderTool service for automated reminders
-   [x] Ghost Letter Mode
    -   [x] Scaffold `/ghostletter` command
    -   [x] Implement private message storage
    -   [x] Add safe venting/clearing logic
-   [x] Coping Tools & Prompts
    -   [x] Scaffold `/coping` command
    -   [x] Implement toolbox logic (grounding, breathing, etc.)
    -   [x] Create CopingTool service for AI-powered suggestions
    -   [ ] **[PLANNED] Enhanced AI-powered coping tools and personalized suggestions**
-   [x] Crisis Routing
    -   [x] Implement distress keyword detection
    -   [x] Scaffold mod alert/help suggestion logic
    -   [x] AI-powered crisis detection and escalation
-   [x] Late-Night Companion Mode
    -   [ ] Implement night-time presence/response logic
    -   [ ] **[PLANNED] AI-powered late-night support and check-ins**
-   [x] Moderation Capabilities
    -   [x] Scaffold `/mod` command group
    -   [x] Implement user mute/ban/unban commands
    -   [x] Implement role assignment/removal commands
    -   [x] Implement view/delete logs command
    -   [x] Add mod-only permission checks (in interaction handler)
    -   [x] Auto-assign role when a user joins the guild
    -   [x] Implement moderation action logging (ModAction)

## Additional Items to Add

-   [x] Update AI config to use "Mellow" branding instead of "Thing Talk"
-   [x] Create `/checkin` command with mood tracking
-   [x] Create `/ghostletter` command with private storage
-   [x] Create `/coping` command with tools library
-   [ ] Implement crisis detection in message handler
-   [ ] Add late-night mode detection and responses
-   [x] Update help command to reflect new bot name
-   [x] Update message handler to use "Mellow" branding
-   [x] Create moderation command group (`/mod`)
-   [x] Fix profile command to work with current database schema
-   [x] Remove references to non-existent database fields in profile command
-   [x] Implement dual permission system (Discord permissions + DB roles)
-   [x] Implement admin/mod private commands for user/guild/modaction management
-   [x] **Mood trends & insights (AI-powered feedback on user check-ins)**
    -   [x] Create `/insights` command with timeframe analysis
    -   [x] Implement mood distribution analysis
    -   [x] Add intensity tracking and averages
    -   [x] Add activity variety tracking
    -   [x] Create visual mood representation with emojis
-   [ ] **[DISCUSSION] Community/peer support features (opt-in, AI-moderated)**

## Recently Completed Features

-   [x] Enhanced Mood Check-In System
    -   [x] Structured mood choices with emojis (happy, calm, sad, anxious, etc.)
    -   [x] Intensity scale (1-5) for mood strength
    -   [x] Activity tracking for context
    -   [x] Next check-in time calculation based on user preferences
    -   [x] Enhanced history display with emojis and intensity ratings
-   [x] User Preferences System
    -   [x] `/preferences` command for managing check-in intervals
    -   [x] UserPreferences database model
    -   [x] Configurable reminder intervals (1-72 hours)
    -   [x] Current settings display
-   [x] Automated Reminder System
    -   [x] ReminderTool service with 5-minute check intervals
    -   [x] DM notifications for due check-ins
    -   [x] Error handling for failed notifications
    -   [x] Next check-in time updates
-   [x] Mood Insights & Analytics
    -   [x] `/insights` command with timeframe options (week, month, all-time)
    -   [x] Mood distribution analysis with percentages
    -   [x] Average intensity calculations
    -   [x] Activity variety tracking
    -   [x] Most frequent mood identification
    -   [x] Visual representation with emojis

## Currently Implemented Commands

-   [x] `/help` - Basic help command
-   [x] `/invite` - Bot invite link
-   [x] `/status` - Bot status
-   [x] `/profile` - User profile
-   [x] `/checkin` - Enhanced mood check-in with structured options
-   [x] `/preferences` - Check-in reminder settings
-   [x] `/insights` - Mood analysis and trends
-   [x] `/ghostletter` - Private venting
-   [x] `/coping` - Coping tools
-   [x] `/mod` - Moderation (mute, ban, unban, role, logs)
-   [x] `/guild` (private) - Guild management
-   [x] `/user` (private) - User management
-   [x] `/modaction` (private) - Moderation logs

---

**Outcome:**

-   All core Mellow features are accessible via Discord commands and DM interactions.
-   Enhanced mood tracking system with structured data collection and analysis.
-   Automated reminder system for consistent user engagement.
-   Comprehensive mood insights and trend analysis.
-   Moderators and admins have tools to manage the community and the bot safely and effectively.
-   All permissions are robustly enforced via Discord and database roles.
-   **Planned:** Enhanced AI-powered coping, crisis detection, late-night support, and community features.
