import { Elysia } from 'elysia'
import Mellow from '../../class/client.js'
import { baseRoute } from './base/route.js'
import { chatRoute } from './chat/route.js'
import { statsRoute } from './stats/route.js'
import { testimonialsRoute } from './testimonials/route.js'
import { checkinRoute } from './checkin/route.js'
import { copingRoute } from './coping/route.js'
import { crisisRoute } from './crisis/route.js'
import { preferencesRoute } from './preferences/route.js'
import { sessionRoute } from './session/route.js'

export const registerRoutes = (app, client) => {
    baseRoute(app)
    chatRoute(app, client)
    statsRoute(app, client)
    testimonialsRoute(app, client)
    checkinRoute(app, client)
    copingRoute(app, client)
    crisisRoute(app, client)
    preferencesRoute(app, client)
    sessionRoute(app, client)
    return app
}
