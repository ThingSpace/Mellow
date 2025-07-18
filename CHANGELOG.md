# Changelog

All notable changes to Mellow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.2] - 2025-07-15

### ✨ Interactive Features & Game Improvements

#### Word Games Enhancement

-   **Added**: New `/wordgame` command with multiple game types (association, rhyme, puzzle, positive)
-   **Added**: Difficulty levels for word games (easy, medium, hard)
-   **Added**: Interactive "Play Again" button for continuous engagement
-   **Enhanced**: AI-powered answer evaluation with encouraging feedback
-   **Fixed**: Game state tracking with proper cleanup to prevent memory leaks

#### Would You Rather Command

-   **Added**: New `/wouldyourather` command with various topic categories
-   **Added**: Interactive voting buttons with real-time vote tracking
-   **Added**: "New Question" button for continuous engagement
-   **Enhanced**: AI-generated questions tailored to selected categories
-   **Fixed**: Question ID tracking for proper vote attribution

### 🛠️ Technical Improvements

-   **Enhanced**: Game state management with Map objects for tracking games and votes
-   **Improved**: Initialization process with proper error handling
-   **Added**: Support for Discord's updated interaction patterns
-   **Fixed**: Button and modal handling for interactive games
-   **Enhanced**: Error handling and fallbacks for all interactive features
-   **Added**: Game tracking state initialization in client ready event
-   **Added**: Comprehensive logging for game state events
-   **Fixed**: Reaction collector issues with modern Discord.js API

### 🐛 Bug Fixes

-   **Fixed**: Response handling for interactive components
-   **Fixed**: Game state tracking and cleanup
-   **Fixed**: Interaction reply ephemeral settings for better user experience
-   **Fixed**: Vote tracking for would-you-rather questions
-   **Fixed**: Timeout handling for game sessions

---

## [1.3.1] - 2025-07-10

### ✨ Improved User Experience

#### Interactive Commands Enhancement

-   **Improved**: `/trivia` command now uses Discord buttons instead of reactions for better interaction.
-   **Added**: Message collector fallback for environments where buttons don't work correctly.
-   **Enhanced**: Better error handling and user feedback for interactive commands.

#### Timezone Handling Robustness

-   **Improved**: Even more robust timezone validation with explicit numeric detection and warning.
-   **Enhanced**: Comprehensive timezone error logging for easier troubleshooting.
-   **Fixed**: Edge cases where timezone values were improperly handled.

#### Command Reliability

-   **Fixed**: Reaction-based collectors that weren't working reliably on some Discord clients.
-   **Enhanced**: Interaction pattern updated to modern Discord.js standards.
-   **Improved**: Fallback mechanisms when primary interaction methods fail.

### 🛠️ Technical Improvements

-   **Refactored**: Fun commands to use more reliable interaction patterns.
-   **Enhanced**: Command debugging information for easier troubleshooting.
-   **Added**: Comprehensive timezone validation and error logging.
-   **Updated**: Command documentation and examples to reflect new interaction patterns.
-   **Improved**: Error messages for better user guidance when issues occur.

## [1.3.0] - 2025-07-04

### ✨ Major Features & Improvements

#### Fun & Wellness Commands

-   **Added**: `/memegen` command for AI-powered meme generation with template selection, mood, and mental health focus.
-   **Added**: `/wouldyourather`, `/wordgame`, `/trivia`, `/joke`, `/compliment` commands for engaging, supportive, and fun interactions.
-   **Enhanced**: All fun commands use AI for creative, context-aware content and provide fallback options if AI is unavailable.

#### Conversation Context & AI

-   **Improved**: Context analysis for DMs and channels, including detection of support-seeking, venting, gratitude, and repeated greetings.
-   **Enhanced**: Smarter DM response logic with anti-repetition, first-time user handling, and context-aware personality adaptation.
-   **Improved**: AI prompt building for more natural, less repetitive, and more empathetic responses.
-   **Added**: Conversation summary and memory effectiveness improvements for context commands.

#### Timezone & User Preferences

