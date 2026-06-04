import { statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const repo = path.resolve(root, '../..');
const src = path.join(root, 'src');
const ext = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
const pkg = '@veritly/activepieces-editor';
const reactId = '\0veritly-activepieces-editor/react';
const domId = '\0veritly-activepieces-editor/react-dom-client';
const stylesId = '\0veritly-activepieces-editor/styles';

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

function webPlugin(appSrc?: string): Plugin {
  return {
    name: 'veritly-activepieces-web',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === pkg) {
        return path.join(src, 'veritly-editor.tsx');
      }
      if (source === `${pkg}/react`) {
        return reactId;
      }
      if (source === `${pkg}/react-dom-client`) {
        return domId;
      }
      if (source === `${pkg}/styles`) {
        return stylesId;
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
    load(id) {
      if (id === reactId) {
        return 'import React from "react"; const createElement = React.createElement; export { createElement }; export default React;';
      }
      if (id === domId) {
        return 'import { createRoot, hydrateRoot } from "react-dom/client"; export { createRoot, hydrateRoot };';
      }
      if (id === stylesId) {
        return `import css from ${JSON.stringify(
          path.join(src, 'styles.css') + '?inline',
        )}; export default css;`;
      }
    },
  };
}

export const veritlyActivepiecesWeb = { webPlugin };
