// vote.js
import { fetchDaoInfo } from './graphqlMegaFetcher.js';
let authPromise;
function getAuth() {
    if (!authPromise) authPromise = import('./auth.js');
    return authPromise;
}

export async function initVotes() {
    const panel = document.getElementById('votePanel');
    if (!panel) return;
    panel.innerHTML = '<div class="loading">LOADING VOTES...</div>';
    try {
        const data = await fetchDaoInfo();
        const proposals = data?.TokeLore?.proposals || [];
        renderVotes(panel, proposals);
    } catch (err) {
        panel.innerHTML = `<div class="error">Error loading votes: ${err.message}</div>`;
    }
}

export async function renderVoteSidebar(elementId = 'loreNav') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = '<div class="loading">LOADING...</div>';
    try {
        const data = await fetchDaoInfo();
        const proposals = data?.TokeLore?.proposals || [];
        if (!proposals.length) {
            el.innerHTML = '<p>No active proposals</p>';
            return;
        }
        el.innerHTML = '<ul>' + proposals.map(p => `<li>${p.title}</li>`).join('') + '</ul>';
    } catch (err) {
        el.innerHTML = '<p>Error loading proposals</p>';
        console.error('Vote sidebar error:', err);
    }
}

function renderVotes(container, proposals) {
    container.innerHTML = '';
    if (!proposals.length) {
        container.innerHTML = '<p>No active proposals at this time.</p>';
        return;
    }

    proposals.forEach(p => {
        const card = document.createElement('div');
        card.className = 'vote-card';
        card.innerHTML = `
            <h3>${p.title}</h3>
            <p>Status: ${p.status}</p>
            <p>Yes: ${p.yes_votes} | No: ${p.no_votes}</p>
            <div class="vote-actions">
                <button class="vote-yes">YES</button>
                <button class="vote-no">NO</button>
            </div>
        `;
        card.querySelector('.vote-yes').addEventListener('click', () => vote(p.id, 'yes'));
        card.querySelector('.vote-no').addEventListener('click', () => vote(p.id, 'no'));
        container.appendChild(card);
    });
}

function vote(id, choice) {
    getAuth().then(({ isLoggedIn }) => {
        if (!isLoggedIn()) {
            alert('Connect your wallet to vote.');
            return;
        }
        console.log(`Voting ${choice.toUpperCase()} on proposal ${id}`);
        // Integration with blockchain signing would go here
    });
}
