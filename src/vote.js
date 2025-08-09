// vote.js
let authPromise;
function getAuth() {
    if (!authPromise) authPromise = import('./auth.js');
    return authPromise;
}

async function fetchProposed(limit = 20, offset = 0) {
    const url = `/api/proposed?limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    if (res.status !== 200) throw new Error(`${url} HTTP ${res.status}`);
    return res.json();
}

export async function initVotes(limit = 20, offset = 0) {
    const panel = document.getElementById('votePanel');
    if (!panel) return;
    panel.innerHTML = '<div class="loading">LOADING VOTES...</div>';
    try {
        const data = await fetchProposed(limit, offset);
        const proposals = Array.isArray(data.items) ? data.items : data;
        renderVotes(panel, proposals);
    } catch (err) {
        console.error('Voting fetch error:', err);
        panel.innerHTML = '<div class="error">Error loading votes. Please try again later.</div>';
    }
}

export async function renderVoteSidebar(elementId = 'loreNav') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = '<div class="loading">LOADING...</div>';
    try {
        const data = await fetchProposed(50, 0);
        const proposals = Array.isArray(data.items) ? data.items : data;
        const wallet = sessionStorage.getItem('WAX_WALLET');
        const voted = wallet ? new Set(JSON.parse(localStorage.getItem(`A01_VOTES_${wallet}`) || '[]')) : new Set();
        const votedProposals = proposals.filter(p => voted.has(p.prNumber));
        if (!votedProposals.length) {
            el.innerHTML = '<p>No voted proposals</p>';
            return;
        }
        el.innerHTML = '<ul>' + votedProposals.map(p => `<li>${p.title}</li>`).join('') + '</ul>';
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
            <p>Status: ${p.status || p.state}</p>
            <p>Yes: ${p.yes_votes || 0} | No: ${p.no_votes || 0}</p>
            <div class="vote-actions">
                <button class="vote-yes">YES</button>
                <button class="vote-no">NO</button>
            </div>
        `;
        card.querySelector('.vote-yes').addEventListener('click', () => vote(p.prNumber || p.id, 'yes'));
        card.querySelector('.vote-no').addEventListener('click', () => vote(p.prNumber || p.id, 'no'));
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
        const wallet = sessionStorage.getItem('WAX_WALLET');
        if (wallet) {
            const key = `A01_VOTES_${wallet}`;
            const voted = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
            voted.add(id);
            localStorage.setItem(key, JSON.stringify([...voted]));
        }
    }).catch(err => console.error('Vote error:', err));
}
