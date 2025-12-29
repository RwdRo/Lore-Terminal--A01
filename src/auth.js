import { SessionKit, Session } from '@wharfkit/session'
import { WalletPluginCloudWallet } from '@wharfkit/wallet-plugin-cloudwallet'
import { TransactPluginResourceProvider } from "@wharfkit/transact-plugin-resource-provider";
import { SimpleUI } from './simpleUI.js'

const CHAIN = {
    id: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
    url: 'https://wax.greymass.com'
}

const sessionKit = new SessionKit({
    appName: 'A01 Terminal',
    chains: [CHAIN],
    walletPlugins: [new WalletPluginCloudWallet()],
    transactPlugins: [new TransactPluginResourceProvider()],
    ui: new SimpleUI(),
});

let session = undefined;

export async function login() {
    const response = await sessionKit.login();
    session = response.session;
    return session;
}

export async function logout() {
    await sessionKit.logout();
    session = undefined;
}

export async function restore() {
    session = await sessionKit.restore();
    return session;
}

export function getSession() {
    return session;
}
