// library.js
import { fetchCanonLore, fetchProposedLore } from './api.js';
import { indexLore, searchLore, findRelatedSections } from './loreIndex.js';

const DEFAULT_TAGS = [
    'planets',
    'factions',
    'technology',
    'history',
    'economy',
    'politics',
    'species',
    'events',
    'culture',
    'characters'
];

let authPromise;
function getAuth() {
    if (!authPromise) authPromise = import('./auth.js');
    return authPromise;
}

export class Library {
    constructor() {
        this.elements = {
            loreContent: document.querySelector('.lore-content'),
            loading: document.querySelector('.lore-content .loading'),
            toggleBtn: document.querySelector('.toggle-btn'),
            searchInput: document.querySelector('#searchInput'),
            bookmarkFilter: document.querySelector('#bookmarkFilter'),
            backToTopBtn: document.querySelector('.back-to-top'),
            breadcrumbs: document.querySelector('#breadcrumbs')
        };
        this.state = {
            currentMode: 'canon',
            loreData: { canon: [], proposed: [] },
            index: {},
            currentSections: {},
            currentSectionIds: [],
            currentSectionIndex: 0,
            currentChunkIndex: 0,
            selectedTag: null,
            isTyping: false,
            showBookmarksOnly: false,
            bookmarks: new Set()
        };
        this.sectionButtons = [];
        this.wallet = sessionStorage.getItem('WAX_WALLET');
        this.bookmarkKey = `A01_BOOKMARKS_${this.wallet || 'anon'}`;
        this.loadBookmarks();
        getAuth().then(({ onAuthChange }) => {
            onAuthChange(wallet => {
                this.wallet = wallet;
                this.setBookmarkKey(wallet);
                this.loadBookmarks();
                if (this.elements.bookmarkFilter) this.elements.bookmarkFilter.checked = false;
                this.state.showBookmarksOnly = false;
                this.renderLore();
            });
        });
    }

    setBookmarkKey(wallet) {
        this.bookmarkKey = `A01_BOOKMARKS_${wallet || 'anon'}`;
    }

    loadBookmarks() {
        const data = JSON.parse(localStorage.getItem(this.bookmarkKey) || '[]');
        this.state.bookmarks = new Set(data);
    }

    saveBookmarks() {
        localStorage.setItem(this.bookmarkKey, JSON.stringify([...this.state.bookmarks]));
    }

    async init() {
        try {
            this.elements.loading.style.display = 'block';

            this.state.loreData.canon = await fetchCanonLore() || [];
            this.state.loreData.proposed = await fetchProposedLore(this.state.loreData.canon) || [];

            this.state.index = indexLore(this.state.loreData.canon, this.state.loreData.proposed);
            this.state.currentSections = this.state.index;
            this.state.currentSectionIds = Object.keys(this.state.index).filter(id => this.state.index[id].source === 'canon');

            this.setupNavPanel();
            this.renderTagList();
            await this.renderLore();
        } catch (error) {
            this.elements.loreContent.innerHTML = `<div class="error">Error loading lore: ${error.message}. Please try again later.</div>`;
        } finally {
            this.elements.loading.style.display = 'none';
        }

        this.elements.toggleBtn.addEventListener('click', () => this.toggleMode());
        this.elements.searchInput.addEventListener('input', debounce(() => this.handleSearch(), 300));
        this.elements.backToTopBtn.addEventListener('click', () => this.scrollToTop());
        if (this.elements.bookmarkFilter) {
            this.elements.bookmarkFilter.addEventListener('change', () => {
                this.state.showBookmarksOnly = this.elements.bookmarkFilter.checked;
                this.handleSearch();
            });
        }
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
    }

