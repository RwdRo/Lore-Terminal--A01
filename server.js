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

// Parse JSON bodies for GraphQL proxy requests
app.use(express.json());

// Serve static frontend (from Vite build output or raw public)
app.use(express.static('public'));

// === API Routes ===

app.get('/api/canon', async (req, res) => {
    try {
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
        res.type('text/markdown').send(text);
    } catch (error) {
        console.error('Error fetching Canon lore:', error);
        res.status(500).send('Error fetching Canon lore');
    }
});

app.get('/api/proposed', async (req, res) => {
    try {
        const headers = {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Alien-Worlds-Lore-App'
        };
        if (GITHUB_TOKEN) {
            headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
        }
        const response = await fetch('https://api.github.com/repos/Alien-Worlds/the-lore/pulls?state=open&ref=main', {
            headers,
            agent
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const pulls = await response.json();
        res.json(pulls);
    } catch (error) {
        console.error('Error fetching Proposed lore:', error);
        res.status(500).send('Error fetching Proposed lore');
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
        res.status(500).send(`Error fetching files for PR #${number}`);
    }
});

app.get('/api/contents', async (req, res) => {
    const { url } = req.query;
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
        res.status(500).send('Error fetching content');
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

// SPA fallback — always serve index.html
app.use((req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