-   **Fixed**: Timezone handling now strictly uses IANA timezone identifiers (e.g., `America/Edmonton`), preventing numeric/timezone confusion.
-   **Improved**: Time helper functions robustly validate and handle timezones, preventing accidental fallback to system time.
-   **Fixed**: No more "timezone is 18" or numeric timezone bugs.
-   **Improved**: All time-based greetings, sleep suggestions, and companion modes now work reliably for all users.

#### Meme Generation

-   **Added**: ImgFlip API integration for meme images with text overlays (requires credentials).
-   **Added**: Fallback to memegen.link and template images if ImgFlip is unavailable.
-   **Improved**: Meme command displays both generated image and AI-generated meme text.

#### Error Handling & Logging

-   **Enhanced**: All commands and services now use consistent error handling and system logger integration.
-   **Improved**: Fallback responses for all fun and coping commands if AI or external services fail.

#### Technical & Database

-   **Fixed**: Database modules consistently handle Discord IDs as strings, preventing BigInt/number conversion issues.
-   **Improved**: User preferences and upsert logic for timezone and other fields.
-   **Fixed**: Prisma upsert and update operations for user preferences and context.
-   **Enhanced**: Database modules with better validation and error handling.

### 📝 Documentation

-   **Updated**: Command reference and technical documentation to cover all new features, fun commands, context logic, and self-hosting.
-   **Added**: Guides for contributing, debugging, and advanced configuration.

---

## [1.2.0] - 2025-07-03 - System Reliability & Service Infrastructure Improvements

### 🛠️ Major Infrastructure Improvements

#### Support Service Implementation

-   **Added**: Complete support service infrastructure (`src/services/support.service.js`)
-   **Added**: Support request handling and ticket management system
-   **Added**: Automated support routing and categorization
-   **Added**: Integration with guild debug system for comprehensive user assistance

#### Twitter Service Integration

-   **Added**: Full Twitter service implementation (`src/services/twitter.service.js`)
-   **Added**: Automated posting capabilities and content management
-   **Added**: Tweet scheduling and engagement tracking
-   **Added**: Service health monitoring and error recovery
-   **Fixed**: Service initialization moved to client class for proper dependency management

#### Guild Debug Command System

-   **Added**: `/guilddebug` command with comprehensive diagnostic capabilities
-   **Added**: Guild diagnostics with health checks and performance metrics
-   **Added**: System logs viewing and filtering by log type
-   **Added**: Database health monitoring and statistics
-   **Added**: Support request submission for users and administrators
-   **Added**: `/guilddebug join-guild` subcommand for staff to generate guild invites
-   **Enhanced**: Real-time guild configuration viewing and validation
-   **Fixed**: Redundant guild validation logic causing "guild not found" errors
-   **Simplified**: Guild ID handling with proper fallback to current guild
-   **Enhanced**: Error handling and graceful degradation for guild operations

#### Guild Settings Command Overhaul

-   **Fixed**: Channel configuration was completely broken - now properly saves all channel settings
-   **Fixed**: Database upsert operations that were failing due to missing required fields
-   **Enhanced**: Feature toggles now work correctly (check-ins, crisis alerts, system logs, context logging)
-   **Fixed**: Moderation settings (auto-mod levels, moderator roles) now save properly
-   **Added**: Comprehensive error handling and user feedback
-   **Improved**: Settings validation and display formatting

### 🔧 System Logger & Database Improvements

#### Persistent System Logging

-   **Added**: `SystemLog` database model for persistent log storage
-   **Added**: `SystemLogModule` with comprehensive query capabilities (`src/database/modules/systemLog.js`)
-   **Enhanced**: SystemLogger now uses database for persistent storage across all log types
-   **Added**: `getGuildLogs()` method for retrieving historical logs by type and guild
-   **Fixed**: All systemLogger methods now properly use `logType` parameter for consistent categorization

#### Command Error Handling Audit

