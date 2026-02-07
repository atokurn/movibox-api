/**
 * ========================================
 * MovieBox HD (Gargan) API Routes
 * ========================================
 */

import { Router } from 'express';
import movieboxService from '../services/movieboxService.js';
import client from '../lib/movieboxClient.js';

const router = Router();

// ============================================
// HEALTH & INFO
// ============================================

/**
 * Health check
 * GET /moviebox/health
 */
router.get('/health', (req, res) => {
    const context = client.getContext();
    res.json({
        status: 'ok',
        service: 'MovieBox HD API',
        version: '1.0.0',
        baseUrl: client.BASE_URL,
        deviceId: context.deviceId,
        language: context.language
    });
});

/**
 * Get app version info
 * GET /moviebox/version
 */
router.get('/version', async (req, res, next) => {
    try {
        const data = await movieboxService.getVersionInfo();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// ============================================
// HOME & DISCOVER
// ============================================

/**
 * Get home page content
 * GET /moviebox/home
 * Query: page, size, navigationId
 */
router.get('/home', async (req, res, next) => {
    try {
        const { page, size, navigationId } = req.query;
        const data = await movieboxService.getHome({
            page: parseInt(page) || 1,
            size: parseInt(size) || 10,
            navigationId: parseInt(navigationId) || 0
        });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * Get home navigation
 * GET /moviebox/navigation
 */
router.get('/navigation', async (req, res, next) => {
    try {
        const data = await movieboxService.getHomeNavigation();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * Get ranking list
 * GET /moviebox/ranking
 * Query: page, size, rankingType
 */
router.get('/ranking', async (req, res, next) => {
    try {
        const { page, size, rankingType } = req.query;
        const data = await movieboxService.getRanking({
            page: parseInt(page) || 1,
            size: parseInt(size) || 20,
            rankingType: rankingType || 'hot'
        });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// ============================================
// SEARCH
// ============================================

/**
 * Search content
 * GET /moviebox/search
 * Query: keyword (required), page, size
 */
router.get('/search', async (req, res, next) => {
    try {
        const { keyword, page, size } = req.query;

        if (!keyword) {
            return res.status(400).json({
                success: false,
                error: 'Keyword is required'
            });
        }

        const data = await movieboxService.search({
            keyword,
            page: parseInt(page) || 1,
            size: parseInt(size) || 20
        });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * Search albums
 * GET /moviebox/search/album
 */
router.get('/search/album', async (req, res, next) => {
    try {
        const { keyword, page, size } = req.query;
        const data = await movieboxService.searchAlbum({
            keyword,
            page: parseInt(page) || 1,
            size: parseInt(size) || 20
        });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * Search stars/actors
 * GET /moviebox/search/star
 */
router.get('/search/star', async (req, res, next) => {
    try {
        const { keyword, page, size } = req.query;
        const data = await movieboxService.searchStar({
            keyword,
            page: parseInt(page) || 1,
            size: parseInt(size) || 20
        });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// ============================================
// DRAMA / MOVIE DETAILS
// ============================================

/**
 * Get content details
 * GET /moviebox/detail/:contentId
 * Query: category
 */
router.get('/detail/:contentId', async (req, res, next) => {
    try {
        const { contentId } = req.params;
        const { category } = req.query;

        const data = await movieboxService.getDetail({
            contentId,
            category: parseInt(category) || 2
        });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * Get episode list
 * GET /moviebox/episodes/:contentId
 * Query: page, size
 */
router.get('/episodes/:contentId', async (req, res, next) => {
    try {
        const { contentId } = req.params;
        const { page, size } = req.query;

        const data = await movieboxService.getEpisodes({
            contentId,
            page: parseInt(page) || 1,
            size: parseInt(size) || 50
        });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// ============================================
// PLAYBACK
// ============================================

/**
 * Get play info (stream URL)
 * GET /moviebox/play/:contentId
 * Query: episodeId, category, definition
 */
router.get('/play/:contentId', async (req, res, next) => {
    try {
        const { contentId } = req.params;
        const { episodeId, category, definition } = req.query;

        const data = await movieboxService.getPlayInfo({
            contentId,
            episodeId: episodeId ? parseInt(episodeId) : undefined,
            category: parseInt(category) || 2,
            definition: definition || 'HD'
        });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// ============================================
// SHORTS
// ============================================

/**
 * Get shorts list
 * GET /moviebox/shorts
 * Query: page, size
 */
router.get('/shorts', async (req, res, next) => {
    try {
        const { page, size } = req.query;
        const data = await movieboxService.getShorts({
            page: parseInt(page) || 1,
            size: parseInt(size) || 20
        });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * Get shorts detail
 * GET /moviebox/shorts/:shortsId
 */
router.get('/shorts/:shortsId', async (req, res, next) => {
    try {
        const { shortsId } = req.params;
        const data = await movieboxService.getShortsDetail({ shortsId });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// ============================================
// CHANNEL
// ============================================

/**
 * Get channel recommendations
 * GET /moviebox/channel/pop
 */
router.get('/channel/pop', async (req, res, next) => {
    try {
        const data = await movieboxService.getChannelPop();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

export default router;
