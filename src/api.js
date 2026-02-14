// api.js
const cache = { canon: null, proposed: null };

const FALLBACK_CANON_MARKDOWN = `# A-01 Canon Terminal
The archive uplink is currently degraded. Local records have been loaded as a fallback.

## Planetary Overview
The syndicates maintain control over multiple worlds while explorers recover fragments of forgotten history.

## Factions
Major factions compete for relics, governance rights, and energy routes across planetary lanes.

## Technology
Ancient vault systems and biomechanical interfaces are still being discovered.`;

const FALLBACK_PROPOSED = [
  {
    title: 'Add lore section: Neri Deep Archive',
    state: 'open',
    number: 1001,
    created_at: '2026-01-15T00:00:00Z',
    html_url: 'https://github.com/Alien-Worlds/the-lore/pull/1001',
    user: { login: 'community-scribe' },
    body: '# Neri Deep Archive\n\nA hidden current of memory vaults beneath the surface of Neri.'
  },
  {
    title: 'Expand faction timeline',
    state: 'open',
    number: 1002,
    created_at: '2026-01-18T00:00:00Z',
    html_url: 'https://github.com/Alien-Worlds/the-lore/pull/1002',
    user: { login: 'lore-keeper' },
    body: '# Faction Timeline\n\nAdds a structured chronology of faction escalations and treaties.'
  }
];

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const response = await fetch(url);
      if (response.status !== 200) throw new Error(`${url} HTTP ${response.status}`);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}

export async function fetchCanonLore() {
  if (cache.canon) return cache.canon;

  const url = '/api/canon';
  try {
    const response = await fetchWithRetry(url);
    const markdown = await response.text();
    const parsed = parseMarkdown(markdown);
    cache.canon = parsed;
    return parsed;
  } catch (error) {
    console.error('Error fetching Canon lore:', url, error?.message);
    const fallback = parseMarkdown(FALLBACK_CANON_MARKDOWN);
    cache.canon = fallback;
    return fallback;
  }
}

export async function fetchLoreFromUrl(url) {
  if (!url) throw new Error('URL is required');
  const response = await fetchWithRetry(url);
  const text = await response.text();
  let markdown = text;
  try {
    const json = JSON.parse(text);
    if (typeof json === 'string') {
      markdown = json;
    } else if (json && (json.content || json.text)) {
      markdown = json.content || json.text;
    }
  } catch {
    // not JSON, treat as markdown
  }
  return parseMarkdown(markdown);
}

function mapFallbackProposedToLore(canonSections = []) {
  const canonHeadings = new Set(canonSections.map(section => section.title.trim().toLowerCase()));
  return FALLBACK_PROPOSED.map(pull => {
    const parsedSections = parseMarkdown(pull.body || '');
    const newSections = parsedSections.filter(section => !canonHeadings.has(section.title.trim().toLowerCase()));
    return {
      title: pull.title,
      status: pull.state,
      sections: newSections,
      prNumber: pull.number,
      date: pull.created_at,
      htmlUrl: pull.html_url,
      author: pull.user?.login || 'community'
    };
  }).filter(item => item.sections.length > 0);
}

export async function fetchProposedLore(canonSections) {
  if (cache.proposed) return cache.proposed;

  if (!canonSections || canonSections.length === 0) {
    console.warn('No Canon sections provided for filtering Proposed lore.');
  }

  const pullsUrl = '/api/proposed';
  try {
    const pullsResponse = await fetchWithRetry(pullsUrl);
    const json = await pullsResponse.json();
    const pulls = Array.isArray(json.items) ? json.items : json;

    if (!Array.isArray(pulls) || pulls.length === 0) {
      cache.proposed = [];
      return [];
    }

    const canonHeadings = new Set(canonSections.map(section => section.title.trim().toLowerCase()));

    const lorePromises = pulls.map(async pull => {
      const filesUrl = `/api/pulls/${pull.number}/files`;
      const filesResponse = await fetchWithRetry(filesUrl);
      const files = await filesResponse.json();
      const markdownFile = files.find(file => file.filename.endsWith('.md'));
      if (!markdownFile) return null;

      const contentResponse = await fetchWithRetry(`/api/contents?url=${encodeURIComponent(markdownFile.contents_url)}`);
      const content = await contentResponse.text();
      const parsedSections = parseMarkdown(content);

      const newSections = parsedSections.filter(section => !canonHeadings.has(section.title.trim().toLowerCase()));
      if (newSections.length === 0) return null;

      return {
        title: pull.title,
        status: pull.state,
        sections: newSections,
        prNumber: pull.number,
        date: pull.created_at,
        htmlUrl: pull.html_url,
        author: pull.user?.login || 'community'
      };
    });

    const proposedLore = (await Promise.allSettled(lorePromises))
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value);

    cache.proposed = proposedLore;
    return proposedLore;
  } catch (error) {
    console.error('Error fetching Proposed lore:', pullsUrl, error?.message);
    const fallback = mapFallbackProposedToLore(canonSections || []);
    cache.proposed = fallback;
    return fallback;
  }
}

export function parseMarkdown(markdown) {
  if (!markdown) return [];

  const sections = [];
  const lines = markdown.split('\n');
  let currentSection = { title: '', content: [], metadata: {}, level: 1 };
  let inMetadata = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine === '---') {
      inMetadata = !inMetadata;
      continue;
    }

    if (inMetadata) {
      const [key, ...valueParts] = trimmedLine.split(':');
      const value = valueParts.join(':').trim();
      if (key && value) currentSection.metadata[key.toLowerCase()] = value;
      continue;
    }

    if (trimmedLine.startsWith('#')) {
      if (currentSection.title || currentSection.content.length) {
        sections.push({ ...currentSection, content: currentSection.content.join('\n').trim() });
      }
      const level = trimmedLine.match(/^#+/)[0].length;
      currentSection = {
        title: trimmedLine.replace(/^#+/, '').trim(),
        level,
        content: [],
        metadata: {}
      };
    } else if (trimmedLine) {
      currentSection.content.push(line);
    }
  }

  if (currentSection.title || currentSection.content.length) {
    sections.push({ ...currentSection, content: currentSection.content.join('\n').trim() });
  }

  return sections.filter(section => section.content);
}