-   **Enhanced**: All commands now use proper systemLogger.logError() with structured error data
-   **Fixed**: Commands that had console.error() now use proper system logging
-   **Added**: Consistent error logging across guild settings, moderation, user commands
-   **Removed**: Debug console.log statements that were polluting logs
-   **Fixed**: `guildsettings` command incorrectly referenced the Database
-   **Fixed**: `breathing` tool/command improperly used the AI Service

#### AI Service & Coping Command Reliability

-   **Fixed**: Critical AI service bug - `this.getModel is not a function` error resolved
-   **Added**: Comprehensive error handling for all coping commands (breathing, grounding, journal, etc.)
-   **Added**: Fallback responses when AI services are unavailable
-   **Enhanced**: All coping commands now gracefully handle AI failures with helpful fallback content
-   **Added**: Proper error logging for AI service failures with context and debugging information

### 🚀 User Experience Improvements

#### Reminder System Reliability

-   **Fixed**: Discord error 50007 (Cannot send messages to this user) now handled gracefully
-   **Added**: Automatic reminder disabling when users have DMs blocked
-   **Added**: User notification in shared guilds when DM reminders fail
-   **Enhanced**: Comprehensive error handling for all reminder delivery methods
-   **Added**: Proper state management for users with failed reminder delivery

#### Crisis Detection Enhancements

-   **Improved**: Crisis detection sensitivity reduced to prevent false positives
-   **Enhanced**: Crisis tool now respects both guild and user privacy settings
-   **Added**: More conservative intervention logic with better threshold management
-   **Fixed**: Crisis detection now properly respects user opt-out preferences

#### DM Experience Improvements

-   **Enhanced**: AI responses in DMs are now less repetitive and more natural
-   **Added**: Bot asks if user wants resources or just wants to talk
-   **Improved**: Coping tool responses in DMs are gentler and less overwhelming
-   **Updated**: System prompts for more varied, empathetic language

### 🐛 Critical Bug Fixes

#### Discord ID Handling & Database Integrity

-   **Fixed**: Critical BigInt/Discord ID conversion bug causing database lookup failures
-   **Added**: Database migration scripts (`scripts/safe-bigint-to-string-migration.sql`) for converting corrupted BigInt IDs to strings
-   **Enhanced**: All Discord IDs now consistently stored and handled as strings throughout the codebase
-   **Created**: Analysis script (`scripts/README.md`) for detecting and fixing corrupted ID data
-   **Updated**: All database modules to use String type for Discord IDs instead of BigInt
-   **Prevented**: Future BigInt/number conversion issues in database operations

#### Guild Management & Command Reliability

-   **Fixed**: `/guilddebug` command redundant guild validation causing failures
-   **Fixed**: Guild ID handling now properly falls back to current guild when specified guild not found
-   **Simplified**: Removed unnecessary guild fetching logic and redundant variables
-   **Enhanced**: Guild debug command now has consistent variable naming and cleaner code flow
-   **Added**: Proper guild module methods integration (`getSettings()`, `exists()`, `updateChannels()`, etc.)
-   **Fixed**: Critical BigInt/Discord ID conversion bug causing database lookup failures
-   **Added**: Database migration scripts for converting corrupted BigInt IDs to strings
-   **Enhanced**: All Discord IDs now consistently stored and handled as strings
-   **Refactored**: `/guilddebug` command to use single `targetGuildId` pattern for cleaner code
-   **Fixed**: Syntax errors and broken command handlers in guilddebug.js

#### Database & Validation

-   **Fixed**: Prisma validation errors for models without `guildId` fields
-   **Fixed**: Database modules now properly handle queries for global vs guild-specific data
-   **Fixed**: Syntax errors in multiple database modules resolved
-   **Enhanced**: Database error handling and validation throughout

#### Service Architecture

-   **Fixed**: Twitter service initialization moved to proper client initialization
-   **Fixed**: Service dependency management and startup order
-   **Fixed**: AI service method calls and error handling
-   **Enhanced**: Service health monitoring and recovery mechanisms

#### Command System

