# Changelog

All notable changes to Mellow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-07-01 - Enhanced Context & Privacy Controls

### 🎯 Major Features

#### Advanced Context & Privacy System
- **Added**: Comprehensive user and guild context logging with privacy-first design
- **Added**: User privacy controls for context logging (`/preferences` → privacy settings)
- **Added**: Guild-level context tracking with privacy-respecting statistics
- **Added**: `/guildcontext` command for server administrators to view guild interaction statistics
- **Enhanced**: `/context` command now shows privacy-respecting conversation counts only
- **Added**: Detailed privacy controls documentation (`docs/privacy-controls.md`)

#### Late Night Companion Mode
- **Added**: Automatic late night companion mode (10 PM - 6 AM) using user timezone preferences
- **Enhanced**: AI responses are more gentle, supportive, and crisis-aware during late hours
- **Added**: Timezone-based behavioral adaptations for better user support

#### Expanded Timezone Support
- **Added**: Comprehensive timezone support including Canadian provinces and global cities
- **Enhanced**: User preferences now support 50+ timezone options
- **Improved**: Timezone selection interface with better organization and search

#### Enhanced Owner & Admin Tools
- **Added**: `/tools` owner command for system reload, sync, and status operations
- **Enhanced**: `/stats` command with rich embeds, detailed metrics, and privacy indicators
- **Enhanced**: `/status` command with comprehensive system health monitoring
- **Added**: Real-time system performance metrics and safety feature status
- **Improved**: Error handling and user feedback across all admin commands

#### GitHub Integration & Version Management
- **Added**: Comprehensive `/version` command with GitHub integration
- **Added**: Real-time version checking and update notifications
- **Added**: Changelog viewing directly from Discord (`/version changelog`)
- **Enhanced**: Changelogs sourced from GitHub release descriptions with markdown fallback
- **Added**: Repository statistics and contributor information (`/version repo`)
- **Added**: Recent releases browser (`/version releases`)
- **Added**: GitHub API client for repository management
- **Added**: Version handler for organized code structure
- **Improved**: Version normalization and error handling for changelog retrieval

### ✨ Features & Improvements

#### Command System Enhancements
- **Refactored**: Owner commands moved to `/tools` with proper access control
- **Enhanced**: User context commands with privacy-first display options
- **Added**: Guild context statistics for community engagement insights
- **Improved**: All info commands now use rich embeds with better formatting
- **Added**: Comprehensive error handling and user-friendly error messages
- **Added**: Version management system with GitHub integration
- **Created**: Handler pattern for complex command operations (version handler)

#### AI & Context Intelligence
- **Enhanced**: AI context building with increased limits (4000 → 6000 characters)
- **Improved**: Context retrieval logic for better conversation continuity
- **Added**: Privacy-aware context processing that respects user preferences
- **Enhanced**: Late night mode AI responses with specialized prompts and safety focus

#### Documentation & Developer Experience
- **Added**: Implementation summary documentation (`docs/implementation-summary.md`)
- **Updated**: Command documentation with all new features (`docs/commands.md`)
- **Enhanced**: API documentation with privacy and context features
- **Improved**: Getting started guide with privacy control explanations
- **Added**: Troubleshooting guide updates for new features

### 🛠️ Technical Improvements

#### Database & Performance
- **Enhanced**: Conversation history module with privacy controls
- **Improved**: Guild data management with context tracking
- **Added**: Efficient context retrieval algorithms
- **Enhanced**: Message history service with privacy filtering
- **Optimized**: Database queries for better performance

#### Code Quality & Maintenance
- **Fixed**: JSON import compatibility for Node.js v22+
- **Improved**: Error handling across all new features
- **Enhanced**: Code organization and modularity
- **Added**: Comprehensive logging for debugging and monitoring
- **Standardized**: Command structure and response patterns
- **Refactored**: Version command with proper handler pattern
- **Added**: GitHub API client for external integrations
- **Improved**: File structure and separation of concerns

#### Privacy & Security
- **Implemented**: User-controlled privacy settings for all context features
- **Added**: Guild-level privacy controls for community features
- **Enhanced**: Data retention policies with user control
- **Improved**: Audit logging for privacy-sensitive operations

