/**
 * ========================================
 * MovieBox.ph Web API Routes
 * ========================================
 * 
 * Express routes wrapping MovieBox.ph web API
 * Uses h5-api.aoneroom.com backend
 */

import { Router } from 'express';
import movieboxPhService from '../services/movieboxPhService.js';

const router = Router();

/**
 * GET /movieboxph/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'MovieBox.ph API',
        apiBase: movieboxPhService.API_BASE,
        siteKey: movieboxPhService.SITE_KEY,
        timestamp: Date.now()
    });
});

/**
 * GET /movieboxph/home
 * Get homepage content
 */
router.get('/home', async (req, res) => {
    try {
        const result = await movieboxPhService.getHome();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /movieboxph/detail/:subjectId
 * Get movie/series detail
 */
router.get('/detail/:subjectId', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const result = await movieboxPhService.getDetail(subjectId);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /movieboxph/sources/:subjectId
 * Get video streaming sources
 */
router.get('/sources/:subjectId', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const season = parseInt(req.query.season) || 0;
        const episode = parseInt(req.query.episode) || 0;

        const result = await movieboxPhService.getVideoSource(subjectId, season, episode);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /movieboxph/search
 * Search movies/series
 */
router.get('/search', async (req, res) => {
    try {
        const { keyword, q, page = 1 } = req.query;
        const searchKeyword = keyword || q;

        if (!searchKeyword) {
            return res.status(400).json({
                success: false,
                error: 'keyword or q parameter is required'
            });
        }

        const result = await movieboxPhService.search(searchKeyword, parseInt(page));
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /movieboxph/trending
 * Get trending content
 */
router.get('/trending', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const result = await movieboxPhService.getTrending(page);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /movieboxph/categories
 * Get category/platform list
 */
router.get('/categories', async (req, res) => {
    try {
        const result = await movieboxPhService.getCategories();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /movieboxph/browse
 * Browse movies by genre (SELF-CONTAINED, no external API)
 * Query params:
 *   - genre: Action, Comedy, Drama, Romance, Horror, Thriller, etc.
 *   - type: 1=Movie, 2=TV Series
 *   - page: Page number (default 1)
 */
router.get('/browse', async (req, res) => {
    try {
        const genre = req.query.genre || '';
        const type = parseInt(req.query.type) || 1;
        const page = parseInt(req.query.page) || 1;

        const result = await movieboxPhService.browse({ genre, type, page });
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;

