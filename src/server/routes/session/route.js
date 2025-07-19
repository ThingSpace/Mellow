import { Elysia, t } from 'elysia'
import { log } from '../../../functions/logger.js'

export const sessionRoute = (app, client) =>
    app.group('/session', app =>
        app
            // Create a new session
            .post(
                '/',
                async ({ body, set }) => {
                    try {
                        const { context = {} } = body

                        // Create an initial system message to serve as the thread parent
                        const sessionMsg = await client.db.conversationHistory.createAnonymous({
                            content: 'Session initialized',
                            isAiResponse: true,
                            contextType: 'session_init',
                            metadata: {
                                username: context.username || 'Anonymous User',
                                source: 'api',
                                ...context
                            }
                        })

                        return {
                            sessionId: sessionMsg.id.toString(),
                            created: sessionMsg.timestamp,
                            context: {
                                ...context
                            }
                        }
                    } catch (error) {
                        log(`Session creation API error: ${error.message}`, 'error')
                        set.status = 500
                        return { error: 'Failed to create session', code: 'INTERNAL_ERROR' }
                    }
                },
                {
                    body: t.Object({
                        context: t.Optional(
                            t.Object(
                                {},
                                {
                                    additionalProperties: true,
                                    description: 'Optional context information for the session'
                                }
                            )
                        )
                    }),
                    detail: {
                        tags: ['Session'],
                        summary: 'Create New Session',
                        description: 'Create a new session for conversation continuity and tracking.',
                        responses: {
                            200: {
                                description: 'Session created successfully',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                sessionId: { type: 'string' },
                                                created: { type: 'string' },
                                                context: {
                                                    type: 'object',
                                                    additionalProperties: true
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            500: {
                                description: 'Internal server error',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                error: { type: 'string' },
                                                code: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            )

            // Get session info
            .get(
                '/:sessionId',
                async ({ params, set }) => {
                    try {
                        const { sessionId } = params

                        // Get session message and any associated metadata
                        const session = await client.db.conversationHistory.findById(parseInt(sessionId, 10))

                        if (!session) {
                            set.status = 404
                            return { error: 'Session not found', code: 'NOT_FOUND' }
                        }

                        // Get message count in this thread
                        const messageCount = await client.db.conversationHistory.getThreadMessageCount(sessionId)

                        return {
                            sessionId,
                            created: session.timestamp,
                            lastActivity: session.lastActivity || session.timestamp,
                            messageCount,
                            metadata: session.metadataJson || {}
                        }
                    } catch (error) {
                        log(`Session info API error: ${error.message}`, 'error')
                        set.status = 500
                        return { error: 'Failed to retrieve session info', code: 'INTERNAL_ERROR' }
                    }
                },
                {
                    params: t.Object({
                        sessionId: t.String({ description: 'ID of the session to retrieve' })
                    }),
                    detail: {
                        tags: ['Session'],
                        summary: 'Get Session Info',
                        description: 'Retrieve information about a specific session by its ID.',
                        responses: {
                            200: {
                                description: 'Session information',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                sessionId: { type: 'string' },
                                                created: { type: 'string' },
                                                lastActivity: { type: 'string' },
                                                messageCount: { type: 'number' },
                                                metadata: {
                                                    type: 'object',
                                                    additionalProperties: true
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            404: {
                                description: 'Session not found',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                error: { type: 'string' },
                                                code: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            },
                            500: {
                                description: 'Internal server error',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                error: { type: 'string' },
                                                code: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            )
    )
