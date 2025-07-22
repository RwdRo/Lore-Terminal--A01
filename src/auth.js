import { installBufferPolyfill } from './bufferPolyfill.js'
installBufferPolyfill()
import { SessionKit } from '@wharfkit/session'
import { WalletPluginCloudWallet } from '@wharfkit/wallet-plugin-cloudwallet'

let session = null
let sessionKit
const authChangeCallbacks = []
const CHAIN = {
  id: '1064487b3cd1a897c10f3fa6b05b68f29ed27b5c46e81d7b78c4f2b5ab17e7f9',
  url: 'https://wax.greymass.com'
}

function getKit() {
  if (!sessionKit) {
    const walletPlugin = new WalletPluginCloudWallet()
    sessionKit = new SessionKit({
      appName: 'A01 Terminal',
      chains: [CHAIN],
      walletPlugins: [walletPlugin]
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

export async function login() {
    try {
    const sessionKit = getKit();
        const result = await sessionKit.login({ chain: CHAIN });
        if (!result || !result.session) throw new Error('Login failed: No session returned.');
        session = result.session;

        const wallet = session.actor.toString();
        sessionStorage.setItem('WAX_WALLET', wallet);
        dispatchAuthChange(wallet);
        return wallet;

    } catch (error) {
        console.error('[Auth] Login failed:', error);
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
    try {
        const sessionKit = getKit();

        const result = await sessionKit.restore({ chain: CHAIN });
        if (result && result.session && result.session.actor) {
            session = result.session;
            const wallet = session.actor.toString();
            sessionStorage.setItem('WAX_WALLET', wallet);
            dispatchAuthChange(wallet);
            return wallet;
        } else {
            dispatchAuthChange(null);
            return null;
        }

    } catch (error) {
        console.error('[Auth] Restore session failed:', error);
        dispatchAuthChange(null);
        return null;
    }
}
