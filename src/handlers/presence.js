import { ActivityType } from 'discord.js'

export const setClientPresence = async client => {
    const presences = [
        { name: 'Watching athing.space', type: ActivityType.Custom },
        { name: 'Watching for check-ins', type: ActivityType.Custom },
        { name: 'Listening to your feelings', type: ActivityType.Custom },
        { name: 'Enjoying late night chats', type: ActivityType.Custom },
        { name: 'Looking for someone to talk to', type: ActivityType.Custom },
        { name: 'Providing gentle support', type: ActivityType.Custom },
        { name: 'Executing coping tools', type: ActivityType.Custom },
        { name: 'Competing with kindness', type: ActivityType.Custom },
        { name: 'Mellow moments', type: ActivityType.Custom },
        { name: 'Providing mental health tips', type: ActivityType.Custom },
        { name: 'Watching for crisis keywords', type: ActivityType.Custom },
        { name: 'Responding to your DMs', type: ActivityType.Custom }
    ]

    client.user.setStatus('online')

    setInterval(() => {
        const presence = presences[Math.floor(Math.random() * presences.length)]

        client.user.setActivity({
            name: presence.name,
            type: presence.type
        })
    }, 30000)
}
