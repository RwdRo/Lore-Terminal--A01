// server.js
import express from 'express';
import dotenv from 'dotenv';
import { HttpsProxyAgent } from 'https-proxy-agent';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5174;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 5;

function getCached(key) {
    const item = cache.get(key);
    if (item && item.expire > Date.now()) return item.data;
    cache.delete(key);
    return null;
}

function setCached(key, data) {
    cache.set(key, { data, expire: Date.now() + CACHE_TTL });
}

// Parse JSON bodies for GraphQL proxy requests
app.use(express.json());

// Serve static frontend (from Vite build output or raw public)
app.use(express.static('public'));

// === API Routes ===

app.get('/api/canon', async (req, res) => {
    const cacheKey = 'canon';
    const cached = getCached(cacheKey);
    if (cached) return res.type('text/markdown').send(cached);

    const url = 'https://api.github.com/repos/Alien-Worlds/the-lore/contents/README.md?ref=main';
    try {
        const headers = {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Alien-Worlds-Lore-App'
        };
        if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;

        const response = await fetch(url, { headers, agent });
        const body = await response.text();
        if (!response.ok) {
            console.error(`[canon] ${response.status} ${url} - ${body.slice(0,100)}`);
            const code = response.status === 403 ? 502 : response.status;
            return res.status(code).json({ error: `GitHub ${response.status}` });
        }
        const json = JSON.parse(body);
        const content = Buffer.from(json.content || '', 'base64').toString('utf-8');
        setCached(cacheKey, content);
        res.type('text/markdown').send(content);
    } catch (error) {
        console.error(`[canon] fetch failed ${url} - ${error.message}`);
        res.status(502).json({ error: 'Failed to fetch Canon lore' });
    }
});

app.get('/api/proposed', async (req, res) => {
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const offset = parseInt(req.query.offset, 10) || 0;
    const page = Math.floor(offset / limit) + 1;
    const url = `https://api.github.com/repos/Alien-Worlds/the-lore/pulls?state=open&per_page=${limit}&page=${page}`;
    const cacheKey = `/api/proposed?limit=${limit}&offset=${offset}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);
    try {
        const headers = {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Alien-Worlds-Lore-App'
        };
        if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
        const response = await fetch(url, { headers, agent });
        const body = await response.text();
        if (!response.ok) {
            console.error(`[proposed] ${response.status} ${url} - ${body.slice(0,100)}`);
            const code = response.status === 403 ? 502 : response.status;
            return res.status(code).json({ error: `GitHub ${response.status}` });
        }
        const pulls = JSON.parse(body);
        const payload = { items: pulls, limit, offset };
        setCached(cacheKey, payload);
        res.json(payload);
    } catch (error) {
        console.error(`[proposed] fetch failed ${url} - ${error.message}`);
        res.status(502).json({ error: 'Failed to fetch Proposed lore' });
    }
});

app.get('/api/pulls/:number/files', async (req, res) => {
    const { number } = req.params;
    const url = `https://api.github.com/repos/Alien-Worlds/the-lore/pulls/${number}/files`;
    try {
        const headers = {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Alien-Worlds-Lore-App'
        };
        if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
        const response = await fetch(url, { headers, agent });
        const body = await response.text();
        if (!response.ok) {
            console.error(`[pull-files] ${response.status} ${url} - ${body.slice(0,100)}`);
            const code = response.status === 403 ? 502 : response.status;
            return res.status(code).json({ error: `GitHub ${response.status}` });
        }
        const files = JSON.parse(body);
        res.json(files);
    } catch (error) {
        console.error(`[pull-files] fetch failed ${url} - ${error.message}`);
        res.status(502).json({ error: `Error fetching files for PR #${number}` });
    }
});

app.get('/api/contents', async (req, res) => {
    const { url } = req.query;
    try {
        const headers = {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Alien-Worlds-Lore-App'
        };
        if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
        const response = await fetch(url, { headers, agent });
        const body = await response.text();
        if (!response.ok) {
            console.error(`[contents] ${response.status} ${url} - ${body.slice(0,100)}`);
            const code = response.status === 403 ? 502 : response.status;
            return res.status(code).json({ error: `GitHub ${response.status}` });
        }
        const json = JSON.parse(body);
        const content = Buffer.from(json.content || '', 'base64').toString('utf-8');
        res.send(content);
    } catch (error) {
        console.error(`[contents] fetch failed ${url} - ${error.message}`);
        res.status(502).json({ error: 'Error fetching content' });
    }
});

// Proxy GraphQL requests to avoid CORS issues
app.post('/api/graphql', async (req, res) => {
    try {
        const response = await fetch('https://api.alienworlds.io/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(req.body),
            agent
        });
        const text = await response.text();
        res.status(response.status).type('application/json').send(text);
    } catch (error) {
        console.error('Error proxying GraphQL:', error);
        res.status(500).send('Error fetching GraphQL data');
    }
});

app.get('/api/health', (req, res) => {
    res.json({ ok: true, time: Date.now() });
});

// SPA fallback — always serve index.html
app.use((req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