### 🐛 Bug Fixes

- **Fixed**: Export syntax error in user context command
- **Fixed**: JSON import issues for Node.js v22+ compatibility
- **Fixed**: Context command display formatting and privacy language
- **Fixed**: Stats and status command error handling
- **Fixed**: Timezone preference validation and storage
- **Fixed**: Guild context retrieval and display issues
- **Fixed**: Version command code corruption and duplicate functions
- **Fixed**: GitHub client integration and error handling
- **Fixed**: Changelog retrieval now uses GitHub release bodies as primary source
- **Fixed**: Inconsistency between release data and changelog sources

### 📚 Documentation Updates

- **Added**: Privacy controls comprehensive guide
- **Updated**: Commands documentation with new features
- **Enhanced**: API documentation with context and privacy features
- **Improved**: Getting started guide with privacy setup
- **Added**: Implementation summary for developers
- **Updated**: Troubleshooting guide with new feature support

---

## [1.0.3] - 2025-06-27 - Coping Plan & Toolbox AI Improvements

### ✨ Features & Improvements

- **Added:** `goal` option to `/plan suggest` and `/toolbox suggest` for more personalized AI suggestions.
- **Improved:** AI suggestion logic now gathers user context (mood, trends, favorites) internally for more accurate recommendations.
- **Refactored:** All coping and moderation commands now use `switch` statements for subcommand handling, improving maintainability.
- **Fixed:** All upsert and create operations now properly handle required fields (e.g., usernames for users).
- **Improved:** Database calls in AI suggestion logic are now self-contained, reducing boilerplate and improving maintainability.
- **Updated:** `/plan` and `/toolbox` commands to pass the new `goal` option to the AI service.
- **Improved:** Error handling and logging in coping commands and AI service.
- **Refactored:** Consistent use of `BigInt` for all Discord IDs in database operations.

### 🛠️ Technical

- **Refactored:** Modularized and clarified command logic for coping plan and toolbox features.
- **Improved:** Documentation and code comments for maintainability.
- **Updated:** Prisma schema and database modules to ensure type safety and required fields.

### 🐛 Bug Fixes

- Fixed: Prisma upsert errors due to missing required fields (e.g., username).
- Fixed: Toolbox and plan commands now correctly handle AI suggestion context and options.
- Fixed: Minor error handling and logging issues in coping commands.

---

## [1.0.2] - 2025-06-27 - System Logging & Coping Tools Update

### 🔧 Features Added

#### System Logging Integration
- **Added**: Comprehensive system logging throughout the application
- **Added**: Command usage tracking with success/failure status
- **Added**: Guild settings update logging
- **Added**: Crisis event logging for system administrators
- **Added**: Moderation action logging
- **Added**: User preference change tracking
- **Added**: Coping tool usage and management logging

#### Enhanced Coping Tools
- **Added**: `/toolbox` command for managing favorite coping tools
- **Added**: `/support` command with comprehensive crisis resources
- **Added**: `/streaks` command for coping tool usage tracking
- **Added**: `/plan` command for personalized coping plans
- **Added**: `/music` command for calming music suggestions
- **Added**: System logger integration across all coping commands

#### Profile & Preferences Improvements
- **Fixed**: Profile command database queries to use correct methods
- **Fixed**: Preferences command code corruption and syntax errors
- **Enhanced**: Profile display with comprehensive mental health journey tracking
- **Added**: System logging for profile access and preference changes

### 🐛 Bug Fixes

- Fixed profile command database query issues that caused crashes
- Fixed syntax errors and code corruption in preferences command
- Fixed duplicate function declarations in moderation tools
- Fixed missing system logger integration in various commands
- Fixed database method references in profile statistics

### 🛠️ Technical Changes

#### System Integration
- **Added**: System logger integration across all command categories
- **Added**: Comprehensive error logging and tracking
- **Added**: User activity and engagement monitoring
- **Enhanced**: Database operation logging and debugging

---

## [1.0.1] - 2025-06-27 - Critical Patch Release

