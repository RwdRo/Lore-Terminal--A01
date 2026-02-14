import express from 'express';
import dotenv from 'dotenv';
import { HttpsProxyAgent } from 'https-proxy-agent';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5174;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

const WAX_RPC_ENDPOINTS = (process.env.WAX_RPC_ENDPOINTS ||
  'https://wax.greymass.com,https://wax.pink.gg,https://api.waxsweden.org')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const AW_GRAPHQL_ENDPOINTS = (process.env.AW_GRAPHQL_ENDPOINTS ||
  'https://api.alienworlds.io/graphql,https://graphql.mainnet.alienworlds.io/graphql')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const DAO_GRAPHQL_ENDPOINTS = (process.env.DAO_GRAPHQL_ENDPOINTS || 'https://dao.alienworlds.io/graphql')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 5;
const DEBUG = process.env.DEBUG === '1';

function getCached(key) {
  const item = cache.get(key);
  if (item && item.expire > Date.now()) return item.data;
  cache.delete(key);
  return null;
}

function setCached(key, data) {
  cache.set(key, { data, expire: Date.now() + CACHE_TTL });
}

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Alien-Worlds-Lore-App'
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

async function fetchWithFailover(endpoints, init) {
  let lastError;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { ...init, agent });
      if (response.ok) return { endpoint, response };
      const body = await response.text();
      lastError = new Error(`${endpoint} -> HTTP ${response.status} ${body.slice(0, 150)}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('All endpoints failed');
}

function isAllowedGitHubContentUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname !== 'api.github.com') return false;
    const allowedPath = /^\/repos\/Alien-Worlds\/the-lore\/contents\/.+/;
    return allowedPath.test(parsed.pathname);
  } catch {
    return false;
  }
}

app.use(express.json());

app.use((req, res, next) => {
  res.on('finish', () => {
    if (DEBUG) {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode}`);
    }
  });
  next();
});

app.use(express.static('public'));

app.get('/api/canon', async (req, res) => {
  const cacheKey = 'canon';
  const cached = getCached(cacheKey);
  if (cached) return res.type('text/markdown').send(cached);

  const url = 'https://api.github.com/repos/Alien-Worlds/the-lore/contents/README.md?ref=main';
  try {
    const response = await fetch(url, { headers: githubHeaders(), agent });
    const body = await response.text();
    if (response.status !== 200) {
      const note = body.slice(0, 120);
      return res.status(502).json({ error: 'Upstream GitHub error', status: response.status, note });
    }

    const json = JSON.parse(body);
    const content = Buffer.from(json.content || '', 'base64').toString('utf-8');
    setCached(cacheKey, content);
    return res.type('text/markdown').send(content);
  } catch (error) {
    return res.status(502).json({ error: 'Upstream GitHub error', status: 500, note: error.message });
  }
});

app.get('/api/proposed', async (req, res) => {
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const page = Math.floor(offset / limit) + 1;
  const url = `https://api.github.com/repos/Alien-Worlds/the-lore/pulls?state=open&sort=updated&direction=desc&per_page=${limit}&page=${page}`;
  const cacheKey = `/api/proposed?limit=${limit}&offset=${offset}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await fetch(url, { headers: githubHeaders(), agent });
    const body = await response.text();
    if (response.status !== 200) {
      const note = body.slice(0, 120);
      return res.status(502).json({ error: 'Upstream GitHub error', status: response.status, note });
    }

    const pulls = JSON.parse(body);
    const link = response.headers.get('link');
    let totalApprox;
    if (link) {
      const match = link.match(/&page=(\d+)>; rel="last"/);
      if (match) totalApprox = parseInt(match[1], 10) * limit;
    }

    const payload = { items: pulls, limit, offset, totalApprox };
    setCached(cacheKey, payload);
    return res.json(payload);
  } catch (error) {
    return res.status(502).json({ error: 'Upstream GitHub error', status: 500, note: error.message });
  }
});

app.get('/api/pulls/:number/files', async (req, res) => {
  const { number } = req.params;
  const url = `https://api.github.com/repos/Alien-Worlds/the-lore/pulls/${number}/files`;

  try {
    const response = await fetch(url, { headers: githubHeaders(), agent });
    const body = await response.text();
    if (response.status !== 200) {
      const note = body.slice(0, 120);
      return res.status(502).json({ error: 'Upstream GitHub error', status: response.status, note });
    }

    return res.json(JSON.parse(body));
  } catch (error) {
    return res.status(502).json({ error: 'Upstream GitHub error', status: 500, note: error.message });
  }
});

app.get('/api/contents', async (req, res) => {
  const { url } = req.query;
  if (!url || !isAllowedGitHubContentUrl(url)) {
    return res.status(400).json({ error: 'Invalid GitHub content URL' });
  }

  try {
    const response = await fetch(url, { headers: githubHeaders(), agent });
    const body = await response.text();
    if (response.status !== 200) {
      const note = body.slice(0, 120);
      return res.status(502).json({ error: 'Upstream GitHub error', status: response.status, note });
    }

    const json = JSON.parse(body);
    const content = Buffer.from(json.content || '', 'base64').toString('utf-8');
    return res.send(content);
  } catch (error) {
    return res.status(502).json({ error: 'Upstream GitHub error', status: 500, note: error.message });
  }
});

app.post('/api/aw/graphql', async (req, res) => {
  try {
    const { endpoint, response } = await fetchWithFailover(AW_GRAPHQL_ENDPOINTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const text = await response.text();
    res.setHeader('x-upstream-endpoint', endpoint);
    return res.status(response.status).type('application/json').send(text);
  } catch (error) {
    return res.status(502).json({ error: 'Alien Worlds GraphQL unavailable', note: error.message });
  }
});

app.post('/api/dao/graphql', async (req, res) => {
  try {
    const { endpoint, response } = await fetchWithFailover(DAO_GRAPHQL_ENDPOINTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const text = await response.text();
    res.setHeader('x-upstream-endpoint', endpoint);
    return res.status(response.status).type('application/json').send(text);
  } catch (error) {
    return res.status(502).json({ error: 'Alien Worlds DAO GraphQL unavailable', note: error.message });
  }
});

app.get('/api/wax/rpc/chain/get_info', async (_req, res) => {
  const endpoints = WAX_RPC_ENDPOINTS.map((base) => `${base}/v1/chain/get_info`);
  try {
    const { endpoint, response } = await fetchWithFailover(endpoints, { method: 'POST' });
    const text = await response.text();
    res.setHeader('x-upstream-endpoint', endpoint);
    return res.status(response.status).type('application/json').send(text);
  } catch (error) {
    return res.status(502).json({ error: 'WAX RPC unavailable', note: error.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: Date.now(), waxRpcEndpoints: WAX_RPC_ENDPOINTS });
});

app.use((req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
