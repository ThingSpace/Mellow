import { Elysia } from 'elysia'
import { log } from '../../../functions/logger.js'
import { versionHandler } from '../../../handlers/version.js'

export const statsRoute = (app, client) =>
    app.group('/stats', app =>
        app
            .get(
                '/',
                async ({ set }) => {
                    try {
                        const stats = {
                            bot: {
                                uptime: process.uptime(),
                                version: versionHandler.getCurrentVersion()
                            },
                            database: {},
                            features: {}
                        }

                        // Get database statistics if available
                        if (client.db) {
                            try {
                                const [userCount, guildCount, checkInCount, crisisEventCount, feedbackCount] =
                                    await Promise.all([
                                        client.db.prisma.user.count(),
                                        client.db.prisma.guild.count(),
                                        client.db.prisma.moodCheckIn.count(),
                                        client.db.prisma.crisisEvent.count(),
                                        client.db.prisma.feedback.count()
                                    ])

                                stats.database = {
                                    users: userCount,
                                    guilds: guildCount,
                                    checkIns: checkInCount,
                                    crisisEvents: crisisEventCount,
                                    feedback: feedbackCount
                                }
                            } catch (dbError) {
                                log(`Database stats error: ${dbError.message}`, 'warn')
                                stats.database.error = 'Unable to fetch database statistics'
                            }
                        }

                        // Get feature statistics using the correct module method
                        try {
                            const mellowConfig = await client.db.mellow.get() // This is correct based on the modules
                            stats.features = {
                                checkInTools: mellowConfig.checkInTools,
                                copingTools: mellowConfig.copingTools,
                                ghostTools: mellowConfig.ghostTools,
                                crisisTools: mellowConfig.crisisTools,
                                aiEnabled: mellowConfig.enabled
                            }
                        } catch (configError) {
                            log(`Config stats error: ${configError.message}`, 'warn')
                            stats.features.error = 'Unable to fetch feature configuration'
                        }

                        return {
                            timestamp: new Date().toISOString(),
                            ...stats
                        }
                    } catch (error) {
                        log(`Stats API error: ${error.message}`, 'error')
                        set.status = 500
                        return {
                            error: 'Failed to fetch statistics',
                            code: 'STATS_ERROR'
                        }
                    }
                },
                {
                    detail: {
                        tags: ['Stats'],
                        summary: 'Bot Statistics',
                        description: 'Get comprehensive statistics about Mellow bot usage and features.',
                        responses: {
                            200: {
                                description: 'Bot statistics',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                timestamp: { type: 'string' },
                                                bot: {
                                                    type: 'object',
                                                    properties: {
                                                        guilds: { type: 'number' },
                                                        users: { type: 'number' },
                                                        uptime: { type: 'number' },
                                                        version: { type: 'string' }
                                                    }
                                                },
                                                database: {
                                                    type: 'object',
                                                    properties: {
                                                        users: { type: 'number' },
                                                        guilds: { type: 'number' },
                                                        checkIns: { type: 'number' },
                                                        crisisEvents: { type: 'number' },
                                                        feedback: { type: 'number' }
                                                    }
                                                },
                                                features: {
                                                    type: 'object',
                                                    properties: {
                                                        checkInTools: { type: 'boolean' },
                                                        copingTools: { type: 'boolean' },
                                                        ghostTools: { type: 'boolean' },
                                                        crisisTools: { type: 'boolean' },
                                                        aiEnabled: { type: 'boolean' }
                                                    }
                                                }
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
                '/usage',
                async ({ set }) => {
                    try {
                        // Get usage statistics over time
                        const thirtyDaysAgo = new Date()
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

                        const usageStats = {
                            period: '30_days',
                            checkIns: {},
                            crisisEvents: {},
                            feedback: {}
                        }

                        if (client.db) {
                            try {
                                // Get check-in statistics using correct table name
                                const checkInStats = await client.db.prisma.moodCheckIn.groupBy({
                                    by: ['createdAt'],
                                    where: {
                                        createdAt: {
                                            gte: thirtyDaysAgo
                                        }
                                    },
                                    _count: {
                                        id: true
                                    }
                                })

                                usageStats.checkIns = {
                                    total: checkInStats.reduce((sum, stat) => sum + stat._count.id, 0),
                                    dailyBreakdown: checkInStats.length
                                }

                                // Get crisis event statistics
                                const crisisStats = await client.db.prisma.crisisEvent.groupBy({
                                    by: ['escalated'],
                                    where: {
                                        detectedAt: {
                                            gte: thirtyDaysAgo
                                        }
                                    },
                                    _count: {
                                        id: true
                                    }
                                })

                                usageStats.crisisEvents = {
                                    total: crisisStats.reduce((sum, stat) => sum + stat._count.id, 0),
                                    escalated: crisisStats
                                        .filter(stat => stat.escalated)
                                        .reduce((sum, stat) => sum + stat._count.id, 0)
                                }

                                // Get feedback statistics
                                const feedbackStats = await client.db.prisma.feedback.groupBy({
                                    by: ['approved'],
                                    where: {
                                        createdAt: {
                                            gte: thirtyDaysAgo
                                        }
                                    },
                                    _count: {
                                        id: true
                                    }
                                })

                                usageStats.feedback = {
                                    total: feedbackStats.reduce((sum, stat) => sum + stat._count.id, 0),
                                    approved: feedbackStats
                                        .filter(stat => stat.approved)
                                        .reduce((sum, stat) => sum + stat._count.id, 0)
                                }
                            } catch (dbError) {
                                log(`Usage stats database error: ${dbError.message}`, 'warn')
                                usageStats.error = 'Unable to fetch detailed usage statistics'
                            }
                        }

                        return usageStats
                    } catch (error) {
                        log(`Usage stats API error: ${error.message}`, 'error')
                        set.status = 500
                        return {
                            error: 'Failed to fetch usage statistics',
                            code: 'USAGE_STATS_ERROR'
                        }
                    }
                },
                {
                    detail: {
                        tags: ['Stats'],
                        summary: 'Usage Statistics',
                        description: 'Get detailed usage statistics over the past 30 days.',
                        responses: {
                            200: {
                                description: 'Usage statistics'
                            }
                        }
                    }
                }
            )
    )
