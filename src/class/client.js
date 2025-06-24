import Discord, { Client, Collection, Partials, GatewayIntentBits } from 'discord.js'
import { aiService } from '../services/ai.service.js'
import { setClientPresence } from '../handlers/presence.js'
import { MessageHandler } from '../handlers/messages.js'
import { cmdTypes } from '../configs/cmdTypes.config.js'
import { db } from '../database/client.js'
import deploy from '../handlers/deploy.js'
import commands from '../handlers/commands.js'
import events from '../handlers/events.js'

class Mellow extends Client {
    slash = new Collection()
    private = new Collection()
    select = new Collection()
    modal = new Collection()
    button = new Collection()
    autocomplete = new Collection()
    context = new Collection()

    cooldowns = new Collection()
    triggers = new Collection()

    applicationCommandsArray = []

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.DirectMessageReactions,
                GatewayIntentBits.DirectMessageTyping,
                GatewayIntentBits.GuildModeration
            ],
            partials: [
                Partials.Channel,
                Partials.DirectMessages,
                Partials.DirectMessageReactions,
                Partials.DirectMessageTyping,
                Partials.GuildMember,
                Partials.GuildScheduledEvent,
                Partials.Message,
                Partials.Reaction,
                Partials.ThreadMember,
                Partials.User
            ],
            allowedMentions: {
                parse: ['users', 'roles', 'everyone'],
                repliedUser: true
            }
        })

        this.Gateway = Discord

        this.db = db
        this.rpc = { presence: setClientPresence }

        this.ai = aiService

        this.msgHandler = new MessageHandler(this)

        this.cmd_types = cmdTypes

        this.logo = 'https://codemeapixel.dev/mellow/mellow.png'
        this.footer = 'Mellow - Your AI Mental Health Companion'

        this.colors = {
            primary: '#7289DA',
            error: '#FF0000',
            success: '#00FF00',
            warning: '#FFFF00'
        }
    }

    start = async () => {
        await events(this)
        await commands(this)
        await deploy(this)

        await this.login(process.env.TOKEN)
    }
}

export default Mellow
