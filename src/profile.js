// profile.js

export class Profile {
  constructor() {
    this.container = document.getElementById('profile');
  }

  async init() {
    this.renderProfile();
  }

  renderProfile() {
    this.container.innerHTML = `
      <div class="profile-header">
        <div class="avatar-frame">
          <img src="assets/avatar-placeholder.png" alt="User Avatar" class="avatar" />
        </div>
        <div class="profile-info">
          <h2 class="profile-name">Commander RED</h2>
          <p class="profile-rank">Rank: Quantum Seeker</p>
          <p class="profile-id">ID: #AW-8731-ZN</p>
        </div>
      </div>

      <div class="profile-stats">
        <div class="stat-block">
          <h3>Reputation</h3>
          <p>842 / 1000</p>
        </div>
        <div class="stat-block">
          <h3>Missions Completed</h3>
          <p>27</p>
        </div>
        <div class="stat-block">
          <h3>Faction</h3>
          <p>Velesian Archives</p>
        </div>
        <div class="stat-block">
          <h3>Lore Submitted</h3>
          <p>15 Sections</p>
        </div>
      </div>

      <div class="profile-footer">
        <button class="profile-action-btn" disabled>🔒 Edit Profile</button>
        <button class="profile-action-btn" disabled>🔒 View Inventory</button>
      </div>
    `;
  }
}
