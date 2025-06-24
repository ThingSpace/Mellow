import { REST, Routes } from 'discord.js'
import { log } from '../functions/logger.js'

// Helper function to handle BigInt serialization
function serializeCommandData(commands) {
    return commands.map(cmd => {
        // Convert the command to string to handle any BigInt values
        const stringified = JSON.stringify(cmd, (key, value) => (typeof value === 'bigint' ? value.toString() : value))
        return JSON.parse(stringified)
    })
}

const deploy = async client => {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)

    try {
        log('Started loading application commands.', 'info')

        const commandJsonData = serializeCommandData([
            ...Array.from(client.slash.values()).map(c => c.structure) // Public slash commands
            // ...Array.from(client.context.values()).map(c => c.structure) // Coming soon!
        ])

        if (client.private.size > 0) {
            log('Started loading private (/) commands.', 'info')

            /**
             * Load our guild only commands, these commands will only be available in the NodeByte guild.
             * @important for now we are using the development server for testing purposes.
             */
            await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, '957420716142252062'), {
                body: serializeCommandData(Array.from(client.private.values()).map(c => c.structure))
            })
        }

        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
            body: commandJsonData
        })

        log('Successfully reloaded application (/) commands.', 'done')
    } catch (error) {
        log(`An error occurred while loading application (/) commands: ${error}`, 'error')
        log(`Stack trace: ${error.stack}`, 'error')
    }
}

export default deploy
