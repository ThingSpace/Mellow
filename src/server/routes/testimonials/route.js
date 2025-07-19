import { Elysia, t } from 'elysia'
import { log } from '../../../functions/logger.js'

export const testimonialsRoute = (app, client) =>
    app.group('/testimonials', app =>
        app
            .get(
                '/',
                async ({ query, set }) => {
                    try {
                        const { limit = 10, page = 1 } = query
                        const offset = (parseInt(page) - 1) * parseInt(limit)

                        if (!client.db || !client.db.feedback) {
                            set.status = 503
                            return {
                                error: 'Database not available',
                                code: 'DATABASE_UNAVAILABLE'
                            }
                        }

                        // Use the feedback module's findMany method
                        const testimonials = await client.db.feedback.findMany({
                            orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
                            take: parseInt(limit),
                            skip: offset,
                            include: {
                                user: {
                                    select: {
                                        username: true
                                    }
                                }
                            }
                        })

                        // Get total count
                        const totalCount = await client.db.prisma.feedback.count()

                        const formattedTestimonials = testimonials.map(testimonial => ({
                            id: testimonial.id,
                            message: testimonial.message,
                            rating: testimonial.rating,
                            featured: testimonial.featured, // Show if it's featured or not
                            author: testimonial.user?.username ? testimonial.user.username.split('#')[0] : 'Anonymous',
                            createdAt: testimonial.createdAt.toISOString()
                        }))

                        return {
                            testimonials: formattedTestimonials,
                            pagination: {
                                page: parseInt(page),
                                limit: parseInt(limit),
                                total: totalCount,
                                pages: Math.ceil(totalCount / parseInt(limit))
                            },
                            summary: {
                                total: totalCount,
                                featured: formattedTestimonials.filter(t => t.featured).length,
                                regular: formattedTestimonials.filter(t => !t.featured).length
                            }
                        }
                    } catch (error) {
                        log(`Testimonials API error: ${error.message}`, 'error')
                        set.status = 500
                        return {
                            error: 'Failed to fetch testimonials',
                            code: 'TESTIMONIALS_ERROR'
                        }
                    }
                },
                {
                    query: t.Object({
                        limit: t.Optional(
                            t.String({
                                description: 'Number of testimonials per page (1-50)',
                                pattern: '^([1-9]|[1-4][0-9]|50)$'
                            })
                        ),
                        page: t.Optional(
                            t.String({
                                description: 'Page number',
                                pattern: '^[1-9]\\d*$'
                            })
                        )
                    }),
                    detail: {
                        tags: ['Testimonials'],
                        summary: 'Get All Testimonials',
                        description:
                            'Retrieve ALL approved public feedback as testimonials. Returns both featured and regular testimonials with pagination. Featured testimonials appear first.'
                    }
                }
            )

            .get(
                '/featured',
                async ({ set }) => {
                    try {
                        if (!client.db || !client.db.feedback) {
                            set.status = 503
                            return {
                                error: 'Database not available',
                                code: 'DATABASE_UNAVAILABLE'
                            }
                        }

                        // Get ONLY featured testimonials for this specific endpoint
                        const featuredTestimonials = await client.db.feedback.findMany({
                            where: {
                                public: true,
                                approved: true,
                                featured: true
                            },
                            orderBy: {
                                createdAt: 'desc'
                            },
                            take: 5, // Limit to top 5 featured
                            include: {
                                user: {
                                    select: {
                                        username: true
                                    }
                                }
                            }
                        })

                        // Format testimonials (already decrypted by module)
                        const formattedTestimonials = featuredTestimonials.map(testimonial => ({
                            id: testimonial.id,
                            message: testimonial.message, // Already decrypted by module
                            rating: testimonial.rating,
                            author: testimonial.user?.username ? testimonial.user.username.split('#')[0] : 'Anonymous',
                            createdAt: testimonial.createdAt.toISOString()
                        }))

                        return {
                            featured: formattedTestimonials,
                            count: formattedTestimonials.length
                        }
                    } catch (error) {
                        log(`Featured testimonials API error: ${error.message}`, 'error')
                        set.status = 500
                        return {
                            error: 'Failed to fetch featured testimonials',
                            code: 'FEATURED_TESTIMONIALS_ERROR'
                        }
                    }
                },
                {
                    detail: {
                        tags: ['Testimonials'],
                        summary: 'Get Featured Testimonials Only',
                        description:
                            'Retrieve ONLY featured testimonials (up to 5 most recent). This is a subset of the main testimonials endpoint for quick access to highlighted feedback.'
                    }
                }
            )
    )
