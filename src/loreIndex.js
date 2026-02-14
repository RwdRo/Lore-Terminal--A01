const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'this',
  'that',
  'these',
  'those',
  'is',
  'are',
  'was',
  'were',
  'be',
  'has',
  'have',
  'had',
  'they',
  'them',
  'from',
  'into',
  'about',
  'their',
  'there'
]);

function tokenize(text = '') {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function buildTagProfile(content, metadata = {}) {
  const tokenCounts = new Map();
  const metadataTokens = tokenize(`${metadata.title || ''} ${metadata.tags || ''}`);
  const contentTokens = tokenize(content);

  for (const token of [...metadataTokens, ...contentTokens]) {
    tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
  }

  const ranked = [...tokenCounts.entries()].sort((a, b) => b[1] - a[1]);
  return {
    tags: ranked.slice(0, 8).map(([token]) => token),
    tokenCounts
  };
}

function chunkContent(content, chunkSize = 700) {
  const paragraphs = content.split('\n\n').filter(Boolean);
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const paragraph of paragraphs) {
    currentChunk.push(paragraph);
    currentLength += paragraph.length;

    if (currentLength >= chunkSize) {
      chunks.push(currentChunk.join('\n\n'));
      currentChunk = [];
      currentLength = 0;
    }
  }

  if (currentChunk.length) chunks.push(currentChunk.join('\n\n'));
  return chunks.length ? chunks : [content];
}

function computeSimilarity(leftTokenCounts, rightTokenCounts) {
  let sharedWeight = 0;
  let leftWeight = 0;
  let rightWeight = 0;

  leftTokenCounts.forEach((count, token) => {
    leftWeight += count;
    if (rightTokenCounts.has(token)) {
      sharedWeight += Math.min(count, rightTokenCounts.get(token));
    }
  });

  rightTokenCounts.forEach((count) => {
    rightWeight += count;
  });

  const denominator = Math.max(leftWeight, rightWeight, 1);
  return sharedWeight / denominator;
}

export function indexLore(canonSections, proposedContents) {
  const index = {};

  canonSections.forEach((section, idx) => {
    const sectionId = `canon-${idx}`;
    const { tags, tokenCounts } = buildTagProfile(section.content, section.metadata);
    index[sectionId] = {
      ...section,
      sectionId,
      source: 'canon',
      tags,
      tokenCounts,
      chunks: chunkContent(section.content)
    };
  });

  proposedContents.forEach((proposal) => {
    proposal.sections.forEach((section, sectionIdx) => {
      const sectionId = `proposed-${proposal.prNumber}-${sectionIdx}`;
      const { tags, tokenCounts } = buildTagProfile(section.content, section.metadata);
      index[sectionId] = {
        ...section,
        sectionId,
        source: `proposed-${proposal.prNumber}`,
        tags,
        tokenCounts,
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

  return index;
}

export function extractTags(content, metadata = {}) {
  return buildTagProfile(content, metadata).tags;
}

export function searchLore(index, query, selectedTag) {
  if (!query && !selectedTag) return index;

  const results = {};
  const queryTokens = tokenize(query || '');

  for (const sectionId in index) {
    const section = index[sectionId];
    const sectionText = `${section.title || ''} ${section.content || ''}`.toLowerCase();

    const matchesQuery =
      queryTokens.length === 0 || queryTokens.every((token) => sectionText.includes(token));
    const matchesTag = selectedTag ? section.tags.includes(selectedTag.toLowerCase()) : true;

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

  for (const otherSectionId in index) {
    if (otherSectionId === sectionId) continue;
    const otherSection = index[otherSectionId];

    const sharedTags = section.tags.filter((tag) => otherSection.tags.includes(tag));
    if (!sharedTags.length) continue;

    const similarity = computeSimilarity(section.tokenCounts, otherSection.tokenCounts);
    related.push({
      sectionId: otherSectionId,
      title: otherSection.title,
      source: otherSection.source,
      sharedTags,
      similarity
    });
  }

  return related
    .sort((a, b) => b.similarity - a.similarity || b.sharedTags.length - a.sharedTags.length)
    .slice(0, 8);
}
