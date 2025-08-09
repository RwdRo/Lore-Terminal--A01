// Voting.js - PR voting view
import { fetchProposedPRs } from '../api.js';

export class VotingView {
    constructor() {
        this.el = document.createElement('div');
        this.el.className = 'view voting-view';
        this.summary = document.createElement('div');
        this.summary.className = 'voting-summary';
        this.refreshBtn = document.createElement('button');
        this.refreshBtn.textContent = 'Refresh';
        this.list = document.createElement('div');
        this.list.className = 'voting-list';
        this.el.appendChild(this.summary);
        this.el.appendChild(this.refreshBtn);
        this.el.appendChild(this.list);
        this.refreshBtn.addEventListener('click', () => this.load());
    }

    async init() {
        if (this.initialized) return;
        await this.load();
        this.initialized = true;
    }

    async load() {
        const prs = await fetchProposedPRs();
        this.render(prs);
    }

    render(prs) {
        this.list.innerHTML = '';
        const total = prs.length;
        const open = prs.filter(p => p.status === 'open').length;
        const merged = prs.filter(p => p.status === 'merged').length;
        const closed = prs.filter(p => p.status === 'closed').length;
        this.summary.textContent = `Total: ${total} | Open: ${open} | Merged: ${merged} | Rejected: ${closed}`;
        prs.forEach(pr => {
            const card = document.createElement('div');
            card.className = 'pr-card';
            const badge = document.createElement('span');
            badge.className = `status ${pr.status}`;
            badge.textContent = pr.status;
            card.innerHTML = `<h3>${pr.title}</h3><div class="meta">${pr.author || 'unknown'} | ${new Date(pr.date).toLocaleDateString()}</div>`;
            card.appendChild(badge);
            this.list.appendChild(card);
        });
    }
}
