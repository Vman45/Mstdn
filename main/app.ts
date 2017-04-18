import * as path from 'path';
import {app, Menu, globalShortcut} from 'electron';
import log from './log';
import {Config, Account} from './config';
import AccountSwitcher from './account_switcher';
import defaultMenu from './default_menu';
import Window from './window';

const IS_DARWIN = process.platform === 'darwin';
const APP_ICON = path.join(__dirname, '..', 'resources', 'icon', 'icon.png');

export class App {
    private switcher: AccountSwitcher;

    constructor(private win: Window, private config: Config) {
        if (config.accounts.length === 0) {
            throw new Error('No account found. Please check the config.');
        }
        if (IS_DARWIN) {
            app.dock.setIcon(APP_ICON);
        }
        Menu.setApplicationMenu(defaultMenu());
        this.switcher = new AccountSwitcher(this.config.accounts);
        this.switcher.on('switch', this.onAccountSwitch);
    }

    start() {
        const a = this.switcher.current;
        const url = `https://${a.host}${a.default_page}`;
        this.win.open(url);
        log.debug('Application started', a, url);
    }

    private onAccountSwitch = (next: Account) => {
        this.win.close();
        if (this.config.hot_key) {
            log.debug('Disable global shortcut for switching account');
            globalShortcut.unregister(this.config.hot_key);
        }
        Window.create(next, this.config, this.win.menubar) .then(win => {
            log.debug('Window was recreated again', next);
            this.win = win;
            this.start();
        });
    }
}

export default function startApp(config: Config) {
    const default_account = config.accounts[0];
    return Window.create(default_account, config)
        .then(win => new App(win, config));
}
