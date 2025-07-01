---
layout: default
title: FAQ
nav_order: 8
description: "Frequently asked questions about Mellow's features and usage"
---

# Frequently Asked Questions (FAQ)

## ❓ General Questions

### What is Mellow?

Mellow is an AI-powered mental health companion for Discord, designed to provide supportive check-ins, coping tools, crisis detection, and personalized support with late-night companion mode.

### Is Mellow a replacement for therapy?

**No.** Mellow is not a substitute for professional mental health care. It offers support, coping tools, and crisis resources, but is not a replacement for professional diagnosis or treatment.

### How do I invite Mellow to my server?

Use the [official invite link](https://discord.com/oauth2/authorize?client_id=1386810331367608371) and grant the required permissions.

### What commands does Mellow support?

See the [Commands Reference](commands.md) for a comprehensive list of all available commands.

## 🔒 Privacy & Data

### Is my data private?

Yes. Mellow only stores the minimum data needed for its features and follows strict privacy guidelines. See the [Privacy Policy](privacy-policy.md) and [Privacy Controls](privacy-controls.md) for complete details.

### What is context logging and should I enable it?

Context logging allows Mellow's AI to remember your conversation history for better, more personalized responses. It's enabled by default but you can disable it with `/preferences update context_logging:false`. See our [Privacy Controls guide](privacy-controls.md) for more information.

### Can I see what the AI remembers about me?

Yes! Use the `/context` command to view your conversation history and what context the AI has access to.

### How do I delete my data?

Use `/preferences reset` to clear all your stored preferences and conversation history, or contact support via the support server or email [support@athing.space](mailto:support@athing.space).

## 🌙 Features & Functionality

### What is Late-Night Companion Mode?

Late-night companion mode automatically activates based on your timezone (set in `/preferences`) and provides gentler, more calming responses during late hours (10 PM - 6 AM). You can check your current mode with `/timemode`.

### How does crisis detection work?

Mellow uses advanced AI to automatically detect signs of distress in messages and provides appropriate resources and support. It can also alert server moderators in serious situations while respecting your privacy.

### What coping tools are available?

Mellow offers breathing exercises, grounding techniques, journal prompts, music suggestions, personalized coping plans, and crisis resources. Access them with `/coping`, `/toolbox`, `/plan`, and `/support`.

### How do mood check-ins work?

Use `/checkin` to log your current mood, intensity (1-5), and recent activities. View your trends with `/insights` and your overall mental health journey with `/profile`.

### Can I customize how Mellow responds to me?

Yes! Use `/preferences update` to set your AI personality (gentle, supportive, direct, playful, professional, encouraging), theme colors, language, and timezone for personalized interactions.

## 🛠️ Technical Support

### Bot not responding to commands?

-   Check if Mellow has the required permissions in your server
-   Ensure slash commands are enabled
-   Try using commands in DMs to isolate server-specific issues
-   See our [Troubleshooting guide](troubleshooting.md) for more solutions

### How do I get help or support?

-   Use `/support` in Discord for crisis resources
-   Use `/help` for command information
-   [Join the support server](https://discord.gg/C3ZuXPP7Hc)
-   [Open a GitHub issue](https://github.com/ThingSpace/Mellow/issues)

### Can I contribute to Mellow?

Yes! Mellow is open source. See the [Contributing Guide](contributing.md) for information on how to contribute code, documentation, or feedback.

---
