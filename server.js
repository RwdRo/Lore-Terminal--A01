// server.js
const express = require('express');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const path = require('path');

dotenv.config();
const app = express();
const PORT = 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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
            headers
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
        const response = await fetch('https://api.github.com/repos/Alien-Worlds/the-lore/pulls?state=open&ref=main', {
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'User-Agent': 'Alien-Worlds-Lore-App'
            }
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
        const response = await fetch(`https://api.github.com/repos/Alien-Worlds/the-lore/pulls/${number}/files`, {
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'User-Agent': 'Alien-Worlds-Lore-App'
            }
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
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.raw+json',
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'User-Agent': 'Alien-Worlds-Lore-App'
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const content = await response.text();
        res.send(content);
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).send('Error fetching content');
    }
});

// SPA fallback — always serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
