import { setActivePanel, subscribe, getState } from '../state.js';
import { saveBookmark } from '../bookmarks.js';

export class Sidebar {
  constructor(elementId, buttons) {
    this.element = document.getElementById(elementId);
    this.buttons = buttons;
  }

  render() {
    const { activePanel } = getState();
    this.element.innerHTML = this.buttons.map(button => `
      <button 
        class="sidebar-btn ${activePanel === button.target ? 'active' : ''}" 
        data-target="${button.target}" 
        type="button"
      >
        ${button.label}
      </button>
    `).join('');
  }

  init() {
    this.element.addEventListener('click', (event) => {
      const button = event.target.closest('.sidebar-btn');
      if (button) {
        const targetId = button.dataset.target;
        if (targetId === 'savePlace') {
          saveBookmark();
        } else if (targetId) {
          setActivePanel(targetId);
        }
      }
    });
    subscribe(() => this.render());
    this.render();
  }
}
