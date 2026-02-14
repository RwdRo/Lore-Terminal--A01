// main.js
import { Library } from './library.js';
import { Profile } from './profile.js';
import { Maps } from './maps.js';
import { loadBookmark } from './bookmarks.js';
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
  initStarfield();
  await runBootSequence();
  await initTerminal();
}

function initStarfield(count = 120) {
  const starfield = document.getElementById('starfield');
  if (!starfield) return;
  starfield.innerHTML = '';
  for (let i = 0; i < count; i += 1) {
    const star = document.createElement('span');
    star.className = 'star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 4}s`;
    star.style.animationDuration = `${1.8 + Math.random() * 3.2}s`;
    starfield.appendChild(star);
  }
}

async function runBootSequence() {
  const boot = document.getElementById('bootSequence');
  const terminal = document.getElementById('terminal');
  if (!terminal) return;

  await new Promise(resolve => setTimeout(resolve, 900));
  terminal.style.opacity = '1';
  if (boot) {
    boot.style.opacity = '0';
    boot.style.pointerEvents = 'none';
    setTimeout(() => {
      boot.style.display = 'none';
      document.body.classList.remove('booting');
    }, 550);
  }
}

function updateLoginUI() {
  getAuth().then(auth => {
    const session = auth.getSession();
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
      connectBtn.textContent = session ? `🔓 ${session.actor}` : '🔐 Connect Wallet';
    }
  });
}

async function initTerminal() {
  loadBookmark();

  library = new Library();
  profile = new Profile();
  maps = new Maps();
  const { Formatter } = await import('./formatter.js');
  formatter = new Formatter();

  const auth = await getAuth();
  await auth.restore();
  updateLoginUI();
  if (auth.getSession()) {
    profile.init();
  }

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

  const connectBtn = document.getElementById('connectWalletBtn');
  if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
      const session = auth.getSession();
      if (session) {
        await auth.logout();
      } else {
        try {
          await auth.login();
          profile.init();
        } catch (e) {
          console.error(e);
        }
      }
      updateLoginUI();
    });
  }

  library.init();

  subscribe(renderApp);
  setActivePanel('content');
  renderApp();
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
      import('./vote.js')
        .then(m => {
          m.renderVoteSidebar('loreNav');
          m.initVotes();
        })
        .catch(() => {});
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
