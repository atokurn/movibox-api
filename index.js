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
import { apiReference } from '@scalar/express-api-reference';
import movieboxRoutes from './src/routes/moviebox.js';
import movieboxPhRoutes from './src/routes/movieboxph.js';
import { openApiSpec } from './src/lib/openapi.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// OpenAPI JSON endpoint
app.get('/openapi.json', (req, res) => {
    res.json(openApiSpec);
});

// API Routes - Gargan Mobile API (geo-restricted)
app.use('/moviebox', movieboxRoutes);

// API Routes - MovieBox.ph Web API (no geo-restriction, video URLs available)
app.use('/movieboxph', movieboxPhRoutes);

// Scalar API Documentation (served at root)
app.use(
    '/',
    apiReference({
        url: '/openapi.json',
        theme: 'purple',
        layout: 'modern',
        darkMode: true,
    })
);

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
  - GET  / (API Documentation)
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
