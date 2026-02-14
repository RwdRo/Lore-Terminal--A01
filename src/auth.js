import { SessionKit, Session } from '@wharfkit/session'
import { WalletPluginCloudWallet } from '@wharfkit/wallet-plugin-cloudwallet'
import { TransactPluginResourceProvider } from "@wharfkit/transact-plugin-resource-provider";
import { SimpleUI } from './simpleUI.js'
import { appConfig } from './config.js'

const CHAIN = {
    id: appConfig.waxChainId,
    url: appConfig.waxRpcEndpoints[0]
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
