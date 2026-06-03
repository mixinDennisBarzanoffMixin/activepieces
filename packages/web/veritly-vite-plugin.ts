import { statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const repo = path.resolve(root, '../..');
const src = path.join(root, 'src');
const deps = path.join(root, 'node_modules');
const ext = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];

function file(source: string) {
  const target = path.join(src, source);
  return ext.map((suffix) => target + suffix).find((candidate) => {
    try {
      return statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
}

function active(importer: string | undefined) {
  return importer && path.normalize(importer).includes(src);
}

function dep(source: string) {
  return path.join(deps, source);
}

function react(source: string) {
  if (source === 'react') return dep('react/index.js');
  if (source === 'react-dom') return dep('react-dom/index.js');
  return dep(`${source}.js`);
}

function webPlugin(appSrc?: string): Plugin {
  return {
    name: 'veritly-activepieces-web',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === 'activepieces-web/veritly-editor') {
        return path.join(src, 'veritly-editor.tsx');
      }
      if (source === 'activepieces-web/react') {
        return dep('react/index.js');
      }
      if (source === 'activepieces-web/react-dom-client') {
        return dep('react-dom/client.js');
      }
      if (
        active(importer) &&
        (source === 'react' ||
          source === 'react/jsx-runtime' ||
          source === 'react/jsx-dev-runtime' ||
          source === 'react-dom' ||
          source === 'react-dom/client' ||
          source === 'react-dom/server')
      ) {
        return react(source);
      }
      if (source === '@activepieces/shared') {
        return path.join(repo, 'packages/shared/src/index.ts');
      }
      if (source === '@activepieces/pieces-framework') {
        return path.join(repo, 'packages/pieces/framework/src/index.ts');
      }
      if (source === 'ee-embed-sdk') {
        return path.join(repo, 'packages/ee/embed-sdk/src/index.ts');
      }
      if (!active(importer)) return;
      if (appSrc && path.normalize(source).startsWith(appSrc)) {
        return file(path.relative(appSrc, source));
      }
      if (!source.startsWith('@/')) return;
      return file(source.slice(2));
    },
  };
}

export const veritlyActivepiecesWeb = { webPlugin };
