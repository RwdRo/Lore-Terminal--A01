// vote.js
const FALLBACK_VOTE_PROPOSALS = [
  {
    number: 1001,
    title: 'Add lore section: Neri Deep Archive',
    state: 'open',
    user: { login: 'community-scribe' },
    html_url: 'https://github.com/Alien-Worlds/the-lore/pull/1001'
  },
  {
    number: 1002,
    title: 'Expand faction timeline',
    state: 'open',
    user: { login: 'lore-keeper' },
    html_url: 'https://github.com/Alien-Worlds/the-lore/pull/1002'
  }
];

let authPromise;
function getAuth() {
  if (!authPromise) authPromise = import('./auth.js');
  return authPromise;
}

async function fetchProposed(limit = 20, offset = 0) {
  const url = `/api/proposed?limit=${limit}&offset=${offset}`;
  try {
    const res = await fetch(url);
    if (res.status !== 200) throw new Error(`${url} HTTP ${res.status}`);
    return res.json();
  } catch (error) {
    console.warn('Using fallback vote proposals:', error?.message || error);
    return { items: FALLBACK_VOTE_PROPOSALS.slice(offset, offset + limit) };
  }
}

function getWalletVotes(wallet) {
  if (!wallet) return {};
  return JSON.parse(localStorage.getItem(`A01_VOTES_${wallet}`) || '{}');
}

function saveWalletVotes(wallet, votes) {
  localStorage.setItem(`A01_VOTES_${wallet}`, JSON.stringify(votes));
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
    const voted = getWalletVotes(wallet);
    const votedProposals = proposals.filter(p => voted[p.number]);
    if (!votedProposals.length) {
      el.innerHTML = '<p>No voted proposals</p>';
      return;
    }
    el.innerHTML =
      '<ul>' +
      votedProposals
        .map(
          p =>
            `<li><a target="_blank" rel="noopener noreferrer" href="${p.html_url}">${p.title}</a> (${voted[p.number].toUpperCase()})</li>`
        )
        .join('') +
      '</ul>';
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

  const wallet = sessionStorage.getItem('WAX_WALLET');
  const votes = getWalletVotes(wallet);

  proposals.forEach(p => {
    const votedChoice = votes[p.number];
    const card = document.createElement('div');
    card.className = 'vote-card';
    card.innerHTML = `
      <h3>${p.title}</h3>
      <p>Status: ${p.state}</p>
      <p>Author: ${p.user?.login || 'unknown'}</p>
      <p>Your vote: ${votedChoice ? votedChoice.toUpperCase() : 'Not voted'}</p>
      <div class="vote-actions">
        <button class="vote-yes" type="button">YES</button>
        <button class="vote-no" type="button">NO</button>
        <a class="vote-view" href="${p.html_url}" target="_blank" rel="noopener noreferrer">View PR ↗</a>
      </div>
    `;
    card.querySelector('.vote-yes').addEventListener('click', () => vote(p.number, 'yes'));
    card.querySelector('.vote-no').addEventListener('click', () => vote(p.number, 'no'));
    container.appendChild(card);
  });
}

function vote(id, choice) {
  getAuth()
    .then(({ isLoggedIn }) => {
      if (!isLoggedIn()) {
        alert('Connect your wallet to vote.');
        return;
      }
      const wallet = sessionStorage.getItem('WAX_WALLET');
      if (!wallet) return;
      const votes = getWalletVotes(wallet);
      votes[id] = choice;
      saveWalletVotes(wallet, votes);
      initVotes();
      renderVoteSidebar('loreNav');
    })
    .catch(err => console.error('Vote error:', err));
}
