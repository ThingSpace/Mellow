import { log } from '../../../functions/logger.js'
import { encryptionService } from '../../../services/encryption.service.js'

export default {
    structure: {
        name: 'decrypt',
        category: 'Owner',
        description: 'Decrypts an encrypted string [Owner Only]',
        handlers: {
            cooldown: 5000,
            requiredRoles: []
        },
        options: [
            {
                name: 'content',
                description: 'The encrypted content to decrypt',
                required: true,
                type: 3
            },
            {
                name: 'private',
                description: 'Keep the response private',
                required: false,
                type: 5
            }
        ]
    },

    run: async (client, interaction) => {
        // Check if user is an owner
        const isOwner = await client.db.mellow.isOwner(interaction.user.id)

        if (!isOwner) {
            return interaction.reply({
                content: 'Only bot owners can use this command.',
                ephemeral: true
            })
        }

        const content = interaction.options.getString('content')
        const isPrivate = interaction.options.getBoolean('private') ?? true

        try {
            // Check if the content is actually encrypted
            if (!encryptionService.isEncrypted(content)) {
                return interaction.reply({
                    content: 'This content does not appear to be encrypted.',
                    ephemeral: isPrivate
                })
            }

            // Try to decrypt the content
            const decrypted = encryptionService.decrypt(content)

            // Check if decryption worked or returned an error message
            if (
                decrypted.startsWith('[Encrypted content - unable to decrypt:') ||
                decrypted.startsWith('[Partial recovery:')
            ) {
                return interaction.reply({
                    content: `Failed to decrypt: ${decrypted}`,
                    ephemeral: isPrivate
                })
            }

            // Create embed with the decrypted content
            const embed = {
                title: '🔓 Decrypted Content',
                description: '```\n' + decrypted + '\n```',
                color: 0x00ff00,
                fields: [
                    {
                        name: 'Original Encrypted String',
                        value: `\`${content.substring(0, 30)}...\``,
                        inline: false
                    }
                ],
                footer: {
                    text: 'Sensitive data - only visible to you'
                }
            }

            // Send the decrypted content
            return interaction.reply({
                content: 'Decryption successful!',
                embeds: [embed],
                ephemeral: isPrivate
            })
        } catch (error) {
            log(`Error decrypting content: ${error.message}`, 'error')
            return interaction.reply({
                content: `An error occurred while decrypting: ${error.message}`,
                ephemeral: true
            })
        }
    }
}
