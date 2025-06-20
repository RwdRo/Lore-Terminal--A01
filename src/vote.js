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
        const wallet = sessionStorage.getItem('WAX_WALLET');
        if (wallet) {
            const key = `A01_VOTES_${wallet}`;
            const voted = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
            voted.add(id);
            localStorage.setItem(key, JSON.stringify([...voted]));
        }
    });
}
