// Profile.js - user profile view
import { fetchProposedPRs } from '../api.js';
import { onAuthChange } from '../auth.js';

export class ProfileView {
    constructor() {
        this.el = document.createElement('div');
        this.el.className = 'view profile-view';
        this.el.innerHTML = '<h2>Bookmarks</h2>';
        this.bookmarkList = document.createElement('ul');
        this.contribTitle = document.createElement('h2');
        this.contribTitle.textContent = 'Contributions';
        this.contribList = document.createElement('ul');
        this.el.appendChild(this.bookmarkList);
        this.el.appendChild(this.contribTitle);
        this.el.appendChild(this.contribList);
        onAuthChange(wallet => this.loadContributions(wallet));
    }

    init() {
        if (this.initialized) return;
        this.renderBookmarks();
        const wallet = sessionStorage.getItem('WAX_WALLET');
        if (wallet) this.loadContributions(wallet);
        this.initialized = true;
    }

    renderBookmarks() {
        const bookmarks = this.getBookmarks();
        this.bookmarkList.innerHTML = '';
        bookmarks.forEach(b => {
            const li = document.createElement('li');
            li.textContent = b.title;
            li.addEventListener('click', () => {
                const evt = new CustomEvent('library:show', { detail: b.id });
                window.dispatchEvent(evt);
            });
            this.bookmarkList.appendChild(li);
        });
    }

    async loadContributions(wallet) {
        this.contribList.innerHTML = '';
        if (!wallet) return;
        const prs = await fetchProposedPRs(50, 0);
        prs.filter(pr => pr.author === wallet).forEach(pr => {
            const li = document.createElement('li');
            li.textContent = `${pr.title} (${pr.status})`;
            this.contribList.appendChild(li);
        });
    }

    getBookmarks() {
        try {
            return JSON.parse(localStorage.getItem('bookmarks')) || [];
        } catch {
            return [];
        }
    }
}
