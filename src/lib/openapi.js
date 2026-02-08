/**
 * ========================================
 * OpenAPI Specification for MovieBox HD API
 * ========================================
 */

export const openApiSpec = {
    openapi: '3.1.0',
    info: {
        title: 'MovieBox HD API',
        version: '1.0.0',
        description: `
REST API provider for MovieBox HD / Gargan Video content.

## Features
- 🏠 Home page content with banners and sections
- 🔍 Search for movies, dramas, and actors
- 📺 Drama/Movie details and episodes
- ▶️ Video playback URLs
- 📱 Shorts/Reels content

## Base URLs
- **Gargan Mobile API**: https://api.gargan.video
- **MovieBox.ph Web API**: https://h5-api.aoneroom.com
        `,
        contact: {
            name: 'Antigravity',
        }
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Local development server'
        }
    ],
    tags: [
        { name: 'Health', description: 'Health check and version info' },
        { name: 'Home', description: 'Home page and navigation' },
        { name: 'Search', description: 'Search content, albums, and stars' },
        { name: 'Details', description: 'Movie/Drama details and episodes' },
        { name: 'Playback', description: 'Video stream URLs' },
        { name: 'Shorts', description: 'Short video content' },
        { name: 'MovieBox.ph', description: 'MovieBox.ph Web API (no geo-restriction)' }
    ],
    paths: {
        // ============================================
        // HEALTH & INFO
        // ============================================
        '/moviebox/health': {
            get: {
                tags: ['Health'],
                summary: 'Health check',
                description: 'Check API health status and current configuration',
                responses: {
                    200: {
                        description: 'API is healthy',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'ok' },
                                        service: { type: 'string', example: 'MovieBox HD API' },
                                        version: { type: 'string', example: '1.0.0' },
                                        baseUrl: { type: 'string', example: 'https://api.gargan.video' },
                                        deviceId: { type: 'string', example: '6e4e81ec362f7630' },
                                        language: { type: 'string', example: 'in_ID' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/moviebox/version': {
            get: {
                tags: ['Health'],
                summary: 'Get app version info',
                description: 'Get the latest app version information from Gargan server',
                responses: {
                    200: {
                        description: 'Version info retrieved',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessResponse' }
                            }
                        }
                    }
                }
            }
        },

        // ============================================
        // HOME & DISCOVER
        // ============================================
        '/moviebox/home': {
            get: {
                tags: ['Home'],
                summary: 'Get home page content',
                description: 'Get home page content with banners, sections, and recommendations. Uses navigationId=7817 (Home) by default.',
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        description: 'Page number (starts at 0)',
                        schema: { type: 'integer', default: 0 }
                    },
                    {
                        name: 'size',
                        in: 'query',
                        description: 'Items per page',
                        schema: { type: 'integer', default: 10 }
                    },
                    {
                        name: 'navigationId',
                        in: 'query',
                        description: 'Navigation ID (7817=Home, 7818=For You)',
                        schema: { type: 'integer', default: 7817 }
                    }
                ],
                responses: {
                    200: {
                        description: 'Home page content',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                code: { type: 'string', example: '00000' },
                                                data: {
                                                    type: 'object',
                                                    properties: {
                                                        page: { type: 'integer' },
                                                        recommendItems: {
                                                            type: 'array',
                                                            items: { $ref: '#/components/schemas/HomeSection' }
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
                }
            }
        },
        '/moviebox/navigation': {
            get: {
                tags: ['Home'],
                summary: 'Get navigation bar items',
                description: 'Get list of navigation tabs (Home, For You, etc.)',
                responses: {
                    200: {
                        description: 'Navigation list',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessResponse' }
                            }
                        }
                    }
                }
            }
        },
        '/moviebox/ranking': {
            get: {
                tags: ['Home'],
                summary: 'Get ranking list',
                description: 'Get hot/trending content ranking',
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', default: 1 }
                    },
                    {
                        name: 'size',
                        in: 'query',
                        schema: { type: 'integer', default: 20 }
                    },
                    {
                        name: 'rankingType',
                        in: 'query',
                        description: 'Ranking type',
                        schema: { type: 'string', default: 'hot' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Ranking content',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessResponse' }
                            }
                        }
                    }
                }
            }
        },

        // ============================================
        // SEARCH
        // ============================================
        '/moviebox/search': {
            get: {
                tags: ['Search'],
                summary: 'Search content',
                description: 'Search for movies, dramas, and series',
                parameters: [
                    {
                        name: 'keyword',
                        in: 'query',
                        required: true,
                        description: 'Search keyword',
                        schema: { type: 'string' }
                    },
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', default: 1 }
                    },
                    {
                        name: 'size',
                        in: 'query',
                        schema: { type: 'integer', default: 18 }
                    }
                ],
                responses: {
                    200: {
                        description: 'Search results',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                code: { type: 'string' },
                                                data: {
                                                    type: 'object',
                                                    properties: {
                                                        searchResults: {
                                                            type: 'array',
                                                            items: { $ref: '#/components/schemas/SearchResult' }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: {
                        description: 'Keyword required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' }
                            }
                        }
                    }
                }
            }
        },
        '/moviebox/search/album': {
            get: {
                tags: ['Search'],
                summary: 'Search albums',
                description: 'Search for content albums/collections',
                parameters: [
                    {
                        name: 'keyword',
                        in: 'query',
                        description: 'Search keyword',
                        schema: { type: 'string' }
                    },
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', default: 1 }
                    },
                    {
                        name: 'size',
                        in: 'query',
                        schema: { type: 'integer', default: 20 }
                    }
                ],
                responses: {
                    200: {
                        description: 'Album search results',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessResponse' }
                            }
                        }
                    }
                }
            }
        },
        '/moviebox/search/star': {
            get: {
                tags: ['Search'],
                summary: 'Search actors/stars',
                description: 'Search for actors and celebrities',
                parameters: [
                    {
                        name: 'keyword',
                        in: 'query',
                        description: 'Search keyword',
                        schema: { type: 'string' }
                    },
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', default: 1 }
                    },
                    {
                        name: 'size',
                        in: 'query',
                        schema: { type: 'integer', default: 20 }
                    }
                ],
                responses: {
                    200: {
                        description: 'Star search results',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessResponse' }
                            }
                        }
                    }
                }
            }
        },

        // ============================================
        // DETAILS
        // ============================================
        '/moviebox/detail/{contentId}': {
            get: {
                tags: ['Details'],
                summary: 'Get content details',
                description: 'Get movie or drama details including cast, synopsis, etc.',
                parameters: [
                    {
                        name: 'contentId',
                        in: 'path',
                        required: true,
                        description: 'Content ID',
                        schema: { type: 'string' }
                    },
                    {
                        name: 'category',
                        in: 'query',
                        description: 'Category (1=movie, 2=drama)',
                        schema: { type: 'integer', default: 2 }
                    }
                ],
                responses: {
                    200: {
                        description: 'Content details',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessResponse' }
                            }
                        }
                    }
                }
            }
        },
        '/moviebox/episodes/{contentId}': {
            get: {
                tags: ['Details'],
                summary: 'Get episode list',
                description: 'Get list of episodes for a drama series',
                parameters: [
                    {
                        name: 'contentId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    },
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', default: 1 }
                    },
                    {
                        name: 'size',
                        in: 'query',
                        schema: { type: 'integer', default: 50 }
                    }
                ],
                responses: {
                    200: {
                        description: 'Episode list',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessResponse' }
                            }
                        }
                    }
                }
            }
        },

        // ============================================
        // PLAYBACK
        // ============================================
        '/moviebox/play/{contentId}': {
            get: {
                tags: ['Playback'],
                summary: 'Get play info',
                description: 'Get video stream URL for playback. Note: May require valid session for some content.',
                parameters: [
                    {
                        name: 'contentId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    },
                    {
                        name: 'episodeId',
                        in: 'query',
                        description: 'Episode ID (for dramas)',
                        schema: { type: 'integer' }
                    },
                    {
                        name: 'category',
                        in: 'query',
                        schema: { type: 'integer', default: 2 }
                    },
                    {
                        name: 'definition',
                        in: 'query',
                        description: 'Video quality (LD/SD/HD/FHD)',
                        schema: { type: 'string', default: 'HD' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Play info with stream URL',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessResponse' }
                            }
                        }
                    }
                }
            }
        },

        // ============================================
        // SHORTS
        // ============================================
        '/moviebox/shorts': {
            get: {
                tags: ['Shorts'],
                summary: 'Get shorts list',
                description: 'Get list of short video content (reels)',
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', default: 1 }
                    },
                    {
                        name: 'size',
                        in: 'query',
                        schema: { type: 'integer', default: 20 }
                    }
                ],
                responses: {
                    200: {
                        description: 'Shorts list',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessResponse' }
                            }
                        }
                    }
                }
            }
        },
        '/moviebox/shorts/{shortsId}': {
            get: {
                tags: ['Shorts'],
                summary: 'Get shorts detail',
                description: 'Get detail and play URL for a shorts video',
                parameters: [
                    {
                        name: 'shortsId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Shorts detail',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessResponse' }
                            }
                        }
                    }
                }
            }
        },

        // ============================================
        // MOVIEBOX.PH WEB API
        // ============================================
        '/movieboxph/search': {
            get: {
                tags: ['MovieBox.ph'],
                summary: 'Search content (Web API)',
                description: 'Search content via MovieBox.ph web API. No geo-restriction.',
                parameters: [
                    {
                        name: 'keyword',
                        in: 'query',
                        required: true,
                        schema: { type: 'string' }
                    },
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', default: 1 }
                    }
                ],
                responses: {
                    200: {
                        description: 'Search results',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessResponse' }
                            }
                        }
                    }
                }
            }
        },
        '/movieboxph/detail/{id}': {
            get: {
                tags: ['MovieBox.ph'],
                summary: 'Get content detail (Web API)',
                description: 'Get drama/movie details via MovieBox.ph web API',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Content details',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessResponse' }
                            }
                        }
                    }
                }
            }
        },
        '/movieboxph/stream/{id}': {
            get: {
                tags: ['MovieBox.ph'],
                summary: 'Get stream URL (Web API)',
                description: 'Get video stream URL via MovieBox.ph web API. Video URLs are accessible.',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    },
                    {
                        name: 'episode',
                        in: 'query',
                        description: 'Episode number',
                        schema: { type: 'integer', default: 1 }
                    }
                ],
                responses: {
                    200: {
                        description: 'Stream URL',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                streamUrl: { type: 'string' },
                                                qualities: { type: 'array', items: { type: 'object' } }
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
    },
    components: {
        schemas: {
            SuccessResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' }
                }
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string' }
                }
            },
            HomeSection: {
                type: 'object',
                properties: {
                    homeSectionId: { type: 'integer' },
                    homeSectionName: { type: 'string', example: 'Hot Selection' },
                    homeSectionType: { type: 'string', enum: ['BANNER', 'BLOCK_GROUP', 'SINGLE_ALBUM'] },
                    recommendContentVOList: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ContentItem' }
                    }
                }
            },
            ContentItem: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 27466 },
                    title: { type: 'string', example: 'Be with You' },
                    videoName: { type: 'string' },
                    imageUrl: { type: 'string', format: 'uri' },
                    contentType: { type: 'string', enum: ['MOVIE', 'TV', 'MINISERIES'] },
                    score: { type: 'number', example: 7.8 },
                    releaseTime: { type: 'integer', example: 2004 },
                    jumpAddress: { type: 'string' }
                }
            },
            SearchResult: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string', example: 'Menangkap Keanehan' },
                    coverVerticalUrl: { type: 'string', format: 'uri' },
                    subType: { type: 'string', enum: ['TV', 'MINISERIES', 'MOVIE'] },
                    resourceNum: { type: 'integer', example: 105 },
                    score: { type: 'string' }
                }
            }
        }
    }
};
