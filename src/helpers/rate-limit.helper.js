import { log } from '../functions/logger.js'

/**
 * In-memory store for rate limits
 * In production, you would use Redis or another persistent store
 */
const rateLimitStore = new Map()

/**
 * Simple rate limiter for specific routes
 */
export class RateLimitHelper {
    /**
     * Check if a request should be rate limited
     * @param {string} key - Unique identifier for the rate limit (IP, user ID, etc.)
     * @param {Object} options - Rate limit options
     * @param {number} options.maxRequests - Maximum number of requests allowed in the time window
     * @param {number} options.windowMs - Time window in milliseconds
     * @param {string} options.identifier - Identifier for logging (route name, etc.)
     * @returns {Object} - Rate limit result with success flag and retry information
     */
    static checkRateLimit(key, { maxRequests = 5, windowMs = 60000, identifier = 'unknown' } = {}) {
        const now = Date.now()
        const userKey = `${key}:${identifier}`

        // Get or initialize rate limit data
        if (!rateLimitStore.has(userKey)) {
            rateLimitStore.set(userKey, {
                count: 0,
                resetAt: now + windowMs,
                lastAccessed: now
            })
        }

        const limit = rateLimitStore.get(userKey)

        // Reset if the window has passed
        if (now > limit.resetAt) {
            limit.count = 0
            limit.resetAt = now + windowMs
        }

        // Update access time and increment count
        limit.lastAccessed = now
        limit.count++

        // Check if limit exceeded
        if (limit.count > maxRequests) {
            const retryAfter = Math.ceil((limit.resetAt - now) / 1000)
            log(`Rate limit exceeded for ${key} on ${identifier}: ${limit.count}/${maxRequests}`, 'warn')

            return {
                success: false,
                retryAfter,
                limit: maxRequests,
                remaining: 0,
                reset: limit.resetAt
            }
        }

        return {
            success: true,
            retryAfter: 0,
            limit: maxRequests,
            remaining: maxRequests - limit.count,
            reset: limit.resetAt
        }
    }

    /**
     * Clean up old rate limit entries (call periodically)
     */
    static cleanupRateLimits() {
        const now = Date.now()
        // Remove entries older than 1 hour
        for (const [key, data] of rateLimitStore.entries()) {
            if (now - data.lastAccessed > 3600000) {
                rateLimitStore.delete(key)
            }
        }
    }

    /**
     * Create Elysia middleware for specific route rate limiting
     * @param {Object} options - Rate limit options
     * @returns {Function} - Elysia middleware function
     */
    static createRateLimitMiddleware(options = {}) {
        const {
            maxRequests = 5,
            windowMs = 60000,
            identifier = 'route',
            keyGenerator = request => request.headers.get('x-forwarded-for') || 'unknown'
        } = options

        return ({ request, set }) => {
            const key = keyGenerator(request)
            const result = this.checkRateLimit(key, { maxRequests, windowMs, identifier })

            // Set rate limit headers
            set.headers['X-RateLimit-Limit'] = String(result.limit)
            set.headers['X-RateLimit-Remaining'] = String(result.remaining)
            set.headers['X-RateLimit-Reset'] = String(Math.floor(result.reset / 1000))

            if (!result.success) {
                set.status = 429
                set.headers['Retry-After'] = String(result.retryAfter)
                return {
                    error: 'Rate limit exceeded',
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: `Too many requests on ${identifier}, please try again in ${result.retryAfter} seconds`,
                    retryAfter: result.retryAfter
                }
            }
        }
    }
}

// Start a periodic cleanup
setInterval(() => RateLimitHelper.cleanupRateLimits(), 3600000) // Cleanup every hour
