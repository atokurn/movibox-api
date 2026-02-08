/**
 * ========================================
 * MovieBox HD (Gargan) API - Service Layer
 * ========================================
 * 
 * API service functions for MovieBox/Gargan Video.
 */

import client from '../lib/movieboxClient.js';

// ============================================
// HOME & DISCOVER
// ============================================

/**
 * Get home page content
 * @param {Object} params
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.size - Items per page (default: 10)
 * @param {number} params.navigationId - Navigation ID (default: 0)
 */
export async function getHome(params = {}) {
    // navigationId: 7817=Home, 7818=For You (from intercepted traffic)
    const { page = 0, size = 10, navigationId = 7817 } = params;

    const response = await client.get('/gargan/homePage/getHome', {
        page,
        size,
        navigationId
    });

    return response.data;
}

/**
 * Get home navigation list
 */
export async function getHomeNavigation() {
    const response = await client.get('/gargan/homePage/navigationBar', {});
    return response.data;
}

/**
 * Get ranking/recommend list
 * @param {Object} params
 * @param {number} params.page - Page number
 * @param {number} params.size - Items per page
 * @param {string} params.rankingType - Ranking type
 */
export async function getRanking(params = {}) {
    const { page = 1, size = 20, rankingType = 'hot' } = params;

    const response = await client.post('/gargan/recommendRanking/more/v3', {
        page,
        size,
        rankingType
    });

    return response.data;
}

// ============================================
// SEARCH
// ============================================

/**
 * Search content (movies, dramas, shorts)
 * @param {Object} params
 * @param {string} params.keyword - Search keyword
 * @param {number} params.page - Page number
 * @param {number} params.size - Items per page
 * 
 * NOTE: Search endpoints may be geo-restricted. Error FDLSxl1000129 indicates
 * server-side restriction. Home endpoint works but search is blocked for
 * non-Indonesia IPs. A VPN/proxy to Indonesia may be required for search.
 */
export async function search(params = {}) {
    const { keyword, page = 1, size = 18 } = params;

    if (!keyword) {
        throw new Error('Keyword is required');
    }

    // Use v1 search endpoint from intercepted traffic
    const response = await client.post('/gargan/search/v1/search', {
        keyword,
        page,
        size
    });

    return response.data;
}

/**
 * Search with category params (from intercepted traffic)
 * @param {Object} params
 * @param {number} params.size - Items per page
 * @param {string} params.params - Category filter (TV,SETI,VARIETY,TALK,COMIC,DOCUMENTARY)
 * @param {Array} params.crTagIds - Tag IDs
 */
export async function searchWithParams(params = {}) {
    const {
        size = 18,
        catParams = 'TV,SETI,VARIETY,TALK,COMIC,DOCUMENTARY',
        crTagIds = []
    } = params;

    const response = await client.post('/gargan/search/v1/search', {
        size,
        params: catParams,
        crTagIds
    });

    return response.data;
}

/**
 * Search albums
 * @param {Object} params
 * @param {string} params.keyword - Search keyword
 * @param {number} params.page - Page number
 * @param {number} params.size - Items per page
 */
export async function searchAlbum(params = {}) {
    const { keyword, page = 1, size = 20 } = params;

    const response = await client.post('/aggregation/search/searchAlbum', {
        keyword,
        page,
        size
    });

    return response.data;
}

/**
 * Search actors/stars
 * @param {Object} params
 * @param {string} params.keyword - Search keyword
 * @param {number} params.page - Page number
 * @param {number} params.size - Items per page
 */
export async function searchStar(params = {}) {
    const { keyword, page = 1, size = 20 } = params;

    const response = await client.post('/aggregation/search/searchStar', {
        keyword,
        page,
        size
    });

    return response.data;
}

// ============================================
// DRAMA / MOVIE DETAILS
// ============================================

/**
 * Get movie/drama details
 * @param {Object} params
 * @param {string} params.contentId - Content ID
 * @param {number} params.category - Category (1=movie, 2=drama, etc)
 */
export async function getDetail(params = {}) {
    const { contentId, category = 2 } = params;

    if (!contentId) {
        throw new Error('Content ID is required');
    }

    const response = await client.get('/gargan/movieDrama/getMovieDramaPartAttr', {
        contentId,
        category
    });

    return response.data;
}

/**
 * Get episode list for drama
 * @param {Object} params
 * @param {string} params.contentId - Content ID
 * @param {number} params.page - Page number
 * @param {number} params.size - Items per page
 */
export async function getEpisodes(params = {}) {
    const { contentId, page = 1, size = 50 } = params;

    if (!contentId) {
        throw new Error('Content ID is required');
    }

    const response = await client.get('/gargan/movieDrama/getEpisodeList', {
        contentId,
        page,
        size
    });

    return response.data;
}

// ============================================
// PLAYBACK
// ============================================

/**
 * Get play info (video stream URL)
 * @param {Object} params
 * @param {string} params.contentId - Content ID
 * @param {number} params.episodeId - Episode ID (for dramas)
 * @param {number} params.category - Category
 * @param {string} params.definition - Quality (LD/SD/HD/FHD)
 */
export async function getPlayInfo(params = {}) {
    const {
        contentId,
        episodeId,
        category = 2,
        definition = 'HD',
        projection = false,
        advanced = false,
        reliableDef = 0
    } = params;

    if (!contentId) {
        throw new Error('Content ID is required');
    }

    const response = await client.get('/gargan/media/playInfo', {
        contentId,
        episodeId,
        category,
        definition,
        projection,
        advanced,
        reliableDef
    });

    return response.data;
}

// ============================================
// SHORTS
// ============================================

/**
 * Get shorts list
 * @param {Object} params
 * @param {number} params.page - Page number
 * @param {number} params.size - Items per page
 */
export async function getShorts(params = {}) {
    const { page = 1, size = 20 } = params;

    const response = await client.post('/gargan/shorts/getShortsRecommendList', {
        page,
        size
    });

    return response.data;
}

/**
 * Get shorts detail
 * @param {Object} params
 * @param {string} params.shortsId - Shorts ID
 */
export async function getShortsDetail(params = {}) {
    const { shortsId } = params;

    if (!shortsId) {
        throw new Error('Shorts ID is required');
    }

    const response = await client.get('/gargan/shorts/getShortsDetail', {
        shortsId
    });

    return response.data;
}

// ============================================
// CONFIG & INFO
// ============================================

/**
 * Get app version info
 */
export async function getVersionInfo() {
    const response = await client.get('/gargan/config/version/info/get');
    return response.data;
}

/**
 * Get channel pop recommendations
 */
export async function getChannelPop() {
    const response = await client.post('/cms/app/channel/recommend/getPop', {});
    return response.data;
}

// ============================================
// EXPORT ALL
// ============================================

export default {
    // Home
    getHome,
    getHomeNavigation,
    getRanking,

    // Search
    search,
    searchWithParams,
    searchAlbum,
    searchStar,

    // Details
    getDetail,
    getEpisodes,

    // Playback
    getPlayInfo,

    // Shorts
    getShorts,
    getShortsDetail,

    // Config
    getVersionInfo,
    getChannelPop
};
