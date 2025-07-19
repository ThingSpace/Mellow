import { Elysia, t } from 'elysia'
import { log } from '../../../functions/logger.js'

export const preferencesRoute = (app, client) =>
    app.group('/preferences', app =>
        app
            // Get user preferences by anonymous ID
            .get(
                '/:sessionId',
                async ({ params, set }) => {
                    try {
                        const { sessionId } = params

                        // Get preferences based on sessionId
                        const preferences = await client.db.conversationHistory.getSessionPreferences(sessionId)

                        if (!preferences) {
                            return {
                                preferences: {
                                    personality: 'gentle',
                                    theme: 'default',
                                    notifications: false
                                },
                                isDefault: true
                            }
                        }

                        return {
                            preferences,
                            isDefault: false
                        }
                    } catch (error) {
                        log(`Preferences API error: ${error.message}`, 'error')
                        set.status = 500
                        return {
                            error: 'Failed to retrieve preferences',
                            code: 'INTERNAL_ERROR'
                        }
                    }
                },
                {
                    params: t.Object({
                        sessionId: t.String({ description: 'Session ID to retrieve preferences for' })
                    }),
                    detail: {
                        tags: ['Preferences'],
                        summary: 'Get User Preferences',
                        description: 'Retrieve user preferences associated with a specific session ID.',
                        responses: {
                            200: {
                                description: 'User preferences',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                preferences: {
                                                    type: 'object',
                                                    properties: {
                                                        personality: { type: 'string' },
                                                        theme: { type: 'string' },
                                                        notifications: { type: 'boolean' }
                                                    }
                                                },
                                                isDefault: { type: 'boolean' }
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

            // Save user preferences
            .post(
                '/:sessionId',
                async ({ params, body, set }) => {
                    try {
                        const { sessionId } = params
                        const { preferences } = body

                        // Save preferences linked to this session ID
                        await client.db.conversationHistory.saveSessionPreferences(sessionId, preferences)

                        return {
                            success: true,
                            message: 'Preferences saved successfully'
                        }
                    } catch (error) {
                        log(`Save preferences API error: ${error.message}`, 'error')
                        set.status = 500
                        return {
                            error: 'Failed to save preferences',
                            code: 'INTERNAL_ERROR'
                        }
                    }
                },
                {
                    params: t.Object({
                        sessionId: t.String({ description: 'Session ID to save preferences for' })
                    }),
                    body: t.Object({
                        preferences: t.Object({
                            personality: t.Optional(
                                t.String({
                                    description: 'Preferred AI personality (gentle, supportive, direct, etc.)'
                                })
                            ),
                            theme: t.Optional(
                                t.String({
                                    description: 'UI theme preference'
                                })
                            ),
                            notifications: t.Optional(
                                t.Boolean({
                                    description: 'Whether to enable notifications'
                                })
                            )
                        })
                    }),
                    detail: {
                        tags: ['Preferences'],
                        summary: 'Save User Preferences',
                        description: 'Save user preferences associated with a specific session ID.',
                        responses: {
                            200: {
                                description: 'Preferences saved successfully',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                success: { type: 'boolean' },
                                                message: { type: 'string' }
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
