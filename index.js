/**
 * ========================================
 * MovieBox HD (Gargan) API Provider
 * ========================================
 * 
 * REST API provider for MovieBox HD / Gargan Video content.
 * 
 * Base URL: https://api.gargan.video
 * 
 * Features:
 * - Home page content
 * - Search (content, albums, stars)
 * - Drama/Movie details and episodes
 * - Video playback URLs
 * - Shorts/Reels content
 * 
 * @author Antigravity
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import movieboxRoutes from './src/routes/moviebox.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.use('/moviebox', movieboxRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'MovieBox HD API Provider',
        version: '1.0.0',
        description: 'REST API untuk MovieBox HD / Gargan Video',
        endpoints: {
            health: 'GET /moviebox/health',
            version: 'GET /moviebox/version',
            home: 'GET /moviebox/home',
            navigation: 'GET /moviebox/navigation',
            ranking: 'GET /moviebox/ranking',
            search: 'GET /moviebox/search?keyword=...',
            searchAlbum: 'GET /moviebox/search/album?keyword=...',
            searchStar: 'GET /moviebox/search/star?keyword=...',
            detail: 'GET /moviebox/detail/:contentId',
            episodes: 'GET /moviebox/episodes/:contentId',
            play: 'GET /moviebox/play/:contentId',
            shorts: 'GET /moviebox/shorts',
            shortsDetail: 'GET /moviebox/shorts/:shortsId'
        },
        source: 'Gargan Video (api.gargan.video)'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);

    // Extract useful error info
    const statusCode = err.response?.status || 500;
    const errorData = err.response?.data || null;

    res.status(statusCode >= 400 ? statusCode : 500).json({
        success: false,
        error: err.message,
        details: errorData
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
========================================
  MovieBox HD API Provider
========================================
  Server running on port ${PORT}
  
  Endpoints:
  - GET  /moviebox/health
  - GET  /moviebox/home
  - GET  /moviebox/search?keyword=...
  - GET  /moviebox/detail/:contentId
  - GET  /moviebox/play/:contentId
  - GET  /moviebox/shorts
  
  API Source: https://api.gargan.video
========================================
    `);
});

export default app;
