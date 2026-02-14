// maps.js
import { PLANET_DATA } from './planet-data.js';
import { fetchPlanetDetails } from './graphqlMegaFetcher.js';

export class Maps {
  constructor() {
    this.container = document.getElementById('maps');
    this.state = {
      currentPlanet: null
    };
  }

  async init() {
    try {
      const stats = await fetchPlanetDetails();
      stats.forEach(p => {
        if (PLANET_DATA[p.name]) {
          PLANET_DATA[p.name].stats = {
            population: p.population,
            reward_pool: p.reward_pool,
            active_users: p.active_users
          };
        }
      });
    } catch (e) {
      console.error('Planet stats', e);
    }
    this.renderSpaceView();
  }

  renderSpaceView() {
    const viewWidth = 960;
    const viewHeight = 600;
    this.container.innerHTML = `
      <div id="spaceView" class="map-space" style="width:${viewWidth}px;height:${viewHeight}px;">
        <div class="orbit-bg" aria-hidden="true"></div>
        ${this.renderPlanets()}
        <div id="planetTooltip" class="planet-tooltip" hidden></div>
      </div>
    `;

    const spaceView = this.container.querySelector('#spaceView');
    const scale = Math.min(this.container.clientWidth / viewWidth, this.container.clientHeight / viewHeight);
    const offsetX = (this.container.clientWidth - viewWidth * scale) / 2;
    const offsetY = (this.container.clientHeight - viewHeight * scale) / 2;
    spaceView.style.transformOrigin = 'top left';
    spaceView.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;

    this.attachPlanetEvents();
  }

  renderPlanets() {
    return Object.entries(PLANET_DATA)
      .map(([name, data]) => {
        const [x, y] = data.orbitCoords;
        return `
          <div
            class="planet-icon"
            data-planet="${name}"
            style="left:${x}px; top:${y}px;"
          >
            <img src="/assets/planet-${name.toLowerCase()}.png" alt="${name}" />
          </div>
        `;
      })
      .join('');
  }

  attachPlanetEvents() {
    const tooltip = document.getElementById('planetTooltip');

    document.querySelectorAll('.planet-icon').forEach(icon => {
      const name = icon.dataset.planet;
      const data = PLANET_DATA[name];
      const el = icon;

      el.addEventListener('mouseenter', () => {
        tooltip.innerHTML = `<strong>${name}</strong><br>${data.short.join('<br>')}`;
        tooltip.style.left = `${el.offsetLeft + el.offsetWidth / 2 + 8}px`;
        tooltip.style.top = `${el.offsetTop - 10}px`;
        tooltip.hidden = false;
      });

      el.addEventListener('mouseleave', () => {
        tooltip.hidden = true;
      });

      el.addEventListener('click', () => {
        this.renderPlanetDetail(name);
      });
    });
  }

  renderPlanetDetail(name) {
    this.state.currentPlanet = name;
    const record = PLANET_DATA[name];
    const p = record.details;
    const stats = record.stats || {};

    this.container.innerHTML = `
      <div class="planet-detail">
        <h2 class="planet-name">${name}</h2>

        <div class="planet-panel">
          <div class="planet-left">
            <img src="${p.image}" alt="${name} Planet Image" class="planet-img" />
          </div>

          <div class="planet-right">
            <table class="planet-stats">
              <tr><td>Type:</td><td>${p.type}</td></tr>
              <tr><td>System:</td><td>${p.system}</td></tr>
              <tr><td>Diameter:</td><td>${p.diameter}</td></tr>
              <tr><td>Climate:</td><td>${p.climate}</td></tr>
              <tr><td>Atmosphere:</td><td>${p.atmosphere}</td></tr>
              <tr><td>Resources:</td><td>${p.resources}</td></tr>
              <tr><td>Unique:</td><td>${p.unique}</td></tr>
              <tr><td>Population:</td><td>${stats.population ?? 'N/A'}</td></tr>
              <tr><td>Reward Pool:</td><td>${stats.reward_pool ?? 'N/A'}</td></tr>
              <tr><td>Active Users:</td><td>${stats.active_users ?? 'N/A'}</td></tr>
            </table>

            <div class="planet-actions">
              <button class="return-btn" type="button">← Return to Space</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('.return-btn').addEventListener('click', () => {
      this.renderSpaceView();
    });
  }
}
