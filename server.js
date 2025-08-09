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

// simple in-memory cache
const cache = {
    canon: { timestamp: 0, data: null },
    proposed: {}
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Parse JSON bodies for GraphQL proxy requests
app.use(express.json());

// Serve static frontend (from Vite build output or raw public)
app.use(express.static('public'));

// === API Routes ===

app.get('/api/canon', async (req, res) => {
    try {
        const now = Date.now();
        if (cache.canon.data && now - cache.canon.timestamp < CACHE_TTL) {
            return res.type('text/markdown').send(cache.canon.data);
        }

        const headers = {
            'Accept': 'application/vnd.github.raw',
            'User-Agent': 'Alien-Worlds-Lore-App'
        };

        if (GITHUB_TOKEN) {
            headers['Authorization'] = `token ${GITHUB_TOKEN}`;
        }

        const response = await fetch('https://api.github.com/repos/Alien-Worlds/the-lore/contents/README.md?ref=main', {
            headers,
            agent
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        cache.canon = { data: text, timestamp: now };
        res.type('text/markdown').send(text);
    } catch (error) {
        console.error('Error fetching Canon lore:', error);
        res.status(500).json({ error: 'Error fetching Canon lore' });
    }
});

app.get('/api/proposed', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit || '20', 10);
        const offset = parseInt(req.query.offset || '0', 10);
        if (isNaN(limit) || isNaN(offset) || limit <= 0) {
            return res.status(400).json({ error: 'Invalid limit or offset' });
        }

        const cacheKey = `${limit}_${offset}`;
        const now = Date.now();
        if (cache.proposed[cacheKey] && now - cache.proposed[cacheKey].timestamp < CACHE_TTL) {
            return res.json(cache.proposed[cacheKey].data);
        }

        const headers = {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Alien-Worlds-Lore-App'
        };
        if (GITHUB_TOKEN) {
            headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
        }

        const page = Math.floor(offset / limit) + 1;
        const response = await fetch(`https://api.github.com/repos/Alien-Worlds/the-lore/pulls?state=all&per_page=${limit}&page=${page}`, {
            headers,
            agent
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const pulls = await response.json();
        const start = offset % limit;
        const sliced = pulls.slice(start, start + limit);
        const formatted = sliced.map(pr => ({
            number: pr.number,
            title: pr.title,
            state: pr.state,
            created_at: pr.created_at,
            merged_at: pr.merged_at,
            author: pr.user?.login,
            date: pr.created_at,
            status: pr.merged_at ? 'merged' : pr.state
        }));

        cache.proposed[cacheKey] = { data: formatted, timestamp: now };
        res.json(formatted);
    } catch (error) {
        console.error('Error fetching Proposed lore:', error);
        res.status(500).json({ error: 'Error fetching Proposed lore' });
    }
});

app.get('/api/pulls/:number/files', async (req, res) => {
    const { number } = req.params;
    try {
        const headers = {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Alien-Worlds-Lore-App'
        };
        if (GITHUB_TOKEN) {
            headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
        }
        const response = await fetch(`https://api.github.com/repos/Alien-Worlds/the-lore/pulls/${number}/files`, {
            headers,
            agent
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const files = await response.json();
        res.json(files);
    } catch (error) {
        console.error(`Error fetching files for PR #${number}:`, error);
        res.status(500).json({ error: `Error fetching files for PR #${number}` });
    }
});

app.get('/api/contents', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }
    try {
        const headers = {
            'Accept': 'application/vnd.github.raw+json',
            'User-Agent': 'Alien-Worlds-Lore-App'
        };
        if (GITHUB_TOKEN) {
            headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
        }
        const response = await fetch(url, {
            headers,
            agent
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const content = await response.text();
        res.send(content);
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ error: 'Error fetching content' });
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
        res.status(500).json({ error: 'Error fetching GraphQL data' });
    }
});

// SPA fallback — always serve index.html
app.use((req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
