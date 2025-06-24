import { cmdTypes } from '../../../configs/cmdTypes.config.js'

export default {
    structure: {
        name: 'coping',
        category: 'Coping',
        description: 'Access a toolbox of coping skills and prompts, powered by AI.',
        handlers: {
            cooldown: 60,
            requiredRoles: []
        },
        options: [
            {
                name: 'tool',
                description: 'Pick a coping tool (optional)',
                required: false,
                type: 3,
                choices: [
                    { name: 'Grounding', value: 'grounding' },
                    { name: 'Breathing', value: 'breathing' },
                    { name: 'Affirmations', value: 'affirmations' }
                ]
            },
            {
                name: 'feeling',
                description: `Describe how you're feeling (optional)`,
                required: false,
                type: 3
            },
            {
                name: 'private',
                description: 'Should this be private? (default: yes)',
                required: false,
                type: 5
            }
        ]
    },
    run: async (client, interaction) => {
        const tool = interaction.options.getString('tool')
        const feeling = interaction.options.getString('feeling')
        const isPrivate = interaction.options.getBoolean('private') ?? true
        const userId = interaction.user.id

        // Log usage if a tool is selected
        if (tool) {
            await client.db.copingToolUsage.add(userId, tool)
        }

        await interaction.deferReply({ ephemeral: isPrivate })

        // Use the AI service's coping tool integration
        const aiResponse = await client.ai.getCopingResponse({ tool, feeling, userId })

        await interaction.editReply({
            embeds: [
                new client.Gateway.EmbedBuilder()
                    .setTitle('Coping Support')
                    .setDescription(aiResponse)
                    .setColor(client.colors.primary)
                    .setFooter({ text: client.footer, iconURL: client.logo })
            ]
        })
    }
}
