import { Elysia } from 'elysia'
import { versionHandler } from '../../../handlers/version.js'

export const baseRoute = app =>
    app
        .get(
            '/',
            async set => {
                set.status = 200

                return {
                    message: 'Hello, welcome to the Mellow API',
                    version: versionHandler.getCurrentVersion(),
                    docs: '/docs'
                }
            },
            {
                detail: {
                    tags: ['Base'],
                    summary: 'Welcome',
                    description: 'Base route for the Mellow API. Returns a welcome message and API version.',
                    responses: {
                        200: {
                            description: 'Welcome message with API version',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            message: { type: 'string' },
                                            version: { type: 'string' },
                                            docs: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        )

        .get(
            '/health',
            async ({ set }, client) => {
                try {
                    const healthChecks = []
                    let overallStatus = 'healthy'

                    // 1. Discord Connection Health
                    const discordHealth = {
                        name: 'Discord Connection',
                        status: 'checking'
                    }

                    try {
                        const ping = client.ws.ping
                        const isReady = client.ws.status === 0

                        if (isReady && ping < 300) {
                            discordHealth.status = 'healthy'
                            discordHealth.details = `Latency: ${ping}ms • Status: Ready`
                        } else if (isReady) {
                            discordHealth.status = 'degraded'
                            discordHealth.details = `Latency: ${ping}ms • Status: High latency`
                            if (overallStatus === 'healthy') overallStatus = 'degraded'
                        } else {
                            discordHealth.status = 'unhealthy'
                            discordHealth.details = 'Connection not ready'
                            overallStatus = 'unhealthy'
                        }
                    } catch (error) {
                        discordHealth.status = 'error'
                        discordHealth.details = `Error: ${error.message}`
                        overallStatus = 'unhealthy'
                    }
                    healthChecks.push(discordHealth)

                    // 2. Database Health
                    const dbHealth = {
                        name: 'Database',
                        status: 'checking'
                    }

                    try {
                        const start = Date.now()
                        await client.db.prisma.user.count()
                        const queryTime = Date.now() - start

                        if (queryTime < 200) {
                            dbHealth.status = 'healthy'
                            dbHealth.details = `Query time: ${queryTime}ms • Connected`
                        } else if (queryTime < 1000) {
                            dbHealth.status = 'degraded'
                            dbHealth.details = `Query time: ${queryTime}ms • Slow response`
                            if (overallStatus === 'healthy') overallStatus = 'degraded'
                        } else {
                            dbHealth.status = 'unhealthy'
                            dbHealth.details = `Query time: ${queryTime}ms • Very slow`
                            overallStatus = 'unhealthy'
                        }
                    } catch (error) {
                        dbHealth.status = 'error'
                        dbHealth.details = `Connection failed: ${error.message}`
                        overallStatus = 'unhealthy'
                    }
                    healthChecks.push(dbHealth)

                    // 3. AI Service Health
                    const aiHealth = {
                        name: 'AI Service',
                        status: 'checking'
                    }

                    try {
                        const { aiService } = await import('../../../services/ai.service.js')
                        const isConnected = aiService.isConnected()
                        const metrics = aiService.performance.getMetrics()

                        if (isConnected && metrics.errorRate < 5) {
                            aiHealth.status = 'healthy'
                            aiHealth.details = `Connected • Error rate: ${metrics.errorRate.toFixed(2)}%`
                        } else if (isConnected) {
                            aiHealth.status = 'degraded'
                            aiHealth.details = `Connected • High error rate: ${metrics.errorRate.toFixed(2)}%`
                            if (overallStatus === 'healthy') overallStatus = 'degraded'
                        } else {
                            aiHealth.status = 'unhealthy'
                            aiHealth.details = 'Service unavailable'
                            overallStatus = 'unhealthy'
                        }
                    } catch (error) {
                        aiHealth.status = 'error'
                        aiHealth.details = `Service error: ${error.message}`
                        overallStatus = 'unhealthy'
                    }
                    healthChecks.push(aiHealth)

                    // 4. Memory Health
                    const memoryHealth = {
                        name: 'Memory Usage',
                        status: 'checking'
                    }

                    try {
                        const memUsage = process.memoryUsage()
                        const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024)
                        const memPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)

                        if (memUsageMB < 500) {
                            memoryHealth.status = 'healthy'
                            memoryHealth.details = `${memUsageMB}MB (${memPercent}%) • Optimal`
                        } else if (memUsageMB < 800) {
                            memoryHealth.status = 'degraded'
                            memoryHealth.details = `${memUsageMB}MB (${memPercent}%) • Moderate usage`
                            if (overallStatus === 'healthy') overallStatus = 'degraded'
                        } else {
                            memoryHealth.status = 'unhealthy'
                            memoryHealth.details = `${memUsageMB}MB (${memPercent}%) • High usage`
                            overallStatus = 'unhealthy'
                        }
                    } catch (error) {
                        memoryHealth.status = 'error'
                        memoryHealth.details = `Memory check failed: ${error.message}`
                        overallStatus = 'unhealthy'
                    }
                    healthChecks.push(memoryHealth)

                    // Calculate summary statistics
                    const healthyCount = healthChecks.filter(c => c.status === 'healthy').length
                    const degradedCount = healthChecks.filter(c => c.status === 'degraded').length
                    const unhealthyCount = healthChecks.filter(
                        c => c.status === 'unhealthy' || c.status === 'error'
                    ).length

                    // Set HTTP status based on overall health
                    if (overallStatus === 'unhealthy') {
                        set.status = 503 // Service Unavailable
                    } else if (overallStatus === 'degraded') {
                        set.status = 200 // OK but with warnings
                    } else {
                        set.status = 200 // OK
                    }

                    return {
                        status: overallStatus,
                        message: `System health: ${overallStatus}`,
                        version: versionHandler.getCurrentVersion(),
                        timestamp: new Date().toISOString(),
                        components: healthChecks.reduce((acc, check) => {
                            acc[check.name.toLowerCase().replace(/\s+/g, '_')] = {
                                status: check.status,
                                details: check.details || check.status
                            }
                            return acc
                        }, {}),
                        summary: {
                            total: healthChecks.length,
                            healthy: healthyCount,
                            degraded: degradedCount,
                            unhealthy: unhealthyCount,
                            availability:
                                overallStatus === 'healthy' ? '100%' : overallStatus === 'degraded' ? '75%' : '50%'
                        }
                    }
                } catch (error) {
                    set.status = 500
                    return {
                        status: 'error',
                        message: 'Health check failed',
                        version: versionHandler.getCurrentVersion(),
                        timestamp: new Date().toISOString(),
                        error: error.message
                    }
                }
            },
            {
                detail: {
                    tags: ['Base'],
                    summary: 'Comprehensive Health Check',
                    description:
                        'Performs a detailed health check of all system components including Discord connection, database, AI service, and memory usage.',
                    responses: {
                        200: {
                            description: 'Health check successful (healthy or degraded)',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: {
                                                type: 'string',
                                                enum: ['healthy', 'degraded', 'unhealthy', 'error'],
                                                description: 'Overall system health status'
                                            },
                                            message: { type: 'string' },
                                            version: { type: 'string' },
                                            timestamp: { type: 'string' },
                                            components: {
                                                type: 'object',
                                                description: 'Individual component health status',
                                                additionalProperties: {
                                                    type: 'object',
                                                    properties: {
                                                        status: { type: 'string' },
                                                        details: { type: 'string' }
                                                    }
                                                }
                                            },
                                            summary: {
                                                type: 'object',
                                                properties: {
                                                    total: { type: 'number' },
                                                    healthy: { type: 'number' },
                                                    degraded: { type: 'number' },
                                                    unhealthy: { type: 'number' },
                                                    availability: { type: 'string' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        500: {
                            description: 'Health check failed due to internal error',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string' },
                                            message: { type: 'string' },
                                            version: { type: 'string' },
                                            timestamp: { type: 'string' },
                                            error: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        },
                        503: {
                            description: 'Service unavailable due to unhealthy components',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string' },
                                            message: { type: 'string' },
                                            version: { type: 'string' },
                                            timestamp: { type: 'string' },
                                            components: { type: 'object' },
                                            summary: { type: 'object' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        )
