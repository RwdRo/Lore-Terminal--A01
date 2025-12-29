import { installBufferPolyfill } from './bufferPolyfill.js'
installBufferPolyfill()
import { SessionKit } from '@wharfkit/session'
import { WalletPluginCloudWallet } from '@wharfkit/wallet-plugin-cloudwallet'
import { SimpleUI } from './simpleUI.js'

let session = null
let sessionKit
const authChangeCallbacks = []
const CHAIN = {
  id: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
  url: 'https://wax.greymass.com'
}

function getKit() {
  if (!sessionKit) {
    const walletPlugin = new WalletPluginCloudWallet()
    sessionKit = new SessionKit({
      appName: 'A01 Terminal',
      chains: [CHAIN],
      walletPlugins: [walletPlugin],
      ui: new SimpleUI()
    })
  }
  return sessionKit
}

function debounce(func, wait) {
    let timeout = null;
    return (...args) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

const dispatchAuthChange = debounce((wallet) => {
    authChangeCallbacks.forEach(callback => callback(wallet));
    updateLoginUI(wallet);
}, 100);

function updateLoginUI(wallet, elementId = 'connectWalletBtn') {
    const btn = document.getElementById(elementId);
    if (!btn) {
        document.addEventListener('DOMContentLoaded', () => {
            const el = document.getElementById(elementId);
            if (el) {
                el.textContent = wallet ? `🔓 ${wallet}` : '🔐 Connect Wallet';
            }
        });
        return;
    }
    btn.textContent = wallet ? `🔓 ${wallet}` : '🔐 Connect Wallet';
}

export function onAuthChange(callback) {
    if (typeof callback === 'function') {
        authChangeCallbacks.push(callback);
    }
}

export function getSession() {
    return session;
}

export function isLoggedIn() {
    return Boolean(session?.actor);
}

export async function login(options = {}) {
    try {
        const kit = getKit();
        const result = await kit.login({ chainId: CHAIN.id });
        if (!result || !result.session) {
            throw new Error('Login failed: No session returned.');
        }

        session = result.session;
        const actor = session.actor.toString();
        console.log(`[Auth] Logged in as ${actor}`);

        sessionStorage.setItem('WAX_WALLET', actor);
        dispatchAuthChange(actor);
        return actor;

    } catch (error) {
        console.error('[Auth] Login failed:', error);
        if (options && typeof options.onError === 'function') {
            try {
                options.onError(error);
            } catch (err) {
                console.error('[Auth] onError handler threw:', err);
            }
        }
        throw new Error(error.message || 'Failed to connect to WAX wallet.');
    }
}

export async function logout() {
    try {
        const sessionKit = getKit();
        if (session) {
            await sessionKit.logout(session);
            session = null;
        }
        sessionStorage.removeItem('WAX_WALLET');
        dispatchAuthChange(null);
    } catch (error) {
        console.error('[Auth] Logout failed:', error);
        throw error;
    }
}

export async function restoreSession() {
    const kit = getKit();
    try {
        const result = await kit.restore({ chainId: CHAIN.id });
        if (result?.session?.actor) {
            session = result.session;
            const wallet = session.actor.toString();
            sessionStorage.setItem('WAX_WALLET', wallet);
            dispatchAuthChange(wallet);
            return wallet;
        }
    } catch (error) {
        console.error('[Auth] Restore session failed:', error);
        if (error.message && error.message.includes('Checksum')) {
            try { await kit.storage.remove('session'); } catch {}
        }
        session = null;
        sessionStorage.removeItem('WAX_WALLET');
        dispatchAuthChange(null);
        return null;
    }

    try { await kit.storage.remove('session'); } catch {}
    session = null;
    sessionStorage.removeItem('WAX_WALLET');
    dispatchAuthChange(null);
    return null;
}
