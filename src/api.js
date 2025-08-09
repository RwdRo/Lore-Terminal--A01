// api.js
const cache = { canon: null, proposed: null };

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
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
        console.log('Fetched Canon lore:', parsed.length, 'sections');
        return parsed;
    } catch (error) {
        console.error('Error fetching Canon lore:', url, error?.message);
        if (cache.canon) return cache.canon;
        throw new Error('Failed to fetch Canon lore');
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

export async function fetchProposedLore(canonSections) {
    if (cache.proposed) return cache.proposed;

    if (!canonSections || canonSections.length === 0) {
        console.warn('No Canon sections provided for filtering Proposed lore. This may lead to duplicate content.');
    }

    const pullsUrl = '/api/proposed';
    try {
        const pullsResponse = await fetchWithRetry(pullsUrl);
        const json = await pullsResponse.json();
        const pulls = Array.isArray(json.items) ? json.items : json;
        console.log('Fetched pull requests:', pulls.length, 'PRs');

        if (!Array.isArray(pulls) || pulls.length === 0) {
            console.warn('No pull requests found');
            cache.proposed = [];
            return [];
        }

        const canonHeadings = new Set(canonSections.map(section => section.title.trim().toLowerCase()));
        console.log('Canon headings for filtering:', [...canonHeadings]);

        const lorePromises = pulls.map(async (pull) => {
            const filesUrl = `/api/pulls/${pull.number}/files`;
            const filesResponse = await fetchWithRetry(filesUrl);
            const files = await filesResponse.json();
            const markdownFile = files.find(file => file.filename.endsWith('.md'));
            if (!markdownFile) {
                console.warn(`No markdown file found in PR #${pull.number}`);
                return null;
            }

            const contentResponse = await fetchWithRetry(`/api/contents?url=${encodeURIComponent(markdownFile.contents_url)}`);
            const content = await contentResponse.text();
            const parsedSections = parseMarkdown(content);

            const newSections = parsedSections.filter(section => {
                const sectionTitle = section.title.trim().toLowerCase();
                const isNew = !canonHeadings.has(sectionTitle);
                if (!isNew) {
                    console.log(`Filtered out duplicate section in PR #${pull.number}: ${section.title}`);
                }
                return isNew;
            });

            if (newSections.length === 0) {
                console.log(`No unique sections in PR #${pull.number} after filtering`);
                return null;
            }

            return {
                title: pull.title,
                status: pull.state,
                sections: newSections,
                prNumber: pull.number,
                date: pull.created_at
            };
        });

        const proposedLore = (await Promise.allSettled(lorePromises))
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value);
        console.log('Processed Proposed lore:', proposedLore);
        cache.proposed = proposedLore;
        return proposedLore;
    } catch (error) {
        console.error('Error fetching Proposed lore:', pullsUrl, error?.message);
        if (cache.proposed) return cache.proposed;
        throw new Error('Failed to fetch Proposed lore');
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