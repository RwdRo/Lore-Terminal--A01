// profile.js
import { fetchWalletDetails } from './graphqlMegaFetcher.js';
import { onAuthChange } from './auth.js';

export class Profile {
  constructor() {
    this.container = document.getElementById('profile');
    this.wallet = null;
    onAuthChange((wallet) => {
      this.wallet = wallet;
      if (this.container.style.display !== 'none') {
        this.renderProfile();
      }
    });
  }

  async init() {
    this.wallet = sessionStorage.getItem('WAX_WALLET');
    await this.renderProfile();
  }

  async renderProfile() {
    let stats = '<p>Connect wallet to load stats.</p>';
    if (this.wallet) {
      try {
        const data = await fetchWalletDetails(this.wallet);
        if (data) {
          stats = `
            <p><strong>Stake:</strong> ${data.stake}</p>
            <p><strong>Votes:</strong> ${data.votes}</p>
            <p><strong>Last Vote:</strong> ${data.last_vote_time}</p>
          `;
        }
      } catch (err) {
        stats = `<p>Error loading wallet stats.</p>`;
        console.error('Profile fetch error:', err);
      }
    }

    this.container.innerHTML = `
      <div class="profile-header">
        <div class="avatar-frame">
          <img src="assets/avatar-placeholder.png" alt="User Avatar" class="avatar" />
        </div>
        <div class="profile-info">
          <h2 class="profile-name">${this.wallet || 'Commander'}</h2>
        </div>
      </div>
      <div class="profile-stats">${stats}</div>
      <div class="profile-footer">
        <button class="profile-action-btn" disabled>🔒 Edit Profile</button>
        <button class="profile-action-btn" disabled>🔒 View Inventory</button>
      </div>
    `;
  }
}
