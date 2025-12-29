// main.js
import { Library } from './library.js'
import { Profile } from './profile.js'
import { Maps } from './maps.js'
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
  // ... (boot sequence code remains the same)
}

// ... (boot sequence and helper functions remain the same)

async function initTerminal() {
  getAuth().then(m => m.restoreSession());
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
      const { login, logout, isLoggedIn } = await getAuth();
      if (isLoggedIn()) {
        await logout();
      } else {
        try {
          await login();
        } catch(e){ console.error(e); }
      }
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

// ... (rest of the file remains the same)