import './polyfills';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import './i18n';
import App from './app/app';
import VeritlyAutomationWorkspace from './veritly-workspace';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
const url = new URL(window.location.href);

if (url.pathname === '/veritly/editor') {
  const origin = url.searchParams.get('parentOrigin')?.trim();
  const frame = url.searchParams.get('frame')?.trim();
  if (!origin || !frame) {
    throw new Error('Activepieces workspace requires parentOrigin and frame');
  }
  root.render(<VeritlyAutomationWorkspace origin={origin} frame={frame} />);
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
