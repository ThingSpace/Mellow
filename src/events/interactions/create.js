import { Events, PermissionFlagsBits } from 'discord.js'
import { log } from '../../functions/logger.js'

const cooldown = new Map()

export default {
    event: Events.InteractionCreate,

    run: async (client, interaction) => {
        if (interaction.isContextMenuCommand() || !interaction.isChatInputCommand() || !interaction.isCommand()) {
            return
        }

        const command = client.slash.get(interaction.commandName) || client.private.get(interaction.commandName)
        if (!command) {
            return
        }

        // Dual permission system
        const requiredDiscordPermissions = command.structure.handlers.requiredPerms || []
        const requiredRoles = command.structure.handlers.requiredRoles || []
        const isGuildOnly = command.structure.handlers.guildOnly || false

        // Check if the command is guild-only
        if (isGuildOnly && !interaction.guild) {
            return interaction.reply({
                ephemeral: true,
                content: '❌ This command can only be used in a server.'
            })
        }

        // Discord permissions check
        if (requiredDiscordPermissions.length > 0 && interaction.guild) {
            const member = await interaction.guild.members.fetch(interaction.user.id)
            const hasPermission = requiredDiscordPermissions.some(perm => {
                // Convert string permission names to PermissionFlagsBits
                const permFlag = typeof perm === 'string' ? PermissionFlagsBits[perm] : perm
                return permFlag && member.permissions.has(permFlag)
            })

            if (!hasPermission) {
                return interaction.reply({
                    ephemeral: true,
                    embeds: [
                        new client.Gateway.EmbedBuilder()
                            .setTitle('Permission Denied')
                            .setColor(client.colors.error)
                            .setDescription('You lack the required Discord permissions for this command.')
                            .addFields({
                                name: 'Required Permissions',
                                value: requiredDiscordPermissions.map(p => `\`${p}\``).join(', ')
                            })
                            .setThumbnail(client.logo)
                    ]
                })
            }
        }

        // DB role check
        if (requiredRoles.length > 0) {
            const user = await client.db.users.findById(BigInt(interaction.user.id))
            if (!user) {
                return interaction.reply({
                    ephemeral: true,
                    embeds: [
                        new client.Gateway.EmbedBuilder()
                            .setTitle('ERROR: User not registered')
                            .setColor(client.colors.error)
                            .setDescription('You need to be registered in the system to use this command.')
                            .setThumbnail(client.logo)
                    ]
                })
            }
            if (user.isBanned) {
                const banText = user.bannedUntil
                    ? `You are banned until ${user.bannedUntil.toLocaleString()}`
                    : 'You are permanently banned'

                return interaction.reply({
                    ephemeral: true,
                    embeds: [
                        new client.Gateway.EmbedBuilder()
                            .setTitle('Access Denied')
                            .setColor(client.colors.error)
                            .setDescription(banText)
                            .setThumbnail(client.logo)
                    ]
                })
            }
            // OWNER bypass: OWNERs always have access
            if (user.role === 'OWNER') {
                // OWNERs bypass all role checks
            } else if (!requiredRoles.includes(user.role)) {
                return interaction.reply({
                    ephemeral: true,
                    embeds: [
                        new client.Gateway.EmbedBuilder()
                            .setTitle('Permission Denied')
                            .setColor(client.colors.error)
                            .setDescription('You lack the required role for this command.')
                            .addFields(
                                {
                                    name: 'Required Roles',
                                    value: requiredRoles.map(r => `\`${r}\``).join(', ')
                                },
                                {
                                    name: 'Your Role',
                                    value: `\`${user.role}\``
                                }
                            )
                            .setThumbnail(client.logo)
                    ]
                })
            }
        }

        // Cooldown logic
        if (command.handlers?.cooldown) {
            const isGlobalCooldown = command.handlers.globalCooldown
            const cooldownKey = isGlobalCooldown ? 'global_' + command.structure.name : interaction.user.id

            const cooldownFunction = () => {
                const data = cooldown.get(cooldownKey) || []
                data.push(interaction.commandName)
                cooldown.set(cooldownKey, data)
                setTimeout(() => {
                    let data = cooldown.get(cooldownKey)
                    data = data.filter(v => v !== interaction.commandName)
                    if (data.length <= 0) {
                        cooldown.delete(cooldownKey)
                    } else {
                        cooldown.set(cooldownKey, data)
                    }
                }, command.handlers.cooldown)
            }

            if (cooldown.has(cooldownKey)) {
                const data = cooldown.get(cooldownKey)
                if (data.some(v => v === interaction.commandName)) {
                    const message = (
                        isGlobalCooldown
                            ? 'Slow down buddy, this command is on a global cooldown and you are using it too fast!'
                            : 'You are using this command too fast! Please wait: (${cooldown}s)'
                    ).replace('/${cooldown}/g', command.handlers.cooldown / 1000)
                    await interaction.reply({
                        content: message,
                        ephemeral: true
                    })
                    return
                }
                cooldownFunction()
            } else {
                cooldown.set(cooldownKey, [interaction.commandName])
                cooldownFunction()
            }
        }

        // Actually run the command
        try {
            await command.run(client, interaction)

            // Log successful command usage
            if (client.systemLogger) {
                await client.systemLogger.logCommandUsage(
                    interaction,
                    interaction.commandName,
                    command.structure.category || 'Unknown',
                    true
                )
            }
        } catch (err) {
            log(`Failed to execute command: ${interaction.commandName}`, 'error')
            log(err, 'debug')

            // Log failed command usage
            if (client.systemLogger) {
                await client.systemLogger.logCommandUsage(
                    interaction,
                    interaction.commandName,
                    command.structure.category || 'Unknown',
                    false
                )

                // Log the error details
                await client.systemLogger.logError(err, `Command: ${interaction.commandName}`)
            }

            // Only try to respond if the interaction hasn't been replied to yet
            if (!interaction.replied) {
                try {
                    await interaction.reply({
                        ephemeral: true,
                        content: 'An error occurred while executing this command!'
                    })
                } catch (replyError) {
                    console.error('Failed to send error reply:', replyError)
                }
            }
        }
    }
}
