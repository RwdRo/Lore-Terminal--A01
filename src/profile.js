// profile.js
import { fetchWalletDetails } from './graphqlMegaFetcher.js';
import { fetchCanonLore, fetchProposedLore } from './api.js';
import { indexLore } from './loreIndex.js';
import { getSession } from './auth.js';

export class Profile {
  constructor() {
    this.container = document.getElementById('profile');
    this.wallet = null;
  }

  async init() {
    const session = getSession();
    this.wallet = session ? session.actor.toString() : null;
    await this.renderProfile();
  }

  async fetchBadgeData() {
    if (!this.wallet) return [];
    const canon = await fetchCanonLore();
    const proposed = await fetchProposedLore(canon);
    const index = indexLore(canon, proposed);
    let authored = 0;
    let popular = false;
    let comments = 0;
    for (const id in index) {
      const sec = index[id];
      const meta = sec.metadata || {};
      if (meta.author && meta.author.toLowerCase() === this.wallet.toLowerCase()) {
        authored++;
        if (parseInt(meta.stars || '0', 10) >= 10) popular = true;
        comments += parseInt(meta.comments || '0', 10);
      }
    }
    const votes = Object.keys(JSON.parse(localStorage.getItem(`A01_VOTES_${this.wallet}`) || '{}')).length;
    const commentsMade = Object.values(JSON.parse(localStorage.getItem(`A01_COMMENTS_${this.wallet}`) || '{}'))
      .reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
    const badges = [];
    if (authored > 0) badges.push({ icon: '📝', label: 'Lore Contributor' });
    if (popular) badges.push({ icon: '🔥', label: 'Popular Lore' });
    if (votes >= 3) badges.push({ icon: '⚖️', label: 'Community Voter' });
    if (commentsMade >= 5 || comments >= 5) badges.push({ icon: '🛡', label: 'Lore Guardian' });
    return badges;
  }

  calcReputation(data) {
    if (!data) return 0;
    const stakeScore = parseFloat(data.stake) / 100 || 0;
    const voteScore = parseInt(data.votes, 10) * 2 || 0;
    const last = data.last_vote_time ? new Date(data.last_vote_time) : null;
    const days = last ? (Date.now() - last.getTime()) / 86400000 : 365;
    const activityScore = Math.max(0, 100 - Math.min(365, days));
    return Math.min(100, Math.round(stakeScore + voteScore + activityScore));
  }

  walletInitials() {
    if (!this.wallet) return 'AW';
    return this.wallet.slice(0, 2).toUpperCase();
  }

  async renderProfile() {
    let stats = '<p>Connect wallet to load stats.</p>';
    let repScore = 0;
    let badges = [];
    if (this.wallet) {
      try {
        const data = await fetchWalletDetails(this.wallet);
        if (data) {
          repScore = this.calcReputation(data);
          stats = `
            <p><strong>Stake:</strong> ${data.stake}</p>
            <p><strong>Votes:</strong> ${data.votes}</p>
            <p><strong>Last Vote:</strong> ${data.last_vote_time}</p>
            <p><strong>Reputation:</strong> ${repScore}</p>
            <div class="rep-bar"><div class="rep-bar-fill" style="width:${repScore}%"></div></div>
          `;
        }
        badges = await this.fetchBadgeData();
      } catch (err) {
        stats = '<p>Error loading wallet stats.</p>';
        console.error('Profile fetch error:', err);
      }
    }

    const badgeHtml = badges.map(b => `<span class="badge" title="${b.label}">${b.icon}</span>`).join('');

    this.container.innerHTML = `
      <div class="profile-header">
        <div class="avatar-frame">
          <div class="avatar-fallback" aria-label="Profile avatar">${this.walletInitials()}</div>
        </div>
        <div class="profile-info">
          <h2 class="profile-name">${this.wallet || 'Commander'}</h2>
        </div>
      </div>
      <div class="profile-stats">${stats}</div>
      <div class="profile-badges">${badgeHtml || '<span>No badges unlocked yet.</span>'}</div>
      <div class="profile-footer">
        <button class="profile-action-btn" data-action="copyWallet" type="button">Copy Wallet</button>
        <button class="profile-action-btn" data-action="openExplorer" type="button">Open Explorer</button>
      </div>
    `;

    this.bindActions();
  }

  bindActions() {
    this.container.querySelector('[data-action="copyWallet"]')?.addEventListener('click', async () => {
      if (!this.wallet) return;
      await navigator.clipboard.writeText(this.wallet);
    });
    this.container.querySelector('[data-action="openExplorer"]')?.addEventListener('click', () => {
      if (!this.wallet) return;
      window.open(`https://waxblock.io/account/${this.wallet}`, '_blank', 'noopener,noreferrer');
    });
  }

  async renderSidebar(elementId = 'loreNav') {
    const el = document.getElementById(elementId);
    if (!el) return;
    let info = '<p>Connect wallet</p>';
    if (this.wallet) {
      try {
        const data = await fetchWalletDetails(this.wallet);
        if (data) {
          info = `<strong>${this.wallet}</strong><br>Stake: ${data.stake}<br>Votes: ${data.votes}<br><a href="https://waxblock.io/account/${this.wallet}" target="_blank" rel="noopener noreferrer">Open explorer ↗</a>`;
        }
      } catch (err) {
        info = '<p>Error loading wallet stats.</p>';
        console.error('Profile sidebar error:', err);
      }
    }
    el.innerHTML = info;
  }
}
