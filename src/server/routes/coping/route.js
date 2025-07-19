import { Elysia, t } from 'elysia'
import { log } from '../../../functions/logger.js'

export const copingRoute = (app, client) =>
    app.group('/coping', app =>
        app
            // Get available coping tools
            .get(
                '/tools',
                async ({ set }) => {
                    try {
                        const copingTools = [
                            {
                                id: 'breathing',
                                name: 'Breathing Exercise',
                                description: 'Guided breathing techniques for anxiety reduction'
                            },
                            {
                                id: 'grounding',
                                name: 'Grounding Techniques',
                                description: '5-4-3-2-1 sensory awareness exercise'
                            },
                            {
                                id: 'journaling',
                                name: 'Journaling Prompts',
                                description: 'Therapeutic writing prompts'
                            },
                            { id: 'meditation', name: 'Quick Meditation', description: 'Brief mindfulness meditation' },
                            {
                                id: 'gratitude',
                                name: 'Gratitude Practice',
                                description: "Focus on things you're grateful for"
                            }
                        ]

                        return { tools: copingTools }
                    } catch (error) {
                        log(`Coping tools API error: ${error.message}`, 'error')
                        set.status = 500
                        return { error: 'Failed to retrieve coping tools', code: 'INTERNAL_ERROR' }
                    }
                },
                {
                    detail: {
                        tags: ['Coping'],
                        summary: 'Get Available Coping Tools',
                        description:
                            'Retrieve a list of all available coping tools that can be used for mental health support.',
                        responses: {
                            200: {
                                description: 'List of coping tools',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                tools: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            id: { type: 'string' },
                                                            name: { type: 'string' },
                                                            description: { type: 'string' }
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

            // Get specific coping tool content
            .get(
                '/tools/:toolId',
                async ({ params, set }) => {
                    try {
                        const { toolId } = params

                        // Use AI service to generate personalized coping content
                        const toolContent = await client.ai.getCopingResponse({
                            tool: toolId,
                            feeling: null,
                            userId: null,
                            context: { isApiRequest: true }
                        })

                        return {
                            id: toolId,
                            content: toolContent
                        }
                    } catch (error) {
                        log(`Coping tool content API error: ${error.message}`, 'error')
                        set.status = 500
                        return { error: 'Failed to retrieve tool content', code: 'INTERNAL_ERROR' }
                    }
                },
                {
                    params: t.Object({
                        toolId: t.String({ description: 'ID of the coping tool to retrieve' })
                    }),
                    detail: {
                        tags: ['Coping'],
                        summary: 'Get Specific Coping Tool',
                        description: 'Retrieve detailed content for a specific coping tool by its ID.',
                        responses: {
                            200: {
                                description: 'Coping tool content',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                id: { type: 'string' },
                                                content: { type: 'string' }
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

            // Generate personalized coping response
            .post(
                '/personalized',
                async ({ body, set }) => {
                    try {
                        const { feeling, toolId, sessionId } = body

                        const response = await client.ai.getCopingResponse({
                            tool: toolId,
                            feeling,
                            userId: null,
                            context: {
                                isApiRequest: true,
                                sessionId
                            }
                        })

                        return {
                            response,
                            toolId,
                            timestamp: new Date().toISOString()
                        }
                    } catch (error) {
                        log(`Personalized coping API error: ${error.message}`, 'error')
                        set.status = 500
                        return { error: 'Failed to generate coping response', code: 'INTERNAL_ERROR' }
                    }
                },
                {
                    body: t.Object({
                        feeling: t.String({
                            minLength: 1,
                            maxLength: 100,
                            description: 'The emotion or feeling the user is experiencing'
                        }),
                        toolId: t.String({ description: 'ID of the coping tool to use' }),
                        sessionId: t.Optional(
                            t.String({ description: 'Optional session ID for conversation continuity' })
                        )
                    }),
                    detail: {
                        tags: ['Coping'],
                        summary: 'Get Personalized Coping Response',
                        description:
                            "Generate a personalized coping response based on the user's current feeling and selected tool.",
                        responses: {
                            200: {
                                description: 'Personalized coping response',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                response: { type: 'string' },
                                                toolId: { type: 'string' },
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
