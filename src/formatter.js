// formatter.js
// Utility functions for lore markdown formatting

export function formatText(text = '') {
    return text
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(Boolean)
        .join('\n\n');
}

export function withFrontMatter(markdown) {
    const front = '---\ntitle: \ntags: []\n---\n\n';
    return front + markdown;
}
