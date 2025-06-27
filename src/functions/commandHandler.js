/**
 * Available text commands
 */
const COMMANDS = {
    help: ['help', 'h'],
    about: ['about', 'info']
}

/**
 * Parse command from message content
 * @param {string} content - Message content
 * @param {string} botId - Bot user ID
 * @returns {Object|null} Parsed command or null
 */
export function parseCommand(content, botId) {
    const mention = new RegExp(`^<@!?${botId}> ?`)
    if (!mention.test(content)) return null

    const args = content.split(' ')
    const command = args[1]?.trim()?.toLowerCase()

    return {
        command,
        args: args.slice(2),
        isValidCommand: Object.keys(COMMANDS).some(cmd => COMMANDS[cmd].includes(command))
    }
}

/**
 * Handle text command execution
 * @param {Object} message - Discord message object
 * @param {Object} client - Discord client
 * @returns {Promise<boolean>} Whether command was handled
 */
export async function handleTextCommand(message, client) {
    try {
        const parsed = parseCommand(message.content, client.user.id)
        if (!parsed || !parsed.isValidCommand) return false

        switch (parsed.command) {
            case 'help':
            case 'h':
                await client.msgHandler.send.help(message)
                break
            case 'about':
            case 'info':
                await client.msgHandler.send.about(message)
                break
            default:
                return false
        }

        return true
    } catch (error) {
        console.error('Error handling text command:', error)
        return false
    }
}
