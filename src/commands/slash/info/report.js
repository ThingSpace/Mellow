export default {
    structure: {
        name: 'report',
        category: 'Info',
        description: 'Report a bug or inappropriate content to the Mellow team.',
        handlers: {
            cooldown: 600,
            requiredRoles: []
        },
        options: [
            {
                name: 'message',
                description: 'Describe the bug or issue',
                required: true,
                type: 3 // STRING
            }
        ]
    },
    run: async (client, interaction) => {
        const message = interaction.options.getString('message')
        const userId = interaction.user?.id ? BigInt(interaction.user.id) : null

        await client.db.prisma.report.create({
            data: {
                userId,
                message
            }
        })

        await interaction.reply({
            content: 'Thank you for your report. The Mellow team will review it as soon as possible.',
            ephemeral: true
        })
    }
}
