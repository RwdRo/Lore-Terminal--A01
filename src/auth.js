let session = null;
let kit = null;
const authChangeCallbacks = [];

async function getKit() {
    if (kit) return kit;
    const { SessionKit } = await import('@wharfkit/session');
    const { WalletPluginCloudWallet } = await import('@wharfkit/wallet-plugin-cloudwallet');

    class SimpleUI {
        constructor(requireChainSelect = false) {
            this.requireChainSelect = requireChainSelect;
        }
        async login(context) {
            return {
                chainId: context.chains[0].id,
                walletPluginIndex: 0,
                permissionLevel: context.permissionLevel
            };
        }
        async onError(error) { console.error('SessionKit UI error:', error); }
        async onAccountCreate() {}
        async onAccountCreateComplete() {}
        async onLogin() {}
        async onLoginComplete() {}
        async onTransact() {}
        async onTransactComplete() {}
        async onSign() {}
        async onSignComplete() {}
        async onBroadcast() {}
        async onBroadcastComplete() {}
        prompt() { return { result: Promise.resolve(null), cancel: () => {} }; }
        status() {}
        translate(key) { return key; }
        getTranslate() { return (key) => key; }
        addTranslations() {}
    }

    const walletPlugin = new WalletPluginCloudWallet();
    kit = new SessionKit({
        appName: 'A01 Terminal',
        chains: [
            {
                id: '1064487b3cd1a897c10f3fa6b05b68f29ed27b5c46e81d7b78c4f2b5ab17e7f9',
                url: 'https://wax.greymass.com'
            }
        ],
        ui: new SimpleUI(false),
        uiRequirements: { requiresChainSelect: false, requiresWalletSelect: false },
        walletPlugins: [walletPlugin]
    });
    return kit;
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
        const sessionKit = await getKit();
        const result = await sessionKit.login();
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
        const sessionKit = await getKit();
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
        const sessionKit = await getKit();

        const result = await sessionKit.restore();
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
