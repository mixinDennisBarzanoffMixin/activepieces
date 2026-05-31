import './polyfills';
import { render } from 'solid-js/web';

import './i18n';
import App from './app/app';

render(() => <App />, document.getElementById('root') as HTMLElement);
