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
        const guildId = interaction.guild.id

        if (channel) {
            try {
                await client.db.guilds.upsert(guildId, { modAlertChannelId: channel.id })
                return interaction.reply({ content: `Mod alert channel set to <#${channel.id}>.`, ephemeral: true })
            } catch (error) {
                console.error('Failed to set mod alert channel:', error)
                return interaction.reply({ content: '❌ Failed to set mod alert channel.', ephemeral: true })
            }
        }

        try {
            const guild = await client.db.guilds.findById(guildId)
            const modAlertChannelId = guild?.modAlertChannelId
            return interaction.reply({
                content: `Current mod alert channel: ${modAlertChannelId ? `<#${modAlertChannelId}>` : 'Not set.'}`,
                ephemeral: false
            })
        } catch (error) {
            console.error('Failed to get mod alert channel:', error)
            return interaction.reply({ content: '❌ Failed to get mod alert channel.', ephemeral: true })
        }
    }
}
