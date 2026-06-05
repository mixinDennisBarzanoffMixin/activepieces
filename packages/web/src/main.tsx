import './polyfills';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import './i18n';
import App from './app/app';
import VeritlyAutomationEditorRoot from './veritly-editor';

function param(url: URL, key: string) {
  const value = url.searchParams.get(key)?.trim();
  if (!value) throw new Error(`Missing ${key}`);
  return value;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
const url = new URL(window.location.href);

if (url.pathname === '/veritly/editor') {
  root.render(
    <VeritlyAutomationEditorRoot
      flowId={param(url, 'flowId')}
      projectId={param(url, 'projectId')}
      path={param(url, 'path')}
      name={url.searchParams.get('name')?.trim() || undefined}
    />,
  );
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
