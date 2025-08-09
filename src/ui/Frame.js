// Frame.js - Application shell and navigation
import { LibraryView } from './Library.js';
import { FormatterView } from './Formatter.js';
import { VotingView } from './Voting.js';
import { ProfileView } from './Profile.js';
import '../styles/crt.css';

export class Frame {
    constructor(root) {
        this.root = root;
        this.views = {};
    }

    init() {
        const shell = document.createElement('div');
        shell.className = 'crt-shell';
        this.root.appendChild(shell);

        const header = document.createElement('header');
        header.className = 'crt-header';
        const title = document.createElement('div');
        title.className = 'crt-title';
        title.textContent = 'A-01 Canon Terminal';
        const nav = document.createElement('nav');
        nav.className = 'crt-nav';
        const tabs = [
            { id: 'library', label: 'Library' },
            { id: 'formatter', label: 'Formatter' },
            { id: 'voting', label: 'Voting' },
            { id: 'profile', label: 'Profile' }
        ];
        tabs.forEach(t => {
            const btn = document.createElement('button');
            btn.textContent = t.label;
            btn.dataset.view = t.id;
            btn.addEventListener('click', () => this.show(t.id));
            nav.appendChild(btn);
        });
        const connect = document.createElement('button');
        connect.id = 'connectWalletBtn';
        connect.textContent = '🔐 Connect Wallet';
        header.appendChild(title);
        header.appendChild(nav);
        header.appendChild(connect);
        shell.appendChild(header);

        const main = document.createElement('main');
        main.className = 'crt-main';
        shell.appendChild(main);

        this.views.library = new LibraryView();
        this.views.formatter = new FormatterView();
        this.views.voting = new VotingView();
        this.views.profile = new ProfileView();

        Object.values(this.views).forEach(view => {
            main.appendChild(view.el);
        });

        this.show('library');

        // handle requests to show library item from other views
        window.addEventListener('library:show', (e) => {
            this.show('library');
            if (this.views.library && typeof this.views.library.showDetail === 'function') {
                this.views.library.showDetail(e.detail);
            }
        });
    }

    show(name) {
        Object.entries(this.views).forEach(([key, view]) => {
            view.el.style.display = key === name ? 'block' : 'none';
            if (key === name && typeof view.init === 'function') {
                view.init();
            }
        });
    }
}
