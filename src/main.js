// main.js
import { Library } from './library.js'
import { Profile } from './profile.js'
import { Maps } from './maps.js'
let authModule = null;
async function getAuth() {
  if (!authModule) {
    authModule = await import('./auth.js');
  }
  return authModule;
}

const sectionIds = ['content', 'profile', 'maps', 'votes', 'formatter']

// Wait for DOM to ensure the boot elements exist
document.addEventListener('DOMContentLoaded', () => {
  waitForTerminalAndStart()
})

async function waitForTerminalAndStart() {
  const maxTries = 20
  let tries = 0

  while (tries < maxTries) {
    const bootSequence = document.getElementById('bootSequence')
    const terminal = document.getElementById('terminal')
    const starfield = document.getElementById('starfield')
    const bootText = bootSequence?.querySelector('.boot-text')

    if (bootSequence && terminal && starfield && bootText) {
      runBoot(bootSequence, terminal, starfield, bootText)
      return
    }

    await wait(100)
    tries++
  }

  console.error('[A-01] Terminal elements not found after waiting. Aborting.')
}

async function runBoot(bootSequence, terminal, starfield, bootText) {
  // 🌌 Starfield animation
  for (let i = 0; i < 100; i++) {
    const star = document.createElement('div')
    star.className = 'star'
    star.style.left = `${Math.random() * 100}vw`
    star.style.top = `${Math.random() * 100}vh`
    star.style.animationDelay = `${Math.random() * 5}s`
    starfield.appendChild(star)
  }

  terminal.style.display = 'none'

  const BOOT_MESSAGES = [
    'LORE TERMINAL INITIATED',
    'MODEL: A-01 OmniLink',
    'NodeProtocol: ORBITAL_ARCHIVE_0.3',
    'POWER... ROUTING THROUGH FUSION CELLS... [OK]',
    'STABILIZING QUANTUM THREADS... [OK]',
    'DECRYPTING DATA CORE NEXUS... [ACCESS DENIED]',
    'CONNECT WAX CLOUD WALLET'
  ]

  await typeBoot(BOOT_MESSAGES, bootText)

  bootSequence.style.opacity = '0'
  setTimeout(() => {
    bootSequence.style.display = 'none'
    terminal.style.display = 'flex'
    terminal.style.opacity = '1'
    document.body.classList.remove('booting')
    initTerminal()
  }, 500)
}

async function typeBoot(lines, logElem) {
  try {
    logElem.innerText = ''
    for (const line of lines) {
      let currentText = logElem.innerText
      for (let i = 0; i <= line.length; i++) {
        logElem.innerText = currentText + line.slice(0, i) + '_'
        await wait(26 + Math.random() * 14)
        logElem.innerText = currentText + line.slice(0, i)
      }
      logElem.innerText = currentText + line + '\n'
      await wait(280 + Math.random() * 80)
    }
    logElem.innerText = logElem.innerText.replace(/_$/, '')
  } catch (error) {
    console.error('Boot sequence error:', error)
    logElem.innerText = 'BOOT SEQUENCE ERROR\nPlease refresh the page.'
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function initTerminal() {
  getAuth().then(m => m.restoreSession());
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
  const library = new Library()
  const profile = new Profile()
  const maps = new Maps()
  const { Formatter } = await import('./formatter.js')
  const formatter = new Formatter()

  library.init()

  const sidebarBtns = document.querySelectorAll('.sidebar-btn')
  sidebarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target
      switchPanel(targetId)

      if (targetId === 'profile') {
        profile.init()
      } else if (targetId === 'maps') {
        maps.init()
      } else if (targetId === 'votes') {
        import('./vote.js')
          .then(module => {
            if (module && typeof module.initVotes === 'function') {
              module.initVotes()
            }
          })
          .catch(err => {
            console.error('Failed to load vote module:', err)
          })
      } else if (targetId === 'formatter') {
        formatter.init()
      }

      sidebarBtns.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
    })
  })

  switchPanel('content')
}

function switchPanel(panelId) {
  sectionIds.forEach(id => {
    const el = document.getElementById(id)
    if (el) {
      el.style.display = id === panelId ? 'flex' : 'none'
    }
  })
}