-   **Fixed**: Guild settings channel configuration completely rewritten and functional
-   **Fixed**: System logger usage audit - all commands now provide proper logType parameters
-   **Fixed**: Missing error handling in commands replaced with proper systemLogger calls
-   **Enhanced**: Command reliability and user feedback across all categories
-

### 📚 Documentation Updates

-   **Fixed**: Twitter integration examples now use correct systemLogger methods
-   **Enhanced**: Documentation examples updated to reflect proper API usage
-   **Added**: Error handling examples and best practices

### 🔧 Technical Improvements

-   **Enhanced**: Guild module with comprehensive helper methods (`getSettings()`, `updateChannels()`, `updateRoles()`, `updateFeatures()`, `exists()`, `getBanStatus()`)
-   **Improved**: Database module organization with specialized methods for different operations
-   **Simplified**: Guild debug command architecture with cleaner code and better error handling
-   **Added**: Consistent Discord ID handling as strings throughout the codebase
-   **Enhanced**: Service architecture with proper dependency injection
-   **Improved**: Database module organization and query optimization
-   **Added**: Comprehensive logging for debugging and monitoring
-   **Enhanced**: Error recovery and graceful degradation throughout the system
-   **Improved**: Code organization and separation of concerns

---

## [1.1.1] - 2025-07-01 - Documentation Organization & Context Command Enhancements

### 📚 Documentation Improvements

#### Major Documentation Restructure

-   **Reorganized**: Complete GitHub Pages documentation structure with logical navigation hierarchy
-   **Fixed**: Navigation order conflicts and duplicate nav_order values across all documentation pages
-   **Added**: Comprehensive SEO descriptions and meta tags for better discoverability
-   **Created**: Parent-child documentation structure for technical resources
-   **Added**: Site map page (`docs/sitemap.md`) for comprehensive navigation assistance
-   **Enhanced**: Main index page with improved quick links and user flow
-   **Implemented**: Jekyll collections for guides, reference, and technical documentation

#### Jekyll Collections Implementation

-   **Created**: Three organized collections for better content organization:
    -   **Guides Collection**: Setup, privacy controls, and troubleshooting guides
    -   **Reference Collection**: Commands, features, and API documentation
    -   **Technical Collection**: Developer resources, implementation details, and technical commands
-   **Added**: Collection landing pages with comprehensive navigation and quick access
-   **Enhanced**: Permalink structure for better SEO and user-friendly URLs
-   **Improved**: Cross-collection linking and navigation consistency

#### Technical Documentation Organization

-   **Created**: Technical Documentation parent page (`docs/technical.md`) for developer resources
-   **Reorganized**: AI Features Status, Implementation Summary, and Technical Commands under technical hierarchy
-   **Added**: Proper front matter with descriptions and navigation structure to all technical pages
-   **Enhanced**: Cross-linking between related technical documentation pages
-   **Implemented**: Proper collection structure with organized file hierarchy

#### Enhanced User Experience

-   **Added**: Jekyll plugins for SEO, redirects, and last-modified tracking
-   **Improved**: Search functionality with better content organization
-   **Added**: Redirect support for common URL patterns (`/commands/`, `/reference/`, `/cmd/`)
-   **Enhanced**: Footer and navigation with improved external links
-   **Added**: Social media meta tags and Open Graph integration

### ✨ Context Command Enhancements

#### `/context` Command Major Improvements

-   **Enhanced**: Detailed explanation of how conversation summaries work with smart compression and pattern recognition
-   **Added**: Comprehensive breakdown of all context types including future context features
-   **Improved**: Privacy explanations with step-by-step data control instructions
-   **Added**: Detection and display of advanced context types (crisis, therapeutic, moderation)
-   **Enhanced**: Context analysis with memory effectiveness ratings and personalized tips
-   **Added**: Better explanations of AI memory processing and adaptive learning capabilities

#### Context Types & Documentation

-   **Enhanced**: Context type descriptions with detailed purposes, retention policies, and privacy information
-   **Added**: Support for future context types (crisis, therapeutic, moderation) with proper counting
-   **Improved**: User education about context logging benefits and privacy controls
-   **Added**: Smart tips for users to get better personalized support through context settings

