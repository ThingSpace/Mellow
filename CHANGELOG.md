# Changelog

All notable changes to Mellow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
