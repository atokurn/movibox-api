/**
 * ========================================
 * MovieBox.ph Web API - HTTP Client
 * ========================================
 * 
 * Client for moviebox.ph web API (h5-api.aoneroom.com)
 * This is different from the Gargan mobile API
 */

import axios from 'axios';

// API Configuration
export const API_BASE = 'https://h5-api.aoneroom.com';
export const WEB_BASE = 'https://moviebox.ph';
export const IMAGE_CDN = 'https://pbcdnw.aoneroom.com';
export const VIDEO_CDN = 'https://bcdnxw.hakunaymatata.com';

/**
 * Default headers untuk web API
 */
const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    'Origin': WEB_BASE,
    'Referer': `${WEB_BASE}/`,
};

/**
 * Create axios instance for web API
 */
const webClient = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: DEFAULT_HEADERS
});

/**
 * Create axios instance for scraping moviebox.ph pages
 */
const scrapingClient = axios.create({
    baseURL: WEB_BASE,
    timeout: 30000,
    headers: {
        'User-Agent': DEFAULT_HEADERS['User-Agent'],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
    }
});

/**
 * Extract __NUXT__ data from HTML
 */
function extractNuxtData(html) {
    try {
        // Find window.__NUXT__ = {...}
        const match = html.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*?\})(?:\s*<\/script>|\s*;?\s*window\.)/);
        if (match && match[1]) {
            // This is actually a complex object, might need eval or safer parsing
            // For now, let's extract JSON-like content
            const jsonStr = match[1];
            return JSON.parse(jsonStr);
        }

        // Alternative pattern for Nuxt 3
        const match2 = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (match2 && match2[1]) {
            return JSON.parse(match2[1]);
        }

        return null;
    } catch (error) {
        console.error('Error extracting Nuxt data:', error.message);
        return null;
    }
}

/**
 * Parse subject data from Nuxt payload
 */
function parseSubjectFromPayload(data) {
    if (!data) return null;

    try {
        // Navigate through Nuxt data structure
        const payload = data.data || data;

        // Find subject or items
        if (payload.subject) return payload.subject;
        if (payload.items) return payload.items;
        if (payload.searchResult) return payload.searchResult;

        return payload;
    } catch (error) {
        return null;
    }
}

/**
 * GET request to web API
 */
export async function get(endpoint, params = {}) {
    return webClient.get(endpoint, { params });
}

/**
 * POST request to web API
 */
export async function post(endpoint, data = {}) {
    return webClient.post(endpoint, data);
}

/**
 * Scrape a page and extract Nuxt data
 */
export async function scrapePage(path) {
    const response = await scrapingClient.get(path);
    return {
        html: response.data,
        nuxtData: extractNuxtData(response.data),
        status: response.status
    };
}

/**
 * Search movies/TV shows via page scraping
 */
export async function searchViaScraping(keyword, page = 1) {
    const path = `/search/${encodeURIComponent(keyword)}?page=${page}`;
    const result = await scrapePage(path);
    return parseSubjectFromPayload(result.nuxtData);
}

/**
 * Get homepage data via scraping
 */
export async function getHomeViaScraping() {
    const result = await scrapePage('/');
    return parseSubjectFromPayload(result.nuxtData);
}

/**
 * Get movie/series detail via scraping
 */
export async function getDetailViaScraping(detailPath) {
    const path = `/movie-online/${detailPath}`;
    const result = await scrapePage(path);
    return parseSubjectFromPayload(result.nuxtData);
}

/**
 * Test if simple API endpoints work
 */
export async function testApiEndpoint(endpoint, params = {}) {
    try {
        const response = await webClient.get(endpoint, { params });
        return {
            success: true,
            status: response.status,
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            status: error.response?.status,
            error: error.message
        };
    }
}

export default {
    get,
    post,
    scrapePage,
    searchViaScraping,
    getHomeViaScraping,
    getDetailViaScraping,
    testApiEndpoint,
    API_BASE,
    WEB_BASE,
    IMAGE_CDN,
    VIDEO_CDN
};
