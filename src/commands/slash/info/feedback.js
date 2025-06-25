export default {
    structure: {
        name: 'feedback',
        category: 'Info',
        description: 'Send feedback or suggestions to the Mellow team.',
        handlers: {
            cooldown: 600,
            requiredRoles: []
        },
        options: [
            {
                name: 'message',
                description: 'Your feedback or suggestion',
                required: true,
                type: 3 // STRING
            }
        ]
    },
    run: async (client, interaction) => {
        const message = interaction.options.getString('message')
        const userId = interaction.user?.id ? BigInt(interaction.user.id) : null

        await client.db.prisma.feedback.create({
            data: {
                userId,
                message
            }
        })

        await interaction.reply({
            content: 'Thank you for your feedback! The Mellow team appreciates your input. 💜',
            ephemeral: true
        })
    }
}
