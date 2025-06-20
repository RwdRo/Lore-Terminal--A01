// loreIndex.js
export function indexLore(canonSections, proposedContents) {
    const index = {};

    // Index Canon Lore
    canonSections.forEach((section, idx) => {
        const sectionId = `canon-${idx}`;
        const tags = extractTags(section.content);
        index[sectionId] = {
            ...section,
            sectionId: sectionId,
            source: 'canon',
            tags: tags,
            chunks: chunkContent(section.content)
        };
    });

    // Index Proposed Lore
    proposedContents.forEach((proposal, proposalIdx) => {
        proposal.sections.forEach((section, sectionIdx) => {
            const sectionId = `proposed-${proposal.prNumber}-${sectionIdx}`;
            const tags = extractTags(section.content);
            index[sectionId] = {
                ...section,
                sectionId: sectionId,
                source: `proposed-${proposal.prNumber}`,
                tags: tags,
                chunks: chunkContent(section.content),
                metadata: {
                    ...section.metadata,
                    prTitle: proposal.title,
                    prNumber: proposal.prNumber,
                    date: proposal.date
                }
            };
        });
    });

    console.log('Indexed sections:', index);
    console.log('Canon sections:', Object.keys(index).filter(id => index[id].source === 'canon'));
    console.log('Proposed sections:', Object.keys(index).filter(id => index[id].source.startsWith('proposed-')));

    return index;
}

export function extractTags(content) {
    const words = content.toLowerCase().split(/\W+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    const tags = words
        .filter(word => word.length > 3 && !stopWords.has(word))
        .reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});
    return Object.keys(tags).sort((a, b) => tags[b] - tags[a]).slice(0, 5);
}

function chunkContent(content) {
    const paragraphs = content.split('\n\n');
    const chunks = [];
    let currentChunk = [];

    for (const paragraph of paragraphs) {
        currentChunk.push(paragraph);
        if (currentChunk.join('\n\n').length > 500) {
            chunks.push(currentChunk.join('\n\n'));
            currentChunk = [];
        }
    }

    if (currentChunk.length) {
        chunks.push(currentChunk.join('\n\n'));
    }

    return chunks.length > 0 ? chunks : [content];
}

export function searchLore(index, query, selectedTag) {
    if (!query && !selectedTag) return index;

    const results = {};
    const queryLower = query ? query.toLowerCase() : '';

    for (const sectionId in index) {
        const section = index[sectionId];
        const matchesQuery = queryLower ? section.title.toLowerCase().includes(queryLower) || section.content.toLowerCase().includes(queryLower) : true;
        const matchesTag = selectedTag ? section.tags.includes(selectedTag) : true;

        if (matchesQuery && matchesTag) {
            results[sectionId] = section;
        }
    }

    return results;
}

export function findRelatedSections(sectionId, index) {
    const section = index[sectionId];
    if (!section) return [];

    const related = [];
    const sectionTags = new Set(section.tags);

    for (const otherSectionId in index) {
        if (otherSectionId === sectionId) continue;
        const otherSection = index[otherSectionId];
        const otherTags = new Set(otherSection.tags);
        const sharedTags = [...sectionTags].filter(tag => otherTags.has(tag));
        if (sharedTags.length > 0) {
            related.push({
                sectionId: otherSectionId,
                title: otherSection.title,
                source: otherSection.source,
                sharedTags: sharedTags
            });
        }
    }

    return related.sort((a, b) => b.sharedTags.length - a.sharedTags.length).slice(0, 5);
}