import {AbstractUserInterface} from '@wharfkit/session'
import {cancelable} from '@wharfkit/common'

const WAX_CHAIN_ID = '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'

export class SimpleUI extends AbstractUserInterface {
  async login(context) {
    try {
      return {
        walletPluginIndex: 0,
        chainId: WAX_CHAIN_ID,
        permissionLevel: context.permissionLevel
      }
    } catch (error) {
      console.error('[UI login]', error)
      return { walletPluginIndex: 0, chainId: WAX_CHAIN_ID, permissionLevel: context.permissionLevel }
    }
  }
  async onError(error) { console.error('[UI]', error) }
  async onAccountCreate() { return {} }
  async onAccountCreateComplete() {}
  async onLogin() {}
  async onLoginComplete() {}
  async onTransact() {}
  async onTransactComplete() {}
  async onSign() {}
  async onSignComplete() {}
  async onBroadcast() {}
  async onBroadcastComplete() {}
  prompt() { return cancelable(Promise.resolve({})) }
  status() {}
  translate(key, options) { return options?.default ?? key }
  addTranslations() {}
}
