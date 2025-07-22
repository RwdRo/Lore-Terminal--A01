import {AbstractUserInterface} from '@wharfkit/session'
import {cancelable} from '@wharfkit/common'

export class SimpleUI extends AbstractUserInterface {
  async login(context) {
    return {
      walletPluginIndex: 0,
      chainId: context.chain ? context.chain.id : context.chains[0].id,
      permissionLevel: context.permissionLevel
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
