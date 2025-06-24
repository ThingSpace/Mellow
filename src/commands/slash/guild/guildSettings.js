import { PermissionFlagsBits, ChannelType } from 'discord.js'

export default {
    structure: {
        name: 'guildsettings',
        description: 'View or update guild settings (admin only)',
        default_member_permissions: PermissionFlagsBits.Administrator,
        options: [
            {
                name: 'set_mod_alert_channel',
                description: 'Set the mod alert channel for crisis alerts',
                type: 7, // CHANNEL
                required: false,
                channel_types: [ChannelType.GuildText]
            }
        ]
    },
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'You must be an admin to use this command.', ephemeral: true })
        }
        const channel = interaction.options.getChannel('set_mod_alert_channel')
        if (channel) {
            await client.db.guilds.setModAlertChannel(interaction.guild.id, channel.id)
            return interaction.reply({ content: `Mod alert channel set to <#${channel.id}>.`, ephemeral: true })
        }
        // Show current settings
        const modAlertChannelId = await client.db.guilds.getModAlertChannel(interaction.guild.id)
        return interaction.reply({
            content: `Current mod alert channel: ${modAlertChannelId ? `<#${modAlertChannelId}>` : 'Not set.'}`,
            ephemeral: true
        })
    }
}
