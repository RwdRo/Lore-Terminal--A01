let session = null;
const authChangeCallbacks = [];

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
    if (!btn) return;
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
        const { SessionKit } = await import('https://cdn.skypack.dev/@wharfkit/session');
        const { WalletPluginCloudWallet } = await import('https://cdn.skypack.dev/@wharfkit/wallet-plugin-cloudwallet');

        const walletPlugin = new WalletPluginCloudWallet();

        const sessionKit = new SessionKit({
            appName: 'A01-Canon-Debug',
            chains: [{
                id: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
                url: 'https://wax.greymass.com',
                fallbackUrls: [
                    'https://api.waxsweden.org',
                    'https://wax.eosrio.io',
                ],
            }],
            walletPlugins: [walletPlugin],
        });

        const result = await sessionKit.login({ restoreSession: false });
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
        const { SessionKit } = await import('https://cdn.skypack.dev/@wharfkit/session');
        if (session) {
            const sessionKit = new SessionKit({}); // minimal just to call logout
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
        const { SessionKit } = await import('https://cdn.skypack.dev/@wharfkit/session');
        const { WalletPluginCloudWallet } = await import('https://cdn.skypack.dev/@wharfkit/wallet-plugin-cloudwallet');

        const walletPlugin = new WalletPluginCloudWallet();

        const sessionKit = new SessionKit({
            appName: 'A01-Canon-Debug',
            chains: [{
                id: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
                url: 'https://wax.greymass.com'
            }],
            walletPlugins: [walletPlugin],
        });

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