    setupNavPanel() {
        const nav = document.querySelector('#loreNav');
        this.updateNavPanel(nav);
    }
    updateNavPanel(nav) {
        nav.innerHTML = '';
        this.sectionButtons = [];

        if (this.state.currentMode === 'proposed') {
            this.state.loreData.proposed.forEach((pr) => {
                const button = document.createElement('button');
                button.textContent = pr.title;
                button.className = 'nav-heading';
                button.dataset.pr = pr.prNumber;
                nav.appendChild(button);
                this.sectionButtons.push(button);
                button.addEventListener('click', () => {
                    const targetId = this.state.currentSectionIds.find(id => id.startsWith(`proposed-${pr.prNumber}`));
                    if (targetId) {
                        this.state.currentSectionIndex = this.state.currentSectionIds.indexOf(targetId);
                        this.state.currentChunkIndex = 0;
                        this.renderLore();
                    }
                });
            });
            this.updateActiveButton();
            return;
        }

        this.state.currentSectionIds.forEach((sectionId, index) => {
            const section = this.state.currentSections[sectionId];
            const button = document.createElement('button');
            button.textContent = section.title;
            button.dataset.sectionIndex = index;
            button.className = section.level === 1 ? 'nav-heading' : 'nav-subheading';
            button.dataset.level = section.level;
            button.style.marginLeft = `${(section.level - 1) * 1}rem`;
            button.setAttribute('aria-label', `Navigate to ${section.title}`);

            if (section.level > 1) button.classList.add('hidden-subheading');

            nav.appendChild(button);
            this.sectionButtons.push(button);

            button.addEventListener('click', () => {
                const idx = parseInt(button.dataset.sectionIndex);
                const level = parseInt(button.dataset.level);

                if (level === 1) {
                    button.classList.toggle('expanded');
                    let nextButton = button.nextElementSibling;
                    while (nextButton && parseInt(nextButton.dataset.level) > 1) {
                        nextButton.classList.toggle('hidden-subheading');
                        nextButton = nextButton.nextElementSibling;
                    }
                }

                this.state.currentSectionIndex = idx;
                this.state.currentChunkIndex = 0;
                this.renderLore();
            });
        });

        this.updateActiveButton();
    }

