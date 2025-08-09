// Library.js - Lore library view
import { fetchCanonLore, fetchProposedLore } from '../api.js';
import { indexLore, searchLore } from '../loreIndex.js';

export class LibraryView {
    constructor() {
        this.el = document.createElement('div');
        this.el.className = 'view library-view';

        const controls = document.createElement('div');
        controls.className = 'library-controls';
        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.placeholder = 'Search';
        this.tagSelect = document.createElement('select');
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'All Tags';
        this.tagSelect.appendChild(opt);
        controls.appendChild(this.searchInput);
        controls.appendChild(this.tagSelect);
        this.el.appendChild(controls);

        const columns = document.createElement('div');
        columns.className = 'library-columns';
        this.listEl = document.createElement('div');
        this.listEl.className = 'library-list';
        this.detailEl = document.createElement('div');
        this.detailEl.className = 'library-detail';
        columns.appendChild(this.listEl);
        columns.appendChild(this.detailEl);
        this.el.appendChild(columns);

        this.searchInput.addEventListener('input', () => this.updateList());
        this.tagSelect.addEventListener('change', () => this.updateList());
    }

    async init() {
        if (this.initialized) return;
        const canon = await fetchCanonLore();
        const proposed = await fetchProposedLore(canon);
        this.index = indexLore(canon, proposed);
        this.sections = Object.values(this.index);
        const tags = new Set();
        this.sections.forEach(s => s.tags.forEach(t => tags.add(t)));
        tags.forEach(t => {
            const o = document.createElement('option');
            o.value = t;
            o.textContent = t;
            this.tagSelect.appendChild(o);
        });
        this.renderList(this.sections);
        this.initialized = true;
    }

    updateList() {
        if (!this.sections) return;
        const query = this.searchInput.value;
        const tag = this.tagSelect.value;
        const results = Object.values(searchLore(this.index, query, tag));
        this.renderList(results);
    }

    renderList(sections) {
        this.listEl.innerHTML = '';
        const bookmarks = this.getBookmarks();
        sections.forEach(sec => {
            const item = document.createElement('div');
            item.className = 'library-item';
            item.dataset.id = sec.sectionId;
            item.innerHTML = `<span class="title">${sec.title}</span> <span class="type">${sec.source.startsWith('canon') ? 'Canon' : 'Proposed'}</span> <span class="tags">${sec.tags.join(', ')}</span>`;
            const mark = document.createElement('button');
            mark.className = 'bookmark';
            mark.textContent = bookmarks.some(b => b.id === sec.sectionId) ? '★' : '☆';
            mark.addEventListener('click', e => {
                e.stopPropagation();
                this.toggleBookmark(sec);
                mark.textContent = mark.textContent === '★' ? '☆' : '★';
            });
            item.appendChild(mark);
            item.addEventListener('click', () => this.showDetail(sec.sectionId));
            this.listEl.appendChild(item);
        });
    }

    showDetail(id) {
        const sec = this.index[id];
        if (!sec) return;
        this.detailEl.innerHTML = `<h2>${sec.title}</h2><pre>${sec.content}</pre>`;
    }

    toggleBookmark(sec) {
        const bookmarks = this.getBookmarks();
        const idx = bookmarks.findIndex(b => b.id === sec.sectionId);
        if (idx >= 0) {
            bookmarks.splice(idx, 1);
        } else {
            bookmarks.push({ id: sec.sectionId, title: sec.title });
        }
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    }

    getBookmarks() {
        try {
            return JSON.parse(localStorage.getItem('bookmarks')) || [];
        } catch {
            return [];
        }
    }
}

export function LibraryViewFactory() {
    return new LibraryView();
}

