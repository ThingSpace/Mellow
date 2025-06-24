export default {
    structure: {
        name: 'ghostletter',
        category: 'Ghost Letter',
        description: 'Privately vent or write a message only you can see.',
        handlers: {
            cooldown: 120,
            requiredRoles: []
        },
        options: [
            {
                name: 'message',
                description: 'What would you like to say?',
                required: true,
                type: 3 // STRING
            },
            {
                name: 'action',
                description: 'View or clear your ghost letters',
                required: false,
                type: 3, // STRING
                choices: [
                    { name: 'view', value: 'view' },
                    { name: 'clear', value: 'clear' }
                ]
            }
        ]
    },
    run: async (client, interaction) => {
        const action = interaction.options.getString('action')
        const userId = interaction.user.id

        if (action === 'view') {
            const letters = await client.db.ghostLetters.getAllForUser(userId, 10)
            if (!letters.length) {
                return interaction.reply({ content: 'You have no ghost letters yet.', ephemeral: true })
            }
            const history = letters
                .map(l => `• _${l.content}_ <t:${Math.floor(new Date(l.createdAt).getTime() / 1000)}:R>`)
                .join('\n')
            return interaction.reply({
                embeds: [
                    new client.Gateway.EmbedBuilder()
                        .setTitle('Your Ghost Letters')
                        .setDescription(history)
                        .setColor(client.colors.primary)
                        .setFooter({ text: client.footer, iconURL: client.logo })
                ],
                ephemeral: true
            })
        }
        if (action === 'clear') {
            await client.db.ghostLetters.clearForUser(userId)
            return interaction.reply({ content: 'All your ghost letters have been cleared.', ephemeral: true })
        }
        // Default: add a new ghost letter
        const message = interaction.options.getString('message')
        await client.db.ghostLetters.add(userId, message)
        return interaction.reply({
            content:
                'Your ghost letter has been saved. Only you can view it. Use `/ghostletter action:view` to see your letters.',
            ephemeral: true
        })
    }
}