### 🚨 Critical Fixes

#### Discord.js v14 Compatibility
- **Fixed**: Updated all permission checks to use `PermissionFlagsBits` enum instead of deprecated string names
- **Fixed**: Resolved `BitFieldInvalid` errors that were breaking commands with permission requirements
- **Impact**: Commands with permission requirements now work properly

#### Interaction Handling
- **Fixed**: Removed duplicate interaction reply attempts that caused "Interaction has already been acknowledged" errors
- **Fixed**: Simplified error handling to only reply if interaction hasn't been replied to yet
- **Impact**: All commands now execute without interaction errors

#### Performance Improvements
- **Fixed**: Removed unnecessary `deferReply()` calls from commands that can respond immediately
- **Fixed**: Improved command response times for simple operations
- **Impact**: Faster user experience for most commands

### 🔧 Features Added

#### Comprehensive Guild Settings
- **Added**: Complete guild configuration system with `/guildsettings` command
- **Added**: Channel configuration for crisis alerts, moderation logs, check-ins, coping tools, system notifications, and audit logs
- **Added**: Feature toggles for check-ins, ghost letters, crisis alerts, and system logs
- **Added**: Auto-moderation configuration with sensitivity levels (1-5)
- **Added**: Role assignment for moderators and system roles
- **Added**: Language preference settings

#### Guild Settings Compliance
- **Added**: Auto-moderation now respects guild-specific settings (`autoModEnabled`, `autoModLevel`)
- **Added**: Crisis detection respects guild `enableCrisisAlerts` setting
- **Added**: Check-in reminders respect guild `enableCheckIns` setting
- **Added**: All features now check guild preferences before executing

### 🎯 Improvements

#### Channel Purpose Clarity
- **Changed**: Clarified that "Crisis Alert Channel" (`modAlertChannelId`) is specifically for mental health crisis situations
- **Changed**: Distinguished between crisis alerts and routine moderation logs
- **Changed**: Updated all user-facing descriptions to reflect proper channel purposes

#### Code Quality
- **Fixed**: Removed duplicated functions in `moderationTool.js`
- **Fixed**: Corrected malformed `guildSettings.js` file with proper formatting
- **Fixed**: Removed unnecessary fallback values in guild database module
- **Fixed**: Eliminated duplicate startup notification logic in client ready event

#### Database Operations
- **Improved**: Guild upsert operations now require proper guild name and owner ID
- **Improved**: Streamlined database field mappings for guild settings
- **Added**: Debug logging for guild settings updates and retrievals

### 🛠️ Technical Changes

#### Permission System
- **Updated**: All commands using `requiredPerms` now use `PermissionFlagsBits` enum values
- **Updated**: Interaction handler properly converts and validates Discord permissions
- **Files**: `moderationHandler.js`, `events/interactions/create.js`, various command files

#### Error Handling
- **Improved**: Simplified interaction error responses
- **Removed**: Redundant deferred reply checks that caused double-reply errors
- **Files**: `events/interactions/create.js`

#### Guild Management
- **Enhanced**: Complete guild settings interface with organized subcommands
- **Enhanced**: Real-time guild preference checking throughout the application
- **Files**: `commands/slash/guild/guildSettings.js`, `functions/moderationHandler.js`, `services/tools/crisisTool.js`

### 🐛 Bug Fixes

- Fixed permission validation errors across all commands
- Fixed interaction acknowledgment conflicts
- Fixed guild settings not saving correctly
- Fixed duplicate startup notifications
- Fixed malformed code in guild settings command
- Fixed incorrect channel field mappings

---

## [1.0.0] - 2025-06-20 - Initial Release

### 🎉 Initial Features

- AI-powered mental health companion
- Mood check-ins and tracking
- Crisis detection and intervention
- Ghost letter private venting
- Coping tools and resources
- Community moderation features
- User preference management
- Comprehensive database schema

---

**Note**: This changelog follows semantic versioning. Version numbers indicate:
- **Major**: Breaking changes
- **Minor**: New features (backward compatible)  
- **Patch**: Bug fixes (backward compatible)
