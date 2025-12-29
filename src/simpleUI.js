import { AbstractUserInterface } from '@wharfkit/session'

export class SimpleUI extends AbstractUserInterface {
    onLogin() {}
    onLoginResult(result) {}
    onError(error) {
        console.error("Wharfkit UI error", error);
    }
}
