import { Elysia, t } from 'elysia'
import { log } from '../../../functions/logger.js'

export const checkinRoute = (app, client) =>
    app.group('/checkin', app =>
        app
            // Submit a mood check-in
            .post(
                '/',
                async ({ body, set }) => {
                    try {
                        const { mood, intensity, note, sessionId, context = {} } = body

                        // First get or create the system user to associate with the check-in
                        const systemUserId = 1n // Default system user ID

                        // Save the check-in, associated with the session if provided
                        let checkIn

                        // Create the check-in entry directly using prisma
                        if (sessionId) {
                            // Create anonymous check-in linked to session via ConversationHistory
                            const checkInMsg = await client.db.conversationHistory.createAnonymous({
                                content: `Mood check-in: ${mood} (${intensity}/5)${note ? ` - ${note}` : ''}`,
                                isAiResponse: false,
                                contextType: 'mood_checkin',
                                parent: { connect: { id: parseInt(sessionId, 10) } },
                                metadata: {
                                    type: 'mood_checkin',
                                    mood,
                                    intensity,
                                    note,
                                    username: context.username || 'Anonymous User',
                                    ...context
                                }
                            })

                            // Then create a proper MoodCheckIn record using the system user
                            const checkInRecord = await client.db.prisma.moodCheckIn.create({
                                data: {
                                    mood,
                                    intensity,
                                    note,
                                    user: {
                                        connect: { id: systemUserId }
                                    }
                                }
                            })

                            checkIn = {
                                id: checkInMsg.id.toString(),
                                mood,
                                intensity,
                                note,
                                timestamp: checkInMsg.timestamp,
                                sessionId: sessionId.toString()
                            }
                        } else {
                            // First, create a session
                            const sessionMsg = await client.db.conversationHistory.createAnonymous({
                                content: 'Check-in session initialized',
                                isAiResponse: true,
                                contextType: 'session_init',
                                metadata: {
                                    username: context.username || 'Anonymous User',
                                    source: 'api',
                                    ...context
                                }
                            })

                            // Then create check-in message linked to this new session
                            const checkInMsg = await client.db.conversationHistory.createAnonymous({
                                content: `Mood check-in: ${mood} (${intensity}/5)${note ? ` - ${note}` : ''}`,
                                isAiResponse: false,
                                contextType: 'mood_checkin',
                                parent: { connect: { id: sessionMsg.id } },
                                metadata: {
                                    type: 'mood_checkin',
                                    mood,
                                    intensity,
                                    note,
                                    username: context.username || 'Anonymous User',
                                    ...context
                                }
                            })

                            // Create a proper MoodCheckIn record using the system user
                            const checkInRecord = await client.db.prisma.moodCheckIn.create({
                                data: {
                                    mood,
                                    intensity,
                                    note,
                                    user: {
                                        connect: { id: systemUserId }
                                    }
                                }
                            })

                            checkIn = {
                                id: checkInMsg.id.toString(),
                                mood,
                                intensity,
                                note,
                                timestamp: checkInMsg.timestamp,
                                sessionId: sessionMsg.id.toString()
                            }
                        }

                        // Generate a supportive response based on the check-in
                        const promptContext = `Generate a brief, supportive response to someone who just checked in as feeling ${mood} at an intensity of ${intensity}/5.`

                        // Add the note to the prompt if present
                        const promptWithNote = note ? `${promptContext} They added this note: "${note}"` : promptContext

                        // Add any additional context information
                        const promptWithContext = context.username
                            ? `${promptWithNote}\n\nThe user's name is ${context.username}.`
                            : promptWithNote

                        // Generate the response - fix: using the correct parameter format
                        const response = await client.ai.generateApiResponse({
                            message: promptWithContext,
                            sessionId: checkIn.sessionId,
                            userContext: {
                                username: context.username || 'Anonymous User',
                                ...context
                            },
                            source: 'checkin_api'
                        })

                        return {
                            checkIn,
                            response: response.content || "I'm here to support you.",
                            timestamp: new Date().toISOString()
                        }
                    } catch (error) {
                        log(`Check-in API error: ${error.message}`, 'error')
                        set.status = 500
                        return { error: 'Failed to save check-in', code: 'INTERNAL_ERROR' }
                    }
                },
                {
                    body: t.Object({
                        mood: t.String({
                            minLength: 1,
                            maxLength: 50,
                            description: 'Current mood or emotion'
                        }),
                        intensity: t.Number({
                            minimum: 1,
                            maximum: 5,
                            description: 'Intensity of the mood (1-5 scale)'
                        }),
                        note: t.Optional(
                            t.String({
                                maxLength: 500,
                                description: 'Optional note about the mood or context'
                            })
                        ),
                        sessionId: t.Optional(
                            t.String({
                                description: 'Optional session ID for conversation continuity'
                            })
                        ),
                        context: t.Optional(
                            t.Object(
                                {},
                                {
                                    description: 'Optional context information for personalized responses',
                                    additionalProperties: true
                                }
                            )
                        )
                    }),
                    detail: {
                        tags: ['Check-In'],
                        summary: 'Submit Mood Check-In',
                        description:
                            "Record a user's current mood and receive a supportive response based on the check-in.",
                        responses: {
                            200: {
                                description: 'Check-in recorded with supportive response',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                checkIn: {
                                                    type: 'object',
                                                    properties: {
                                                        id: { type: 'string' },
                                                        mood: { type: 'string' },
                                                        intensity: { type: 'number' },
                                                        note: { type: 'string' },
                                                        timestamp: { type: 'string' }
                                                    }
                                                },
                                                response: { type: 'string' },
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

            // Get check-in history for a session
            .get(
                '/:sessionId',
                async ({ params, set }) => {
                    try {
                        const { sessionId } = params

                        // Validate sessionId is a number
                        const numericId = parseInt(sessionId, 10)
                        if (isNaN(numericId)) {
                            set.status = 400
                            return {
                                error: 'Invalid session ID format. Must be a numeric ID.',
                                code: 'INVALID_SESSION_ID'
                            }
                        }

                        // Get all check-ins associated with this session
                        const checkIns = await client.db.conversationHistory.findMany({
                            where: {
                                parentId: numericId,
                                contextType: 'mood_checkin'
                            },
                            orderBy: { timestamp: 'desc' }
                        })

                        if (!checkIns || checkIns.length === 0) {
                            return { checkIns: [] }
                        }

                        // Format the check-ins
                        const formattedCheckIns = checkIns.map(checkIn => ({
                            id: checkIn.id.toString(),
                            mood: checkIn.metadataJson?.mood || 'unknown',
                            intensity: checkIn.metadataJson?.intensity || 3,
                            note: checkIn.metadataJson?.note || '',
                            timestamp: checkIn.timestamp,
                            username: checkIn.metadataJson?.username || 'Anonymous User'
                        }))

                        return {
                            sessionId: sessionId.toString(),
                            checkIns: formattedCheckIns
                        }
                    } catch (error) {
                        log(`Check-in history API error: ${error.message}`, 'error')
                        set.status = 500
                        return { error: 'Failed to retrieve check-in history', code: 'INTERNAL_ERROR' }
                    }
                },
                {
                    params: t.Object({
                        sessionId: t.String({ description: 'Session ID to retrieve check-in history for' })
                    }),
                    detail: {
                        tags: ['Check-In'],
                        summary: 'Get Check-In History',
                        description: 'Retrieve mood check-in history for a specific session.',
                        responses: {
                            200: {
                                description: 'Check-in history',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                sessionId: { type: 'string' },
                                                checkIns: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            id: { type: 'string' },
                                                            mood: { type: 'string' },
                                                            intensity: { type: 'number' },
                                                            note: { type: 'string' },
                                                            timestamp: { type: 'string' },
                                                            username: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            400: {
                                description: 'Invalid session ID',
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

            .get(
                '/summary/:sessionId',
                async ({ params, set }) => {
                    try {
                        const { sessionId } = params

                        // Validate sessionId
                        const numericId = parseInt(sessionId, 10)
                        if (isNaN(numericId)) {
                            set.status = 400
                            return {
                                error: 'Invalid session ID format. Must be a numeric ID.',
                                code: 'INVALID_SESSION_ID'
                            }
                        }

                        // Get all check-ins for the session
                        const checkIns = await client.db.conversationHistory.findMany({
                            where: {
                                parentId: numericId,
                                contextType: 'mood_checkin'
                            },
                            orderBy: { timestamp: 'desc' },
                            take: 10 // Last 10 check-ins
                        })

                        if (!checkIns || checkIns.length === 0) {
                            return {
                                sessionId: sessionId.toString(),
                                summary: {
                                    count: 0,
                                    message: 'No check-ins found for this session.'
                                }
                            }
                        }

                        // Calculate mood trends
                        const moodCounts = {}
                        let totalIntensity = 0

                        checkIns.forEach(checkIn => {
                            const mood = checkIn.metadataJson?.mood || 'unknown'
                            moodCounts[mood] = (moodCounts[mood] || 0) + 1
                            totalIntensity += checkIn.metadataJson?.intensity || 3
                        })

                        // Find most common mood
                        const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0]

                        // Calculate average intensity
                        const avgIntensity = (totalIntensity / checkIns.length).toFixed(1)

                        // Create summary message
                        let summaryMessage = `Based on the last ${checkIns.length} check-ins, the most common mood was "${mostCommonMood}" with an average intensity of ${avgIntensity}/5.`

                        // Add trend if we have enough data
                        if (checkIns.length >= 3) {
                            const oldestIntensity = checkIns[checkIns.length - 1].metadataJson?.intensity || 3
                            const newestIntensity = checkIns[0].metadataJson?.intensity || 3

                            if (newestIntensity < oldestIntensity) {
                                summaryMessage += ' Mood intensity appears to be improving over time.'
                            } else if (newestIntensity > oldestIntensity) {
                                summaryMessage += ' Mood intensity appears to be increasing over time.'
                            } else {
                                summaryMessage += ' Mood intensity has remained stable.'
                            }
                        }

                        return {
                            sessionId: sessionId.toString(),
                            summary: {
                                count: checkIns.length,
                                mostCommonMood,
                                averageIntensity: parseFloat(avgIntensity),
                                message: summaryMessage,
                                firstCheckIn: checkIns[checkIns.length - 1].timestamp,
                                lastCheckIn: checkIns[0].timestamp
                            }
                        }
                    } catch (error) {
                        log(`Check-in summary API error: ${error.message}`, 'error')
                        set.status = 500
                        return { error: 'Failed to generate check-in summary', code: 'INTERNAL_ERROR' }
                    }
                },
                {
                    params: t.Object({
                        sessionId: t.String({ description: 'Session ID to summarize check-ins for' })
                    }),
                    detail: {
                        tags: ['Check-In'],
                        summary: 'Get Check-In Summary',
                        description:
                            'Retrieve a summary of mood check-ins for a specific session, including trends and statistics.',
                        responses: {
                            200: {
                                description: 'Check-in summary',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                sessionId: { type: 'string' },
                                                summary: {
                                                    type: 'object',
                                                    properties: {
                                                        count: { type: 'number' },
                                                        mostCommonMood: { type: 'string' },
                                                        averageIntensity: { type: 'number' },
                                                        message: { type: 'string' },
                                                        firstCheckIn: { type: 'string' },
                                                        lastCheckIn: { type: 'string' }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            400: {
                                description: 'Invalid session ID',
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
                }
            )
    )