    updateActiveButton() {
        if (this.sectionButtons[this.state.currentSectionIndex]) {
            this.sectionButtons.forEach(btn => btn.classList.remove('active'));
            this.sectionButtons[this.state.currentSectionIndex].classList.add('active');
            this.sectionButtons[this.state.currentSectionIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    renderTagList() {
        const tagList = document.getElementById('tagList');
        const extraList = document.getElementById('tagExtra');
        const extraWrap = document.getElementById('extraTags');
        if (!tagList) return;

        const tagCounts = {};
        Object.values(this.state.index).forEach(sec => {
            sec.tags.forEach(t => {
                tagCounts[t] = (tagCounts[t] || 0) + 1;
            });
        });
        let sorted = Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).map(([t])=>t);
        if (sorted.length === 0) {
            sorted = DEFAULT_TAGS;
        }
        const mainTags = sorted.slice(0,8);
        const extraTags = sorted.slice(8);

        const buildBtn = tag => {
            const btn = document.createElement('button');
            btn.textContent = tag;
            if (this.state.selectedTag === tag) btn.classList.add('active');
            btn.addEventListener('click', () => {
                if (this.state.selectedTag === tag) {
                    this.state.selectedTag = null;
                    btn.classList.remove('active');
                } else {
                    this.state.selectedTag = tag;
                    document.querySelectorAll('#tagList button, #tagExtra button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
                this.handleSearch();
            });
            return btn;
        };

        tagList.innerHTML = '';
        extraList.innerHTML = '';
        mainTags.forEach(t => tagList.appendChild(buildBtn(t)));
        extraTags.forEach(t => extraList.appendChild(buildBtn(t)));
        if (extraTags.length) {
            extraWrap.style.display = 'block';
            extraWrap.open = false;
            if (extraTags.length > 20) {
                extraWrap.querySelector('summary').textContent = 'Show Filters';
            }
        } else if (extraWrap) {
            extraWrap.style.display = 'none';
        }
    }

    async typeText(element, text) {
        element.innerHTML = '';
        element.classList.add('typing');
        this.state.isTyping = true;
        const speed = 30;

        const completeTyping = () => {
            this.state.isTyping = false;
            element.innerHTML = text;
            element.classList.remove('typing');
        };

        element.addEventListener('click', completeTyping, { once: true });

        for (let i = 0; i < text.length && this.state.isTyping; i++) {
            element.innerHTML = text.substring(0, i + 1);
            await new Promise(resolve => setTimeout(resolve, speed));
        }

        if (!this.state.isTyping) return;
        this.state.isTyping = false;
        element.classList.remove('typing');
    }

    renderMarkdown(text) {
        return text
            .replace(/(?:\*|_)(.*?)(?:\*|_)/g, '<em>$1</em>')
            .replace(/(?:\*\*|__)(.*?)(?:\*\*|__)/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }
    async renderLore() {
        this.elements.loreContent.innerHTML = '';

        if (!this.state.currentSectionIds.length) {
            this.elements.loreContent.innerHTML = `<p>No ${this.state.currentMode} lore entries found.</p>`;
            return;
        }

        const sectionId = this.state.currentSectionIds[this.state.currentSectionIndex];
        const section = this.state.currentSections[sectionId];
        if (!section) {
            this.elements.loreContent.innerHTML = `<p>Error: Section not found.</p>`;
            return;
        }

        section.chunks = section.chunks || [section.content];
        this.state.currentChunkIndex = Math.min(this.state.currentChunkIndex, section.chunks.length - 1);

        const chunk = section.chunks[this.state.currentChunkIndex];
        const renderedChunk = this.renderMarkdown(chunk);
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('lore-entry');
        const bookmarked = this.state.bookmarks.has(sectionId);
        if (bookmarked) entryDiv.classList.add('bookmarked');
        const disabled = !this.wallet;
        entryDiv.innerHTML = `
            <button class="bookmark-btn ${bookmarked ? 'active' : ''} ${disabled ? 'disabled' : ''}" aria-label="Bookmark">${bookmarked ? '★' : '☆'}</button>
            <h${section.level}>${section.title}</h${section.level}>
            <div class="lore-text"></div>
            ${section.metadata.author ? `<div class="metadata">Author: ${section.metadata.author} <button class="author-btn" disabled>View</button></div>` : ''}
            ${section.metadata.date ? `<div class="metadata">Date: ${section.metadata.date}</div>` : ''}
            ${section.metadata.prTitle ? `<div class="metadata">PR: ${section.metadata.prTitle} (#${section.metadata.prNumber})</div>` : ''}
        `;
        this.elements.loreContent.appendChild(entryDiv);

        const loreText = entryDiv.querySelector('.lore-text');
        await this.typeText(loreText, renderedChunk);

        const markBtn = entryDiv.querySelector('.bookmark-btn');
        if (disabled) {
            markBtn.title = 'Login to save bookmarks';
            markBtn.disabled = true;
        } else {
            markBtn.addEventListener('click', () => {
                if (this.state.bookmarks.has(sectionId)) {
                    this.state.bookmarks.delete(sectionId);
                    markBtn.textContent = '☆';
                    markBtn.classList.remove('active');
                    entryDiv.classList.remove('bookmarked');
                } else {
                    this.state.bookmarks.add(sectionId);
                    markBtn.textContent = '★';
                    markBtn.classList.add('active');
                    entryDiv.classList.add('bookmarked');
                }
                this.saveBookmarks();
            });
        }

        const navDiv = document.createElement('div');
        navDiv.className = 'chunk-nav';
        const isFirst = this.state.currentChunkIndex === 0 && this.state.currentSectionIndex === 0;
        const isLast = this.state.currentChunkIndex === section.chunks.length - 1 && this.state.currentSectionIndex === this.state.currentSectionIds.length - 1;
        navDiv.innerHTML = `
            <button class="nav-btn prev-btn" ${isFirst ? 'disabled' : ''} aria-label="Previous Section or Chunk">Previous</button>
            <span class="progress">Section ${this.state.currentSectionIndex + 1}/${this.state.currentSectionIds.length}, Chunk ${this.state.currentChunkIndex + 1}/${section.chunks.length}</span>
            <button class="nav-btn next-btn" ${isLast ? 'disabled' : ''} aria-label="Next Section or Chunk">Next</button>
        `;
        this.elements.loreContent.appendChild(navDiv);

        const relatedSections = findRelatedSections(sectionId, this.state.index);
        if (relatedSections.length) {
            const relatedDiv = document.createElement('div');
            relatedDiv.className = 'related-sections';
            relatedDiv.innerHTML = '<h3>Related Sections:</h3><ul></ul>';
            const ul = relatedDiv.querySelector('ul');
            relatedSections.forEach(related => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" data-section-id="${related.sectionId}" aria-label="Navigate to ${related.title}">${related.title} (${related.source}) - Tags: ${related.sharedTags.join(', ')}</a>`;
                ul.appendChild(li);
            });
            this.elements.loreContent.appendChild(relatedDiv);

            relatedDiv.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const relatedIndex = this.state.currentSectionIds.indexOf(link.dataset.sectionId);
                    if (relatedIndex !== -1) {
                        this.state.currentSectionIndex = relatedIndex;
                        this.state.currentChunkIndex = 0;
                        this.renderLore();
                    }
                });
            });
        }

