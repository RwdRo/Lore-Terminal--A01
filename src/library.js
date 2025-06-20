// library.js
import { fetchCanonLore, fetchProposedLore } from './api.js';
import { indexLore, searchLore, findRelatedSections } from './loreIndex.js';

export class Library {
    constructor() {
        this.elements = {
            loreContent: document.querySelector('.lore-content'),
            loading: document.querySelector('.lore-content .loading'),
            toggleBtn: document.querySelector('.toggle-btn'),
            searchInput: document.querySelector('#searchInput'),
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
            isTyping: false
        };
        this.sectionButtons = [];
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
            await this.renderLore();
        } catch (error) {
            this.elements.loreContent.innerHTML = `<div class="error">Error loading lore: ${error.message}. Please try again later.</div>`;
        } finally {
            this.elements.loading.style.display = 'none';
        }

        this.elements.toggleBtn.addEventListener('click', () => this.toggleMode());
        this.elements.searchInput.addEventListener('input', debounce(() => this.handleSearch(), 300));
        this.elements.backToTopBtn.addEventListener('click', () => this.scrollToTop());
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
    }

    setupNavPanel() {
        const nav = document.querySelector('#loreNav');
        this.updateNavPanel(nav);
    }
    updateNavPanel(nav) {
        nav.innerHTML = '';
        this.sectionButtons = [];

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
        entryDiv.innerHTML = `
            <h${section.level}>${section.title}</h${section.level}>
            <div class="lore-text"></div>
            ${section.metadata.author ? `<div class="metadata">Author: ${section.metadata.author}</div>` : ''}
            ${section.metadata.date ? `<div class="metadata">Date: ${section.metadata.date}</div>` : ''}
            ${section.metadata.prTitle ? `<div class="metadata">PR: ${section.metadata.prTitle} (#${section.metadata.prNumber})</div>` : ''}
        `;
        this.elements.loreContent.appendChild(entryDiv);

        const loreText = entryDiv.querySelector('.lore-text');
        await this.typeText(loreText, renderedChunk);

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
        this.renderLore();
    }

    handleSearch() {
        const query = this.elements.searchInput.value;
        this.state.currentSections = searchLore(this.state.index, query, this.state.selectedTag);
        this.state.currentSectionIds = Object.keys(this.state.currentSections).filter(id => {
            const section = this.state.currentSections[id];
            return this.state.currentMode === 'canon'
                ? section.source === 'canon'
                : section.source.startsWith('proposed-');
        });

        this.state.currentSectionIndex = 0;
        this.state.currentChunkIndex = 0;
        this.updateNavPanel(document.querySelector('#loreNav'));

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
