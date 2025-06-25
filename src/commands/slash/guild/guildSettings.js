import { PermissionFlagsBits, ChannelType } from 'discord.js'

export default {
    structure: {
        name: 'guildsettings',
        description: 'View or update guild settings',
        handlers: {
            requiredRoles: [],
            requiredPerms: ['ADMINISTRATOR', 'MANAGE_GUILD'],
            cooldown: 15000
        },
        options: [
            {
                name: 'set_mod_alert_channel',
                description: 'Set the mod alert channel for crisis alerts',
                type: 7,
                required: false,
                channel_types: [ChannelType.GuildText]
            }
        ]
    },
    run: async (client, interaction) => {
        const channel = interaction.options.getChannel('set_mod_alert_channel')

        if (channel) {
            await client.db.guilds.setModAlertChannel(interaction.guild.id, channel.id)
            return interaction.reply({ content: `Mod alert channel set to <#${channel.id}>.`, ephemeral: true })
        }

        const modAlertChannelId = await client.db.guilds.getModAlertChannel(interaction.guild.id)

        return interaction.reply({
            content: `Current mod alert channel: ${modAlertChannelId ? `<#${modAlertChannelId}>` : 'Not set.'}`,
            ephemeral: false
        })
    }
}
