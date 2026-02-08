/**
 * ========================================
 * MovieBox.ph Web API Service
 * ========================================
 * 
 * Service layer for MovieBox.ph web API (h5-api.aoneroom.com)
 * Uses SSR-extracted data from moviebox.ph website
 */

import axios from 'axios';

// API Configuration
const API_BASE = 'https://h5-api.aoneroom.com';
const WEB_BASE = 'https://moviebox.ph';
const SITE_KEY = 'mbOfficial';

// CDN URLs
export const IMAGE_CDN = 'https://pbcdnw.aoneroom.com';
export const VIDEO_CDN = 'https://bcdnxw.hakunaymatata.com';

// Default headers
const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    'Origin': WEB_BASE,
    'Referer': `${WEB_BASE}/`,
};

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: DEFAULT_HEADERS
});

/**
 * Make API request with site_key
 */
async function apiRequest(endpoint, params = {}) {
    try {
        const response = await apiClient.get(`/wefeed-h5api-bff${endpoint}`, {
            params: {
                site_key: SITE_KEY,
                ...params
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error.message);
        return {
            success: false,
            error: error.message,
            status: error.response?.status
        };
    }
}

/**
 * Get homepage data
 */
export async function getHome() {
    const result = await apiRequest('/home');

    if (result.success && result.data?.code === 0) {
        const data = result.data.data;
        return {
            success: true,
            data: {
                platformList: data.platformList || [],
                operatingList: data.operatingList || [],
                topPickList: data.topPickList || [],
                homeList: data.homeList || []
            }
        };
    }

    return result;
}

/**
 * Get movie/series detail by subjectId
 */
export async function getDetail(subjectId) {
    if (!subjectId) {
        return { success: false, error: 'subjectId is required' };
    }

    const result = await apiRequest('/detail', { subjectId });

    if (result.success && result.data?.code === 0) {
        const data = result.data.data;

        // Extract video URL from postList if available
        let videoUrl = null;
        if (data.postList?.items?.length > 0) {
            const post = data.postList.items[0];
            if (post.link?.url) {
                videoUrl = post.link.url;
            }
        }

        // Get trailer URL
        let trailerUrl = null;
        if (data.subject?.trailer?.videoAddress?.url) {
            trailerUrl = data.subject.trailer.videoAddress.url;
        }

        return {
            success: true,
            data: {
                subject: data.subject,
                stars: data.stars || [],
                resource: data.resource,
                metadata: data.metadata,
                videoUrl,
                trailerUrl,
                isForbid: data.isForbid,
                watchTimeLimit: data.watchTimeLimit
            }
        };
    }

    return result;
}

/**
 * Get video streaming URL from detail
 */
export async function getVideoSource(subjectId, season = 0, episode = 0) {
    const detail = await getDetail(subjectId);

    if (!detail.success) {
        return detail;
    }

    const { subject, videoUrl, trailerUrl, resource } = detail.data;

    // Build response with available sources
    const sources = [];

    if (videoUrl) {
        sources.push({
            type: 'full',
            url: videoUrl,
            quality: resource?.seasons?.[0]?.resolutions?.[0]?.resolution || 'unknown',
            source: resource?.source || 'unknown'
        });
    }

    if (trailerUrl) {
        sources.push({
            type: 'trailer',
            url: trailerUrl,
            quality: 'sd'
        });
    }

    return {
        success: true,
        data: {
            subjectId,
            title: subject?.title,
            hasResource: subject?.hasResource,
            sources,
            uploadBy: resource?.uploadBy
        }
    };
}

/**
 * Search movies/series using Sansekai API (more reliable than SSR scraping)
 * Falls back to SSR page scraping if Sansekai is unavailable
 */
export async function search(keyword, page = 1) {
    if (!keyword) {
        return { success: false, error: 'keyword is required' };
    }

    try {
        // Primary: Use Sansekai API (proven to work)
        const sansekaiResponse = await axios.get('https://api.sansekai.my.id/api/moviebox/search', {
            params: { query: keyword, page },
            timeout: 15000,
            headers: {
                'User-Agent': DEFAULT_HEADERS['User-Agent']
            }
        });

        if (sansekaiResponse.data && sansekaiResponse.data.items) {
            return {
                success: true,
                data: {
                    items: sansekaiResponse.data.items,
                    pager: sansekaiResponse.data.pager,
                    keyword,
                    page,
                    source: 'sansekai'
                }
            };
        }
    } catch (sansekaiError) {
        console.log('Sansekai search failed, trying SSR fallback:', sansekaiError.message);
    }

    // Fallback: SSR page scraping from moviebox.ph
    try {
        const response = await axios.get(`${WEB_BASE}/search`, {
            params: { q: keyword, page },
            headers: {
                'User-Agent': DEFAULT_HEADERS['User-Agent'],
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        // Extract movie links from HTML
        const html = response.data;
        const movieLinks = [];
        const linkPattern = /\/movie-online\/([\w-]+)/g;
        const tvPattern = /\/tv-show-online\/([\w-]+)/g;

        let match;
        while ((match = linkPattern.exec(html)) !== null) {
            movieLinks.push({ type: 'movie', detailPath: match[1] });
        }
        while ((match = tvPattern.exec(html)) !== null) {
            movieLinks.push({ type: 'tv', detailPath: match[1] });
        }

        // Remove duplicates
        const uniqueLinks = [...new Map(movieLinks.map(item => [item.detailPath, item])).values()];

        return {
            success: true,
            data: {
                items: uniqueLinks,
                page,
                keyword,
                source: 'ssr_scraping',
                note: 'Use detail API to get full info'
            }
        };

    } catch (error) {
        console.error('Search error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}


/**
 * Get trending content
 */
export async function getTrending(page = 0) {
    // Try different endpoint patterns
    const endpoints = ['/trending', '/recommend', '/popular'];

    for (const endpoint of endpoints) {
        const result = await apiRequest(endpoint, { page });
        if (result.success && result.data?.code === 0) {
            return result;
        }
    }

    // Fallback to home page operatingList
    const home = await getHome();
    if (home.success) {
        return {
            success: true,
            data: {
                items: home.data.operatingList,
                source: 'home_page'
            }
        };
    }

    return { success: false, error: 'Trending endpoint not available' };
}

/**
 * Get category list
 */
export async function getCategories() {
    const result = await apiRequest('/category');

    if (result.success && result.data?.code === 0) {
        return result;
    }

    // Fallback: Extract from home page
    const home = await getHome();
    if (home.success) {
        return {
            success: true,
            data: {
                platforms: home.data.platformList,
                source: 'home_page'
            }
        };
    }

    return { success: false, error: 'Category endpoint not available' };
}

/**
 * Browse movies by genre/type (SELF-CONTAINED, no external API)
 * @param {Object} options - Browse options
 * @param {string} options.genre - Genre filter (e.g., 'Action', 'Comedy', 'Romance')
 * @param {number} options.type - Type: 1=Movie, 2=TV Series
 * @param {number} options.page - Page number
 */
export async function browse({ genre = '', type = 1, page = 1 } = {}) {
    const params = { page };

    if (genre) params.genre = genre;
    if (type) params.type = type;

    const result = await apiRequest('/filter', params);

    if (result.success && result.data?.code === 0) {
        const data = result.data.data;
        return {
            success: true,
            data: {
                items: data.subjectList?.items || [],
                pager: data.subjectList?.pager,
                filters: data.filters,
                source: 'self_contained'
            }
        };
    }

    return result;
}

/**
 * Self-contained search fallback using filter with title matching
 * Searches through genre filter and locally filters by keyword
 */
async function searchSelfContained(keyword, page = 1) {
    // First try to browse and filter locally
    const genres = ['Action', 'Comedy', 'Drama', 'Romance', 'Horror', 'Thriller', 'Adventure'];

    try {
        // Fetch from multiple genres and filter by keyword
        const browseResult = await browse({ page, genre: '' });

        if (browseResult.success && browseResult.data.items) {
            const keywordLower = keyword.toLowerCase();
            const filtered = browseResult.data.items.filter(item =>
                item.title?.toLowerCase().includes(keywordLower) ||
                item.genre?.toLowerCase().includes(keywordLower)
            );

            if (filtered.length > 0) {
                return {
                    success: true,
                    data: {
                        items: filtered,
                        keyword,
                        page,
                        source: 'self_contained_filter'
                    }
                };
            }
        }
    } catch (e) {
        console.log('Self-contained search failed:', e.message);
    }

    return null;
}

// Export service with self-contained flag
const USE_SANSEKAI = process.env.USE_SANSEKAI !== 'false'; // Set USE_SANSEKAI=false to disable

export default {
    getHome,
    getDetail,
    getVideoSource,
    search,
    browse, // NEW: Self-contained browse by genre
    getTrending,
    getCategories,
    API_BASE,
    WEB_BASE,
    SITE_KEY,
    USE_SANSEKAI // Expose flag
};