        const commentDiv = document.createElement('div');
        commentDiv.className = 'comments-placeholder';
        commentDiv.innerHTML = '<em>Comment threads coming soon...</em>';
        this.elements.loreContent.appendChild(commentDiv);

        navDiv.querySelector('.prev-btn').addEventListener('click', () => this.showPreviousChunk());
        navDiv.querySelector('.next-btn').addEventListener('click', () => this.showNextChunk());

        this.updateActiveButton();
        this.updateBreadcrumbs(section);
    }
    updateBreadcrumbs(section) {
        this.elements.breadcrumbs.innerHTML = '';
        const crumbs = [
            {
                label: this.state.currentMode.charAt(0).toUpperCase() + this.state.currentMode.slice(1),
                action: () => this.toggleMode()
            }
        ];

        let parentSection = null;
        for (let i = this.state.currentSectionIndex - 1; i >= 0; i--) {
            const prevSection = this.state.currentSections[this.state.currentSectionIds[i]];
            if (prevSection.level < section.level) {
                parentSection = prevSection;
                break;
            }
        }

        if (parentSection) {
            crumbs.push({
                label: parentSection.title,
                action: () => {
                    this.state.currentSectionIndex = this.state.currentSectionIds.indexOf(
                        Object.keys(this.state.index).find(id => this.state.index[id] === parentSection)
                    );
                    this.state.currentChunkIndex = 0;
                    this.renderLore();
                }
            });
        }

        crumbs.push({ label: section.title });

        crumbs.forEach((crumb, index) => {
            const span = document.createElement('span');
            span.className = 'breadcrumb';
            if (crumb.action) {
                const link = document.createElement('a');
                link.href = '#';
                link.textContent = crumb.label;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    crumb.action();
                });
                span.appendChild(link);
            } else {
                span.textContent = crumb.label;
            }
            this.elements.breadcrumbs.appendChild(span);
            if (index < crumbs.length - 1) {
                this.elements.breadcrumbs.appendChild(document.createTextNode(' > '));
            }
        });
    }

    toggleMode() {
        this.state.currentMode = this.state.currentMode === 'canon' ? 'proposed' : 'canon';
        this.elements.toggleBtn.textContent = this.state.currentMode === 'canon' ? 'Proposed' : 'Canon';
        this.elements.toggleBtn.dataset.mode = this.state.currentMode;

        this.state.currentSections = this.state.index;

        this.state.currentSectionIds = Object.keys(this.state.index).filter(id => {
            const section = this.state.index[id];
            return this.state.currentMode === 'canon'
                ? section.source === 'canon'
                : section.source.startsWith('proposed-');
        });

        if (this.state.currentSectionIds.length === 0) {
            this.state.currentSectionIndex = 0;
            this.elements.loreContent.innerHTML = `<p>No ${this.state.currentMode} lore entries found.</p>`;
        } else {
            this.state.currentSectionIndex = Math.min(this.state.currentSectionIndex, this.state.currentSectionIds.length - 1);
        }
        this.state.currentChunkIndex = 0;
        this.state.selectedTag = null;

        this.handleSearch();
        this.updateNavPanel(document.querySelector('#loreNav'));
        this.renderTagList();
        this.renderLore();
    }

    handleSearch() {
        const query = this.elements.searchInput.value;
        let results = searchLore(this.state.index, query, this.state.selectedTag);
        if (this.state.showBookmarksOnly) {
            results = Object.fromEntries(
                Object.entries(results).filter(([id]) => this.state.bookmarks.has(id))
            );
        }
        this.state.currentSections = results;
        this.state.currentSectionIds = Object.keys(results).filter(id => {
            const section = results[id];
            return this.state.currentMode === 'canon'
                ? section.source === 'canon'
                : section.source.startsWith('proposed-');
        });

        this.state.currentSectionIndex = 0;
        this.state.currentChunkIndex = 0;
        this.updateNavPanel(document.querySelector('#loreNav'));
        this.renderTagList();

        this.sectionButtons.forEach((button, index) => {
            const sectionId = this.state.currentSectionIds[index];
            if (!sectionId) {
                button.classList.add('hidden-search');
                return;
            }
            const section = this.state.currentSections[sectionId];
            const heading = section.title.toLowerCase();
            if (heading.includes(query.toLowerCase())) {
                button.classList.remove('hidden-search');
                if (section.level > 1) {
                    let prevButton = button.previousElementSibling;
                    while (prevButton && parseInt(prevButton.dataset.level) > 1) {
                        prevButton = prevButton.previousElementSibling;
                    }
                    if (prevButton) {
                        prevButton.classList.remove('hidden-search');
                        prevButton.classList.add('expanded');
                        let nextButton = prevButton.nextElementSibling;
                        while (nextButton && parseInt(nextButton.dataset.level) > 1) {
                            nextButton.classList.remove('hidden-subheading');
                            nextButton = nextButton.nextElementSibling;
                        }
                    }
                }
            } else {
                button.classList.add('hidden-search');
            }
        });

        this.renderLore();
    }
    scrollToTop() {
        this.elements.loreContent.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showPreviousChunk() {
        if (this.state.currentChunkIndex > 0) {
            this.state.currentChunkIndex--;
        } else if (this.state.currentSectionIndex > 0) {
            this.state.currentSectionIndex--;
            const section = this.state.currentSections[this.state.currentSectionIds[this.state.currentSectionIndex]];
            this.state.currentChunkIndex = section.chunks.length - 1;
        }
        this.renderLore();
    }

    showNextChunk() {
        const section = this.state.currentSections[this.state.currentSectionIds[this.state.currentSectionIndex]];
        if (this.state.currentChunkIndex < section.chunks.length - 1) {
            this.state.currentChunkIndex++;
        } else if (this.state.currentSectionIndex < this.state.currentSectionIds.length - 1) {
            this.state.currentSectionIndex++;
            this.state.currentChunkIndex = 0;
        }
        this.renderLore();
    }

    handleKeyboardNavigation(e) {
        switch (e.key) {
            case 'ArrowLeft':
                this.showPreviousChunk();
                break;
            case 'ArrowRight':
                this.showNextChunk();
                break;
            case 'ArrowUp':
                this.scrollToTop();
                break;
            case 'Enter':
                if (document.activeElement === this.elements.toggleBtn) this.toggleMode();
                break;
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
