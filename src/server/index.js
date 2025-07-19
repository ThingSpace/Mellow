import dotenv from 'dotenv'
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { versionHandler } from '../handlers/version.js'
import { registerRoutes } from './routes/router.js'
import { log } from '../functions/logger.js'

// Determine port from configuration
const port = process.env.PORT || 9420
const version = versionHandler.getCurrentVersion()

// In-memory rate limiter store
const rateLimitStore = new Map()

// Rate limit configuration for different routes
const rateLimitConfig = {
    // Default rate limit: 60 requests per minute
    'default': {
        limit: 60,
        window: 60 * 1000, // 1 minute in milliseconds
        message: 'Rate limit exceeded. Please try again later.'
    },
    // Chat endpoints: 20 requests per minute
    '/chat': {
        limit: 20,
        window: 60 * 1000,
        message: 'Chat rate limit exceeded. AI resources are limited, please try again soon.'
    },
    // Check-in endpoint: 5 requests per hour
    '/checkin': {
        limit: 5,
        window: 60 * 60 * 1000, // 1 hour in milliseconds
        message: 'Check-in rate limit exceeded. You can submit another check-in later.'
    }
}

// Cleanup old rate limit entries periodically
setInterval(() => {
    const now = Date.now()
    for (const [key, data] of rateLimitStore.entries()) {
        // Remove entries that are 1 hour past their reset time
        if (now > data.resetAt + 3600000) {
            rateLimitStore.delete(key)
        }
    }
}, 3600000) // Run cleanup every hour

export async function startServer(client) {
    try {
        const app = new Elysia()
            // Add global hook for rate limiting instead of using a plugin
            .onRequest(context => {
                const { request, path, set } = context

                // Get client IP (or a unique identifier)
                const ip =
                    request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    request.headers.get('cf-connecting-ip') ||
                    'unknown'

                // Determine which rate limit config to use based on the path
                const routeConfig = Object.keys(rateLimitConfig)
                    .filter(route => path.startsWith(route))
                    .sort((a, b) => b.length - a.length)[0] // Use the most specific matching route

                const limitConfig = rateLimitConfig[routeConfig] || rateLimitConfig.default

                // Create a key that includes the path to handle different limits for different routes
                const key = `${ip}:${routeConfig || 'default'}`

                const now = Date.now()

                // Initialize or get existing limit data
                if (!rateLimitStore.has(key)) {
                    rateLimitStore.set(key, {
                        count: 0,
                        resetAt: now + limitConfig.window,
                        lastRequest: []
                    })
                }

                const limitData = rateLimitStore.get(key)

                // Reset counter if the window has passed
                if (now > limitData.resetAt) {
                    limitData.count = 0
                    limitData.resetAt = now + limitConfig.window
                    limitData.lastRequest = []
                }

                // Track request timestamps (for analytics and debugging)
                limitData.lastRequest.push(now)
                if (limitData.lastRequest.length > 10) {
                    limitData.lastRequest.shift() // Keep only last 10 requests
                }

                // Increment request counter
                limitData.count++

                // Add rate limit headers
                set.headers['X-RateLimit-Limit'] = String(limitConfig.limit)
                set.headers['X-RateLimit-Remaining'] = String(Math.max(0, limitConfig.limit - limitData.count))
                set.headers['X-RateLimit-Reset'] = String(Math.ceil(limitData.resetAt / 1000))

                // If limit exceeded, return 429 Too Many Requests
                if (limitData.count > limitConfig.limit) {
                    const retryAfter = Math.ceil((limitData.resetAt - now) / 1000)
                    set.status = 429
                    set.headers['Retry-After'] = String(retryAfter)

                    // Log rate limit hit
                    log(`Rate limit exceeded for ${ip} on ${path} (${limitData.count}/${limitConfig.limit})`, 'warn')

                    return {
                        error: limitConfig.message || 'Rate limit exceeded',
                        code: 'RATE_LIMIT_EXCEEDED',
                        retryAfter,
                        limit: limitConfig.limit
                    }
                }
            })
            .use(
                swagger({
                    path: '/docs',
                    documentation: {
                        info: {
                            title: 'Mellow API',
                            version: version,
                            description: 'RESTful API for Mellow the AI-Powered Mental Health Companion for Discord'
                        },
                        tags: [
                            {
                                name: 'Base',
                                description: 'General endpoints'
                            },
                            {
                                name: 'Chat',
                                description: 'Chat with Mellow AI'
                            },
                            {
                                name: 'Stats',
                                description: 'Bot statistics and usage data'
                            },
                            {
                                name: 'Testimonials',
                                description: 'User testimonials and feedback'
                            },
                            {
                                name: 'Check-In',
                                description: 'Mood check-in and tracking'
                            },
                            {
                                name: 'Coping',
                                description: 'Coping techniques and tools'
                            },
                            {
                                name: 'Crisis Support',
                                description: 'Crisis resources and support'
                            },
                            {
                                name: 'Preferences',
                                description: 'User preferences and settings'
                            },
                            {
                                name: 'Session',
                                description: 'Session management'
                            }
                        ]
                    }
                })
            )
            .use(a => registerRoutes(a, client))

        const server = app.listen(port)
        log(`Mellow API listening on PORT: ${port}`, 'done')
        return server
    } catch (error) {
        log(`Failed to start Mellow API: ${error.stack}`, 'error')
        log(`Bot will continue running without API server`, 'warn')
        return null
    }
}
