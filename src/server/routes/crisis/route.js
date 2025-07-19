import { Elysia, t } from 'elysia'
import { log } from '../../../functions/logger.js'

export const crisisRoute = (app, client) =>
    app.group('/crisis', app =>
        app
            // Get crisis resources
            .get(
                '/resources',
                async ({ set }) => {
                    try {
                        const generalResources = {
                            hotlines: [
                                {
                                    name: 'National Suicide Prevention Lifeline',
                                    number: '1-800-273-8255',
                                    description: '24/7 support for people in distress'
                                },
                                {
                                    name: 'Crisis Text Line',
                                    number: 'Text HOME to 741741',
                                    description: '24/7 crisis support via text'
                                }
                            ],
                            websites: [
                                {
                                    name: 'National Alliance on Mental Illness',
                                    url: 'https://www.nami.org',
                                    description: 'Mental health resources and education'
                                }
                            ],
                            immediateSteps: [
                                'Take slow, deep breaths',
                                'Call a trusted friend or family member',
                                'Remove yourself from triggering situations if possible'
                            ]
                        }

                        return { resources: generalResources }
                    } catch (error) {
                        log(`Crisis resources API error: ${error.message}`, 'error')
                        set.status = 500
                        return { error: 'Failed to retrieve crisis resources', code: 'INTERNAL_ERROR' }
                    }
                },
                {
                    detail: {
                        tags: ['Crisis Support'],
                        summary: 'Get Crisis Resources',
                        description: 'Retrieve general crisis support resources including hotlines and websites.',
                        responses: {
                            200: {
                                description: 'Crisis resources',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                resources: {
                                                    type: 'object',
                                                    properties: {
                                                        hotlines: {
                                                            type: 'array',
                                                            items: {
                                                                type: 'object',
                                                                properties: {
                                                                    name: { type: 'string' },
                                                                    number: { type: 'string' },
                                                                    description: { type: 'string' }
                                                                }
                                                            }
                                                        },
                                                        websites: {
                                                            type: 'array',
                                                            items: {
                                                                type: 'object',
                                                                properties: {
                                                                    name: { type: 'string' },
                                                                    url: { type: 'string' },
                                                                    description: { type: 'string' }
                                                                }
                                                            }
                                                        },
                                                        immediateSteps: {
                                                            type: 'array',
                                                            items: { type: 'string' }
                                                        }
                                                    }
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

            // Get personalized crisis support
            .post(
                '/support',
                async ({ body, set }) => {
                    try {
                        const { situation, sessionId } = body

                        // Generate personalized crisis resources using AI
                        const resources = await client.ai.getCrisisResources({
                            situation,
                            hasRecentCrisis: false,
                            crisisTrend: 'none',
                            recentEvents: 'none',
                            escalatedEvents: 'none'
                        })

                        // Log this crisis support request if we have a sessionId
                        if (sessionId) {
                            await client.db.conversationHistory.createAnonymous({
                                content: 'Crisis support requested: ' + situation.substring(0, 100) + '...',
                                isAiResponse: false,
                                contextType: 'crisis_support',
                                parent: { connect: { id: parseInt(sessionId, 10) } },
                                metadata: {
                                    type: 'crisis_request',
                                    severity: 'medium'
                                }
                            })
                        }

                        return {
                            resources,
                            timestamp: new Date().toISOString()
                        }
                    } catch (error) {
                        log(`Crisis support API error: ${error.message}`, 'error')
                        set.status = 500
                        return { error: 'Failed to generate crisis support resources', code: 'INTERNAL_ERROR' }
                    }
                },
                {
                    body: t.Object({
                        situation: t.String({
                            minLength: 1,
                            maxLength: 1000,
                            description: 'Description of the crisis situation'
                        }),
                        sessionId: t.Optional(
                            t.String({
                                description: 'Optional session ID for conversation continuity'
                            })
                        )
                    }),
                    detail: {
                        tags: ['Crisis Support'],
                        summary: 'Get Personalized Crisis Support',
                        description:
                            "Generate personalized crisis resources and support information based on the user's situation.",
                        responses: {
                            200: {
                                description: 'Personalized crisis support resources',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                resources: {
                                                    type: 'object',
                                                    properties: {
                                                        immediate: { type: 'string' },
                                                        hotlines: { type: 'string' },
                                                        coping: { type: 'string' },
                                                        longTerm: { type: 'string' }
                                                    }
                                                },
                                                timestamp: { type: 'string' }
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
