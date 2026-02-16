import express from 'express';
import cors from 'cors';
import { parse as parseUrl } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleGetData, handleUpdateData } from './api-handlers.js'; // We will create this file next

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for all routes
app.use(cors());

// API routes
app.use(express.json({ limit: '2mb' }));
app.post('/api/data', (req, res) => {
    handleGetData(req, res, req.body || {});
});
app.post('/api/update', (req, res) => {
    handleUpdateData(req, res, req.body || {});
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    app.get(/^\/(?!api).*/, (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

export const expressApp = app;
