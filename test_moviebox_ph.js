/**
 * Test MovieBox.ph Web API via scraping
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const WEB_BASE = 'https://moviebox.ph';
const API_BASE = 'https://h5-api.aoneroom.com';

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
};

/**
 * Fetch and parse MovieBox.ph page
 */
async function fetchPage(path) {
    try {
        const url = `${WEB_BASE}${path}`;
        console.log(`Fetching: ${url}`);

        const response = await axios.get(url, { headers: DEFAULT_HEADERS });
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${path}:`, error.message);
        return null;
    }
}

/**
 * Extract __NUXT_DATA__ from page
 */
function extractNuxtData(html) {
    try {
        // Cheerio for parsing
        const $ = cheerio.load(html);

        // Look for Nuxt data script
        const nuxtDataScript = $('script#__NUXT_DATA__').html();
        if (nuxtDataScript) {
            // Nuxt 3 uses a JSON array format
            const data = JSON.parse(nuxtDataScript);
            return { type: 'nuxt3', data };
        }

        // Fallback to window.__NUXT__
        const scripts = $('script').toArray();
        for (const script of scripts) {
            const content = $(script).html() || '';
            if (content.includes('window.__NUXT__')) {
                // Extract the object - this is complex due to JS syntax
                const match = content.match(/window\.__NUXT__\s*=\s*\(function\(.*?\)\{return\s*(.*?)\s*\}\)/s);
                if (match) {
                    return { type: 'nuxt2', raw: match[1] };
                }
            }
        }

        return null;
    } catch (error) {
        console.error('Error extracting Nuxt data:', error.message);
        return null;
    }
}

/**
 * Extract movie cards from HTML
 */
function extractMovieCards(html) {
    try {
        const $ = cheerio.load(html);
        const movies = [];

        // Find movie card elements
        $('a[href*="/movie-online/"]').each((i, el) => {
            const $el = $(el);
            const href = $el.attr('href');
            const img = $el.find('img').first();
            const title = img.attr('alt') || $el.find('.title').text().trim();
            const coverUrl = img.attr('src');

            if (href && title) {
                movies.push({
                    title,
                    detailPath: href.replace('/movie-online/', ''),
                    coverUrl,
                    type: 'movie'
                });
            }
        });

        $('a[href*="/tv-show-online/"]').each((i, el) => {
            const $el = $(el);
            const href = $el.attr('href');
            const img = $el.find('img').first();
            const title = img.attr('alt') || $el.find('.title').text().trim();
            const coverUrl = img.attr('src');

            if (href && title) {
                movies.push({
                    title,
                    detailPath: href.replace('/tv-show-online/', ''),
                    coverUrl,
                    type: 'tv'
                });
            }
        });

        return movies;
    } catch (error) {
        console.error('Error extracting movie cards:', error.message);
        return [];
    }
}

/**
 * Extract detail info from detail page
 */
function extractDetailInfo(html) {
    try {
        const $ = cheerio.load(html);

        // Look for JSON-LD structured data
        const jsonLd = $('script[type="application/ld+json"]').first().html();
        if (jsonLd) {
            const structured = JSON.parse(jsonLd);
            console.log('Found structured data:', structured['@type']);
        }

        // Extract basic info
        const title = $('h1').first().text().trim();
        const description = $('meta[name="description"]').attr('content');
        const ogImage = $('meta[property="og:image"]').attr('content');

        // Look for play button / sources
        const playButtons = $('button, a').filter((i, el) => {
            const text = $(el).text().toLowerCase();
            return text.includes('watch') || text.includes('play');
        }).toArray();

        return {
            title,
            description,
            coverUrl: ogImage,
            hasPlayButton: playButtons.length > 0
        };
    } catch (error) {
        console.error('Error extracting detail:', error.message);
        return null;
    }
}

/**
 * Try direct API calls
 */
async function testApiEndpoints() {
    console.log('\n=== Testing Direct API Endpoints ===\n');

    const endpoints = [
        '/api-bff/subject/search',
        '/api-bff/home',
        '/api-bff/trending',
        '/api-bff/subject/filter',
        '/api-bff/web/get-page-tdk'
    ];

    for (const endpoint of endpoints) {
        try {
            const url = `${API_BASE}${endpoint}`;
            const response = await axios.get(url, {
                headers: {
                    ...DEFAULT_HEADERS,
                    'Origin': WEB_BASE,
                    'Referer': `${WEB_BASE}/`
                },
                params: { keyword: 'love', page: 1 }
            });
            console.log(`✅ ${endpoint}: ${response.status}`);
            console.log('   Data:', JSON.stringify(response.data).substring(0, 200));
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.response?.status || error.message}`);
        }
    }
}

async function main() {
    console.log('=== Testing MovieBox.ph Scraping ===\n');

    // Test 1: Homepage
    console.log('1. Testing Homepage...');
    const homeHtml = await fetchPage('/');
    if (homeHtml) {
        const movies = extractMovieCards(homeHtml);
        console.log(`   Found ${movies.length} movie/TV cards`);
        if (movies.length > 0) {
            console.log('   Sample:', movies.slice(0, 3).map(m => m.title).join(', '));
        }

        const nuxtData = extractNuxtData(homeHtml);
        console.log('   Nuxt data type:', nuxtData?.type || 'not found');
    }

    // Test 2: Search
    console.log('\n2. Testing Search...');
    const searchHtml = await fetchPage('/search/love');
    if (searchHtml) {
        const results = extractMovieCards(searchHtml);
        console.log(`   Found ${results.length} search results`);
        if (results.length > 0) {
            console.log('   Sample:', results.slice(0, 3).map(m => m.title).join(', '));
            console.log('   First result path:', results[0].detailPath);
        }
    }

    // Test 3: Detail page
    console.log('\n3. Testing Detail Page...');
    const detailHtml = await fetchPage('/movie-online/love-iDJ5OHM7nm7');
    if (detailHtml) {
        const detail = extractDetailInfo(detailHtml);
        console.log('   Title:', detail?.title);
        console.log('   Has play button:', detail?.hasPlayButton);
    }

    // Test 4: Direct API
    await testApiEndpoints();
}

main().catch(console.error);
