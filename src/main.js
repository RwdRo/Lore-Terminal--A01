// main.js
import { Library } from './library.js';
import { Profile } from './profile.js';
import { Maps } from './maps.js';
import { saveBookmark, loadBookmark } from './bookmarks.js';
import { Sidebar } from './components/Sidebar.js';
import { getState, subscribe, setActivePanel } from './state.js';

let library;
let profile;
let maps;
let formatter;
let authModule = null;

async function getAuth() {
  if (!authModule) {
    authModule = await import('./auth.js');
  }
  return authModule;
}

const sectionIds = ['content', 'profile', 'maps', 'votes', 'formatter'];

document.addEventListener('DOMContentLoaded', () => {
  waitForTerminalAndStart();
});

async function waitForTerminalAndStart() {
  // This function can be simplified if the boot sequence is not needed.
  initTerminal();
}

function updateLoginUI() {
    getAuth().then(auth => {
        const session = auth.getSession();
        const connectBtn = document.getElementById("connectWalletBtn");
        if (connectBtn) {
            connectBtn.textContent = session ? `🔓 ${session.actor}` : '🔐 Connect Wallet';
        }
    });
}

async function initTerminal() {
  getAuth().then(async (m) => {
    await m.restore();
    updateLoginUI();
    if (m.getSession()) {
        profile.init();
    }
  });
  loadBookmark();

  const sidebarButtons = [
    { label: 'Library', target: 'content' },
    { label: 'Profile', target: 'profile' },
    { label: 'Maps', target: 'maps' },
    { label: 'My Votes', target: 'votes' },
    { label: 'Formatter', target: 'formatter' },
    { label: 'Save Place', target: 'savePlace' }
  ];

  const sidebar = new Sidebar('mainNav', sidebarButtons);
  sidebar.init();

  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", async () => {
      const auth = await getAuth();
      const session = auth.getSession();
      if (session) {
        await auth.logout();
      } else {
        try {
          await auth.login();
          profile.init(); // Refresh profile data after login
        } catch(e){ console.error(e); }
      }
      updateLoginUI();
    });
  }

  library = new Library();
  profile = new Profile();
  maps = new Maps();
  const { Formatter } = await import('./formatter.js');
  formatter = new Formatter();

  library.init();

  subscribe(renderApp);
  setActivePanel('content');
  renderApp(); // Initial render
}

function renderApp() {
  const { activePanel } = getState();
  switchPanel(activePanel);
}

function switchPanel(panelId) {
  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = id === panelId ? 'flex' : 'none';
    }
  });

  const rightbar = document.querySelector('.rightbar');
  const nav = document.getElementById('loreNav');

  switch (panelId) {
    case 'content':
      rightbar.style.display = 'block';
      library.updateNavPanel(nav);
      break;
    case 'profile':
      rightbar.style.display = 'block';
      profile.renderSidebar('loreNav');
      profile.init();
      break;
    case 'maps':
      rightbar.style.display = 'none';
      nav.innerHTML = '';
      maps.init();
      break;
    case 'votes':
      rightbar.style.display = 'block';
      import('./vote.js').then(m => {
        m.renderVoteSidebar('loreNav');
        m.initVotes();
      }).catch(()=>{});
      break;
    case 'formatter':
      rightbar.style.display = 'none';
      nav.innerHTML = '';
      formatter.init();
      break;
    default:
      rightbar.style.display = 'none';
      nav.innerHTML = '';
  }
}
