import { Elysia, t } from 'elysia'
import { log } from '../../../functions/logger.js'
import { ConversationHistoryModule } from '../../../database/modules/conversationHistory.js'
import { DbEncryptionHelper } from '../../../helpers/db-encryption.helper.js'

export const chatRoute = (app, client) =>
    app.group('/chat', app =>
        app
            .post(
                '/',
                async ({ body, set, stream }) => {
                    try {
                        const { message, sessionId, context = {} } = body

                        if (!message || typeof message !== 'string') {
                            set.status = 400
                            return {
                                error: 'Message is required and must be a string',
                                code: 'INVALID_MESSAGE'
                            }
                        }

                        // Use the new streamlined method for API responses
                        if (typeof stream !== 'function') {
                            // Non-streaming response
                            log('Using non-streaming API response', 'debug')

                            const response = await client.ai.generateApiResponse({
                                message,
                                sessionId,
                                userContext: context, // Pass the context object directly
                                source: 'api'
                            })

                            if (!response.success) {
                                set.status = 500
                                return {
                                    error: response.error || 'Failed to generate response',
                                    code: 'AI_ERROR'
                                }
                            }

                            return {
                                response: response.content,
                                sessionId: (response.metadata?.sessionId || sessionId || Date.now()).toString(),
                                timestamp: new Date().toISOString(),
                                metadata: {
                                    responseTime: response.metadata?.responseTime || 0,
                                    tokensUsed: response.metadata?.tokensUsed || 0
                                }
                            }
                        } else {
                            // Streaming response
                            let aiResponseContent = ''
                            let responseTime = null,
                                tokensUsed = null
                            let actualSessionId = sessionId

                            await stream(async push => {
                                try {
                                    // Use optimized streaming API method
                                    const streamGenerator = client.ai.generateResponseStream({
                                        message,
                                        sessionId,
                                        userContext: context, // Pass the context object directly
                                        source: 'api'
                                    })

                                    for await (const chunk of streamGenerator) {
                                        if (chunk.content) {
                                            aiResponseContent += chunk.content
                                            push(chunk.content)
                                        }

                                        if (chunk.done) {
                                            // Final chunk with metadata
                                            responseTime = chunk.responseTime
                                            tokensUsed = chunk.tokensUsed
                                            actualSessionId = chunk.sessionId || actualSessionId
                                        }
                                    }
                                } catch (streamErr) {
                                    log(`Stream error: ${streamErr.message}`, 'error')
                                    push('[Error during streaming. Please try again.]')
                                }
                            })

                            // Log the interaction if systemLogger is available
                            try {
                                if (
                                    client.systemLogger &&
                                    typeof client.systemLogger.logAPIInteraction === 'function'
                                ) {
                                    await client.systemLogger.logAPIInteraction(
                                        'anonymous', // Always use 'anonymous' for API requests now
                                        'chat',
                                        {
                                            messageLength: message.length,
                                            sessionId: actualSessionId,
                                            username: context.username || 'Anonymous User'
                                        }
                                    )
                                }
                            } catch (logError) {
                                log(`Failed to log API interaction: ${logError.message}`, 'warn')
                            }

                            return {
                                response: aiResponseContent,
                                sessionId: (actualSessionId || Date.now()).toString(),
                                timestamp: new Date().toISOString(),
                                metadata: {
                                    responseTime: responseTime || 0,
                                    tokensUsed: tokensUsed || 0
                                }
                            }
                        }
                    } catch (error) {
                        log(`Chat API error: ${error.message}`, 'error')
                        set.status = 500
                        return {
                            error: 'Internal server error',
                            code: 'INTERNAL_ERROR'
                        }
                    }
                },
                {
                    body: t.Object({
                        message: t.String({ minLength: 1, maxLength: 2000 }),
                        sessionId: t.Optional(
                            t.String({ description: 'Optional session identifier for conversation continuity' })
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
                    response: {
                        200: t.Object({
                            response: t.String(),
                            sessionId: t.String(),
                            timestamp: t.String(),
                            metadata: t.Object({
                                responseTime: t.Optional(t.Number()),
                                tokensUsed: t.Optional(t.Number())
                            })
                        }),
                        400: t.Object({
                            error: t.String(),
                            code: t.String()
                        }),
                        500: t.Object({
                            error: t.String(),
                            code: t.String()
                        })
                    },
                    detail: {
                        tags: ['Chat'],
                        summary: 'Chat with Mellow',
                        description:
                            'Send a message to Mellow AI and receive a response. Use sessionId for conversation continuity and context for personalization.'
                    }
                }
            )

            .get(
                '/history/:sessionId',
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

                        // Use ConversationHistoryModule to get threaded conversation by parentId
                        let history = await client.db.conversationHistory.getThread(numericId, 50)
                        if (!history || history.length === 0) {
                            set.status = 404
                            return {
                                error: 'No chat history found for this session',
                                code: 'NOT_FOUND'
                            }
                        }

                        // We need to manually decrypt the content field as it's still encrypted
                        // This happens because the prisma findMany in getThread doesn't fully process the encryption
                        history = history.map(msg => {
                            // Check if content looks encrypted (has the encryption pattern)
                            if (typeof msg.content === 'string' && msg.content.includes('==:16:')) {
                                try {
                                    const decrypted = client.encryptionService.decrypt(msg.content)
                                    return {
                                        ...msg,
                                        content: decrypted
                                    }
                                } catch (err) {
                                    log(`Failed to decrypt message ${msg.id}: ${err.message}`, 'warn')
                                    // If decryption fails, leave as is
                                    return msg
                                }
                            }
                            return msg
                        })

                        // Format the response with basic information only
                        const formattedHistory = history.map(msg => {
                            return {
                                id: msg.id,
                                content: msg.content,
                                isAiMessage: msg.isAiResponse,
                                timestamp: msg.timestamp,
                                username: msg.metadata?.username || msg.user?.username || 'Anonymous User'
                            }
                        })

                        return {
                            sessionId,
                            history: formattedHistory
                        }
                    } catch (error) {
                        log(`Chat history API error: ${error.message}`, 'error')
                        set.status = 500
                        return {
                            error: 'Internal server error',
                            code: 'INTERNAL_ERROR'
                        }
                    }
                },
                {
                    detail: {
                        tags: ['Chat'],
                        summary: 'Get chat history',
                        description: 'Retrieve chat history for a specific session (threaded by sessionId/parentId).',
                        responses: {
                            404: {
                                description: 'No chat history found'
                            }
                        }
                    }
                }
            )
    )
