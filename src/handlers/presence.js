import { ActivityType } from 'discord.js'

export const setClientPresence = async client => {
    const presences = [
        { name: 'athing.space', type: ActivityType.Playing },
        { name: 'for check-ins', type: ActivityType.Watching },
        { name: 'your feelings', type: ActivityType.Listening },
        { name: 'late-night chats', type: ActivityType.Playing },
        { name: 'for someone to talk to', type: ActivityType.Watching },
        { name: 'gentle support', type: ActivityType.Listening },
        { name: 'coping tools', type: ActivityType.Playing },
        { name: 'with kindness', type: ActivityType.Playing },
        { name: 'Mellow moments', type: ActivityType.Custom },
        { name: 'mental health tips', type: ActivityType.Watching },
        { name: 'for crisis keywords', type: ActivityType.Competing },
        { name: 'your DMs', type: ActivityType.Watching }
    ]

    client.user.setStatus('idle')

    setInterval(() => {
        const presence = presences[Math.floor(Math.random() * presences.length)]

        client.user.setActivity({
            name: presence.name,
            type: presence.type
        })
    }, 10000)
}