### 🛠️ Technical Improvements

#### Documentation Infrastructure

-   **Added**: Jekyll SEO plugin for improved search engine optimization
-   **Enhanced**: Gemfile with additional useful plugins for documentation features
-   **Improved**: Site configuration with better metadata and social media integration
-   **Added**: Proper permalink structure for important pages (privacy policy, terms of service)
-   **Enhanced**: Navigation structure with callouts and collections support
-   **Updated**: README.md to reflect new collection-based documentation structure
-   **Enhanced**: `/docs` command with organized section links and improved navigation

#### Code Quality

-   **Fixed**: Import statement corruption in context command that was causing module loading issues
-   **Enhanced**: Context command with better error handling and user feedback
-   **Improved**: Documentation consistency across all pages with proper YAML front matter
-   **Added**: Comprehensive descriptions for all documentation pages to improve SEO

### 📋 Navigation Structure

#### Logical Page Organization (New nav_order)

1. **Home** - Main landing page with overview
2. **Getting Started** - Setup and configuration guide
3. **Commands** - Complete command reference
4. **Features Overview** - Comprehensive feature descriptions
5. **Privacy Controls** - Privacy settings and data management
6. **API Reference** - Technical API documentation
7. **Contributing** - Development contribution guide
8. **FAQ** - Frequently asked questions
9. **Troubleshooting** - Support and problem resolution
10. **Change Logs** - Version history and release notes
11. **Technical Documentation** - Developer and advanced resources
12. **AI Features Status** - Implementation status and roadmap
13. **Technical Commands** - Debug and diagnostic tools
14. **Roadmap** - Development plans and future features
15. **Privacy Policy** - Official privacy policy
16. **Terms of Service** - Usage terms and agreement
17. **Site Map** - Complete navigation assistance

### 🔧 User Experience Improvements

#### Better Discoverability

-   **Added**: Comprehensive site map with quick links and search tips
-   **Enhanced**: Main page quick links with better organization and clear call-to-actions
-   **Improved**: Cross-referencing between related documentation sections
-   **Added**: Multiple pathways for users to find support (Discord, GitHub, email)
-   **Enhanced**: Command documentation with redirect support for common URL patterns

#### Enhanced Context Understanding

-   **Improved**: User education about how AI context and conversation summaries work
-   **Added**: Clear explanations of different context types and their benefits
-   **Enhanced**: Privacy control explanations with actionable steps for users
-   **Added**: Memory effectiveness indicators to help users understand AI capabilities

### 🐛 Bug Fixes

-   **Fixed**: Broken import statement in context command causing module loading failures
-   **Fixed**: Duplicate navigation orders causing inconsistent page ordering in documentation
-   **Fixed**: Missing front matter in several documentation pages causing Jekyll build issues
-   **Fixed**: Incorrect parent-child relationships in technical documentation navigation

---

## [1.1.0] - 2025-07-01 - Enhanced Context & Privacy Controls

### 🎯 Major Features

#### Advanced Context & Privacy System

-   **Added**: Comprehensive user and guild context logging with privacy-first design
-   **Added**: User privacy controls for context logging (`/preferences` → privacy settings)
-   **Added**: Guild-level context tracking with privacy-respecting statistics
-   **Added**: `/guildcontext` command for server administrators to view guild interaction statistics
-   **Enhanced**: `/context` command now shows privacy-respecting conversation counts only
-   **Added**: Detailed privacy controls documentation (`docs/privacy-controls.md`)

#### Late Night Companion Mode

-   **Added**: Automatic late night companion mode (10 PM - 6 AM) using user timezone preferences
-   **Enhanced**: AI responses are more gentle, supportive, and crisis-aware during late hours
-   **Added**: Timezone-based behavioral adaptations for better user support

#### Expanded Timezone Support

-   **Added**: Comprehensive timezone support including Canadian provinces and global cities
-   **Enhanced**: User preferences now support 50+ timezone options
-   **Improved**: Timezone selection interface with better organization and search

#### Enhanced Owner & Admin Tools

