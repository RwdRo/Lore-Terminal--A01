// vote.js
document.addEventListener('DOMContentLoaded', () => {
    const voteSection = document.querySelector('.vote-content');
    if (!voteSection) return;

    voteSection.innerHTML = '<div class="loading">LOADING VOTES...</div>';

    fetch('/api/vote-data') // placeholder API endpoint
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => renderVotes(data))
        .catch(err => {
            voteSection.innerHTML = `<div class="error">Error loading votes: ${err.message}</div>`;
        });
});

function renderVotes(votes) {
    const voteSection = document.querySelector('.vote-content');
    if (!voteSection) return;

    voteSection.innerHTML = '';

    if (!votes.length) {
        voteSection.innerHTML = '<p>No active proposals at this time.</p>';
        return;
    }

    votes.forEach(proposal => {
        const card = document.createElement('div');
        card.className = 'vote-card';

        card.innerHTML = `
            <h3>${proposal.title}</h3>
            <p>${proposal.description}</p>
            <div class="vote-actions">
                <button class="vote-yes">YES</button>
                <button class="vote-no">NO</button>
            </div>
        `;

        card.querySelector('.vote-yes').addEventListener('click', () => vote(proposal.id, 'yes'));
        card.querySelector('.vote-no').addEventListener('click', () => vote(proposal.id, 'no'));

        voteSection.appendChild(card);
    });
}

function vote(id, choice) {
    console.log(`Voting ${choice.toUpperCase()} on proposal ${id}`);
    // Later we'll connect this to GraphQL + WAX wallet signature
}
