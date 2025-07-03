---
layout: default
title: Guild Debug
nav_order: 1
description: 'Extensive documentation for Mellows guilddebug command.'
parent: Technical Documentation
---


# Guild Debug Command Documentation

The `/guilddebug` command is a comprehensive debugging and support tool for Mellow bot. It provides both diagnostic capabilities for the support team and a way for server administrators to request help.

## Command Structure

```
/guilddebug <subcommand>
```

## Subcommands

### 1. `/guilddebug diagnostics` (Mellow Team Only)

**Description:** Run comprehensive guild diagnostics to identify potential issues.

**Permissions Required:** OWNER or SUPPORT role in Mellow system

**What it shows:**
- Guild overview (ID, member count, owner, creation date)
- System health (database, AI service, bot permissions)
- Channel health (crisis alerts, mod logs, check-ins, etc.)
- Recent activity (check-ins, crisis events, mod actions)
- Feature status (enabled/disabled features)

**Usage:**
```
/guilddebug diagnostics
```

**Example Output:**
- ✅/❌ indicators for system health
- Channel validity checks
- Activity statistics
- Feature configuration status

---

### 2. `/guilddebug settings` (Mellow Team Only)

**Description:** View detailed guild settings and configuration for debugging purposes.

**Permissions Required:** OWNER or SUPPORT role in Mellow system

**What it shows:**
- Database information (internal ID, join date, status)
- Channel configuration (all configured channels with IDs)
- Feature flags (enabled/disabled features)
- Moderation settings (auto-mod, roles)
- General settings (language, timezone, premium status)

**Usage:**
```
/guilddebug settings
```

---

### 3. `/guilddebug logs` (Mellow Team Only)

**Description:** View recent guild-specific logs for troubleshooting.

**Permissions Required:** OWNER or SUPPORT role in Mellow system

**Parameters:**
- `type` (optional): Type of logs to view
  - `all` - All logs (default)
  - `crisis` - Crisis alerts only
  - `moderation` - Moderation actions only
  - `system` - System events only
  - `user` - User events only
  - `error` - Error logs only
- `limit` (optional): Number of logs to display (1-20, default: 10)

**Usage:**
```
/guilddebug logs
/guilddebug logs type:crisis limit:5
/guilddebug logs type:error limit:20
```

---

### 4. `/guilddebug database` (Mellow Team Only)

**Description:** Check guild database health and statistics.

**Permissions Required:** OWNER or SUPPORT role in Mellow system

**What it shows:**
- Database connection status and latency
- Data statistics (users, check-ins, ghost letters, etc.)
- Performance metrics
- Query speed analysis

**Usage:**
```
/guilddebug database
```

---

### 5. `/guilddebug request-support` (All Guild Admins)

**Description:** Request help from the Mellow support team.

**Permissions Required:** Anyone can use this, but admin permissions are noted in the request

**Parameters:**
- `issue` (required): Brief description of the issue (max 1000 characters)
- `severity` (required): How severe is the issue?
  - `🔴 Critical` - Bot completely broken
  - `🟡 High` - Major features not working  
  - `🟢 Medium` - Some features affected
  - `🔵 Low` - Minor issues or questions
- `contact` (optional): How should we contact you? (Discord username, email, etc.)

**Usage:**
```
/guilddebug request-support issue:"Bot not responding to commands" severity:high contact:"admin@example.com"
/guilddebug request-support issue:"Crisis alerts not working" severity:critical
/guilddebug request-support issue:"How to set up check-in channel?" severity:low
```

**Response Times:**
- 🔴 **Critical:** Within 2-4 hours
- 🟡 **High:** Within 8-12 hours
- 🟢 **Medium:** Within 24-48 hours
- 🔵 **Low:** Within 2-5 business days

---

## For Server Administrators

### When to Use `/guilddebug request-support`

**Critical Issues (🔴):**
- Bot is completely unresponsive
- Crisis detection system is broken
- Major data loss or corruption
- Security concerns

**High Priority (🟡):**
- Important features not working (check-ins, moderation)
- Commands returning errors consistently
- Configuration issues preventing normal operation

**Medium Priority (🟢):**
- Some commands not working as expected
- Minor feature requests
- Questions about best practices

**Low Priority (🔵):**
- General questions about features
- Documentation clarifications
- Feature suggestions

### Before Requesting Support

1. **Check the documentation:** [mellow.athing.space](https://mellow.athing.space)
2. **Try basic troubleshooting:**
   - Ensure bot has proper permissions
   - Check if commands work in other channels
   - Verify bot is online and responsive
3. **Join the support server:** [discord.gg/C3ZuXPP7Hc](https://discord.gg/C3ZuXPP7Hc)

### What to Include in Your Request

- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **When the issue started**
- **Any error messages** you've seen
- **Your contact information** for follow-up

---

## For Mellow Support Team

### Access Requirements

To use the diagnostic commands, you need:
- `OWNER` or `SUPPORT` role in the Mellow user database
- Access to the support server/channels

### Typical Debugging Workflow

1. **Start with diagnostics** - `/guilddebug diagnostics`
   - Check system health indicators
   - Identify obvious configuration issues
   - Note any missing permissions or invalid channels

2. **Review settings** - `/guilddebug settings`
   - Verify channel configurations
   - Check feature flags
   - Confirm moderation settings

3. **Check recent activity** - `/guilddebug logs`
   - Look for error patterns
   - Check specific log types based on the issue
   - Identify timing of problems

4. **Verify database health** - `/guilddebug database`
   - Ensure database connectivity
   - Check data statistics for anomalies
   - Verify performance metrics

### Common Issues and Solutions

**Bot Not Responding:**
- Check diagnostics → Bot Permissions
- Verify bot is online and has basic permissions
- Check recent error logs

**Commands Failing:**
- Review settings → Channel Configuration
- Ensure required channels exist and are accessible
- Check for permission issues

**Features Not Working:**
- Check settings → Feature Flags
- Verify required channels are configured
- Review recent moderation logs

**Performance Issues:**
- Check database → Performance Metrics
- Look for high query latency
- Review recent activity levels

---

## Configuration

### Environment Variables

The support system requires these environment variables:

```env
# Required
SUPPORT_GUILD_ID=your_support_server_id
SUPPORT_CHANNEL_ID=your_support_channel_id

# Optional
SUPPORT_ROLE_ID=your_support_team_role_id
SUPPORT_WEBHOOK_URL=external_webhook_url
```

### Support Features

- **Automatic thread creation** for each support request
- **Severity-based notifications** (critical issues ping support role)
- **Rate limiting** to prevent spam
- **Integration with external systems** via webhooks
- **Email alerts** for critical issues (optional)

---

## Error Handling

If the command fails:
- **For diagnostic commands:** Error details are shown to authorized users
- **For support requests:** Users are directed to alternative contact methods
- **All errors are logged** to the system logger for investigation

---

## Security Notes

- Diagnostic commands are restricted to Mellow team members only
- Support requests include permission level of the requester
- All requests are logged with timestamps and user information
- No sensitive data (tokens, passwords) is exposed in diagnostics

---

## Support Contacts

- **Documentation:** [mellow.athing.space](https://mellow.athing.space)
- **Support Server:** [discord.gg/C3ZuXPP7Hc](https://discord.gg/C3ZuXPP7Hc)
- **GitHub Issues:** [GitHub Repository](https://github.com/ThingSpace/Mellow)
- **Email:** support@athing.space