-   **Added**: `/tools` owner command for system reload, sync, and status operations
-   **Enhanced**: `/stats` command with rich embeds, detailed metrics, and privacy indicators
-   **Enhanced**: `/status` command with comprehensive system health monitoring
-   **Added**: Real-time system performance metrics and safety feature status
-   **Improved**: Error handling and user feedback across all admin commands

#### GitHub Integration & Version Management

-   **Added**: Comprehensive `/version` command with GitHub integration
-   **Added**: Real-time version checking and update notifications
-   **Added**: Changelog viewing directly from Discord (`/version changelog`)
-   **Enhanced**: Changelogs sourced from GitHub release descriptions with markdown fallback
-   **Added**: Repository statistics and contributor information (`/version repo`)
-   **Added**: Recent releases browser (`/version releases`)
-   **Added**: GitHub API client for repository management
-   **Added**: Version handler for organized code structure
-   **Improved**: Version normalization and error handling for changelog retrieval

### ✨ Features & Improvements

#### Command System Enhancements

-   **Refactored**: Owner commands moved to `/tools` with proper access control
-   **Enhanced**: User context commands with privacy-first display options
-   **Added**: Guild context statistics for community engagement insights
-   **Improved**: All info commands now use rich embeds with better formatting
-   **Added**: Comprehensive error handling and user-friendly error messages
-   **Added**: Version management system with GitHub integration
-   **Created**: Handler pattern for complex command operations (version handler)

#### AI & Context Intelligence

-   **Enhanced**: AI context building with increased limits (4000 → 6000 characters)
-   **Improved**: Context retrieval logic for better conversation continuity
-   **Added**: Privacy-aware context processing that respects user preferences
-   **Enhanced**: Late night mode AI responses with specialized prompts and safety focus

#### Documentation & Developer Experience

-   **Added**: Implementation summary documentation (`docs/implementation-summary.md`)
-   **Updated**: Command documentation with all new features (`docs/commands.md`)
-   **Enhanced**: API documentation with privacy and context features
-   **Improved**: Getting started guide with privacy control explanations
-   **Added**: Troubleshooting guide updates for new features

### 🛠️ Technical Improvements

#### Database & Performance

-   **Enhanced**: Conversation history module with privacy controls
-   **Improved**: Guild data management with context tracking
-   **Added**: Efficient context retrieval algorithms
-   **Enhanced**: Message history service with privacy filtering
-   **Optimized**: Database queries for better performance

#### Code Quality & Maintenance

-   **Fixed**: JSON import compatibility for Node.js v22+
-   **Improved**: Error handling across all new features
-   **Enhanced**: Code organization and modularity
-   **Added**: Comprehensive logging for debugging and monitoring
-   **Standardized**: Command structure and response patterns
-   **Refactored**: Version command with proper handler pattern
-   **Added**: GitHub API client for external integrations
-   **Improved**: File structure and separation of concerns

#### Privacy & Security

-   **Implemented**: User-controlled privacy settings for all context features
-   **Added**: Guild-level privacy controls for community features
-   **Enhanced**: Data retention policies with user control
-   **Improved**: Audit logging for privacy-sensitive operations

### 🐛 Bug Fixes

-   **Fixed**: Export syntax error in user context command
-   **Fixed**: JSON import issues for Node.js v22+ compatibility
-   **Fixed**: Context command display formatting and privacy language
-   **Fixed**: Stats and status command error handling
-   **Fixed**: Timezone preference validation and storage
-   **Fixed**: Guild context retrieval and display issues
-   **Fixed**: Version command code corruption and duplicate functions
-   **Fixed**: GitHub client integration and error handling
-   **Fixed**: Changelog retrieval now uses GitHub release bodies as primary source
-   **Fixed**: Inconsistency between release data and changelog sources

### 📚 Documentation Updates

-   **Added**: Privacy controls comprehensive guide
-   **Updated**: Commands documentation with new features
-   **Enhanced**: API documentation with context and privacy features
-   **Improved**: Getting started guide with privacy setup
-   **Added**: Implementation summary for developers
-   **Updated**: Troubleshooting guide with new feature support

---

## [1.0.3] - 2025-06-27 - Coping Plan & Toolbox AI Improvements

### ✨ Features & Improvements

-   **Added:** `goal` option to `/plan suggest` and `/toolbox suggest` for more personalized AI suggestions.
-   **Improved:** AI suggestion logic now gathers user context (mood, trends, favorites) internally for more accurate recommendations.
-   **Refactored:** All coping and moderation commands now use `switch` statements for subcommand handling, improving maintainability.
-   **Fixed:** All upsert and create operations now properly handle required fields (e.g., usernames for users).
-   **Improved:** Database calls in AI suggestion logic are now self-contained, reducing boilerplate and improving maintainability.
-   **Updated:** `/plan` and `/toolbox` commands to pass the new `goal` option to the AI service.
-   **Improved:** Error handling and logging in coping commands and AI service.
-   **Refactored:** Consistent use of `BigInt` for all Discord IDs in database operations.

### 🛠️ Technical

-   **Refactored:** Modularized and clarified command logic for coping plan and toolbox features.
-   **Improved:** Documentation and code comments for maintainability.
-   **Updated:** Prisma schema and database modules to ensure type safety and required fields.

### 🐛 Bug Fixes

-   Fixed: Prisma upsert errors due to missing required fields (e.g., username).
-   Fixed: Toolbox and plan commands now correctly handle AI suggestion context and options.
-   Fixed: Minor error handling and logging issues in coping commands.

---

## [1.0.2] - 2025-06-27 - System Logging & Coping Tools Update

### 🔧 Features Added

#### System Logging Integration

-   **Added**: Comprehensive system logging throughout the application
-   **Added**: Command usage tracking with success/failure status
-   **Added**: Guild settings update logging
-   **Added**: Crisis event logging for system administrators
-   **Added**: Moderation action logging
-   **Added**: User preference change tracking
-   **Added**: Coping tool usage and management logging

#### Enhanced Coping Tools

-   **Added**: `/toolbox` command for managing favorite coping tools
-   **Added**: `/support` command with comprehensive crisis resources
-   **Added**: `/streaks` command for coping tool usage tracking
-   **Added**: `/plan` command for personalized coping plans
-   **Added**: `/music` command for calming music suggestions
-   **Added**: System logger integration across all coping commands

#### Profile & Preferences Improvements

-   **Fixed**: Profile command database queries to use correct methods
-   **Fixed**: Preferences command code corruption and syntax errors
-   **Enhanced**: Profile display with comprehensive mental health journey tracking
-   **Added**: System logging for profile access and preference changes

### 🐛 Bug Fixes

-   Fixed profile command database query issues that caused crashes
-   Fixed syntax errors and code corruption in preferences command
-   Fixed duplicate function declarations in moderation tools
-   Fixed missing system logger integration in various commands
-   Fixed database method references in profile statistics

### 🛠️ Technical Changes

#### System Integration

-   **Added**: System logger integration across all command categories
-   **Added**: Comprehensive error logging and tracking
-   **Added**: User activity and engagement monitoring
-   **Enhanced**: Database operation logging and debugging

---

## [1.0.1] - 2025-06-27 - Critical Patch Release

### 🚨 Critical Fixes

#### Discord.js v14 Compatibility

-   **Fixed**: Updated all permission checks to use `PermissionFlagsBits` enum instead of deprecated string names
-   **Fixed**: Resolved `BitFieldInvalid` errors that were breaking commands with permission requirements
-   **Impact**: Commands with permission requirements now work properly

#### Interaction Handling

-   **Fixed**: Removed duplicate interaction reply attempts that caused "Interaction has already been acknowledged" errors
-   **Fixed**: Simplified error handling to only reply if interaction hasn't been replied to yet
-   **Impact**: All commands now execute without interaction errors

#### Performance Improvements

-   **Fixed**: Removed unnecessary `deferReply()` calls from commands that can respond immediately
-   **Fixed**: Improved command response times for simple operations
-   **Impact**: Faster user experience for most commands

### 🔧 Features Added

#### Comprehensive Guild Settings

-   **Added**: Complete guild configuration system with `/guildsettings` command
-   **Added**: Channel configuration for crisis alerts, moderation logs, check-ins, coping tools, system notifications, and audit logs
-   **Added**: Feature toggles for check-ins, ghost letters, crisis alerts, and system logs
-   **Added**: Auto-moderation configuration with sensitivity levels (1-5)
-   **Added**: Role assignment for moderators and system roles
-   **Added**: Language preference settings

#### Guild Settings Compliance

-   **Added**: Auto-moderation now respects guild-specific settings (`autoModEnabled`, `autoModLevel`)
-   **Added**: Crisis detection respects guild `enableCrisisAlerts` setting
-   **Added**: Check-in reminders respect guild `enableCheckIns` setting
-   **Added**: All features now check guild preferences before executing

### 🎯 Improvements

#### Channel Purpose Clarity

-   **Changed**: Clarified that "Crisis Alert Channel" (`modAlertChannelId`) is specifically for mental health crisis situations
-   **Changed**: Distinguished between crisis alerts and routine moderation logs
-   **Changed**: Updated all user-facing descriptions to reflect proper channel purposes

#### Code Quality

-   **Fixed**: Removed duplicated functions in `moderationTool.js`
-   **Fixed**: Corrected malformed `guildSettings.js` file with proper formatting
-   **Fixed**: Removed unnecessary fallback values in guild database module
-   **Fixed**: Eliminated duplicate startup notification logic in client ready event

#### Database Operations

-   **Improved**: Guild upsert operations now require proper guild name and owner ID
-   **Improved**: Streamlined database field mappings for guild settings
-   **Added**: Debug logging for guild settings updates and retrievals

### 🛠️ Technical Changes

#### Permission System

-   **Updated**: All commands using `requiredPerms` now use `PermissionFlagsBits` enum values
-   **Updated**: Interaction handler properly converts and validates Discord permissions
-   **Files**: `moderationHandler.js`, `events/interactions/create.js`, various command files

#### Error Handling

-   **Improved**: Simplified interaction error responses
-   **Removed**: Redundant deferred reply checks that caused double-reply errors
-   **Files**: `events/interactions/create.js`

#### Guild Management

-   **Enhanced**: Complete guild settings interface with organized subcommands
-   **Enhanced**: Real-time guild preference checking throughout the application
-   **Files**: `commands/slash/guild/guildSettings.js`, `functions/moderationHandler.js`, `services/tools/crisisTool.js`

### 🐛 Bug Fixes

-   Fixed permission validation errors across all commands
-   Fixed interaction acknowledgment conflicts
-   Fixed guild settings not saving correctly
-   Fixed duplicate startup notifications
-   Fixed malformed code in guild settings command
-   Fixed incorrect channel field mappings

---

## [1.0.0] - 2025-06-20 - Initial Release

### 🎉 Initial Features

-   AI-powered mental health companion
-   Mood check-ins and tracking
-   Crisis detection and intervention
-   Ghost letter private venting
-   Coping tools and resources
-   Community moderation features
-   User preference management
-   Comprehensive database schema

---

**Note**: This changelog follows semantic versioning. Version numbers indicate:

-   **Major**: Breaking changes
-   **Minor**: New features (backward compatible)
-   **Patch**: Bug fixes (backward compatible)
-   Fixed malformed code in guild settings command
-   Fixed incorrect channel field mappings

---

## [1.0.0] - 2025-06-20 - Initial Release

### 🎉 Initial Features

-   AI-powered mental health companion
-   Mood check-ins and tracking
-   Crisis detection and intervention
-   Ghost letter private venting
-   Coping tools and resources
-   Community moderation features
-   User preference management
-   Comprehensive database schema

---

**Note**: This changelog follows semantic versioning. Version numbers indicate:

-   **Major**: Breaking changes
-   **Minor**: New features (backward compatible)
-   **Patch**: Bug fixes (backward compatible)
