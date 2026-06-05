/// <reference types='vitest' />
import path from 'path';

import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import tailwindcss from '@tailwindcss/vite';
import customHtmlPlugin from './vite-plugins/html-plugin';

export default defineConfig(({ command, mode }) => {
  const isDev =
    (command === 'serve' || mode === 'development') &&
    process.env.VERITLY_SKIP_VITE_CHECKER !== '1';
  const debug = mode === 'development' || process.env.VERITLY_DEBUG_BUILD === '1';
  const api = (process.env.ACTIVEPIECES_PROXY_TARGET || 'http://127.0.0.1:3000').replace(/\/+$/, '');
  const host = new URL(api).host;

  const AP_TITLE = 'Activepieces';
  const AP_FAVICON = 'https://activepieces.com/favicon.ico';

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/packages/web',
    server: {
      // allowedHosts: ['wozcsvaint.loclx.io'],
      proxy: {
        '/api': {
          target: api,
          secure: false,
          changeOrigin: true,
          headers: {
            Host: host,
          },
          ws: true,
        },
        '^/mcp(/|$)': {
          target: api,
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
          rewrite: (p: string) => p,
        },
        '/.well-known': {
          target: api,
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/register': {
          target: api,
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/authorize': {
          target: api,
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/token': {
          target: api,
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/revoke': {
          target: api,
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
      },
      port: 4200,
      host: '0.0.0.0',
    },

    preview: {
      port: 4300,
      host: 'localhost',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.json'],
      dedupe: [
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/language',
        '@codemirror/commands',
      ],
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@activepieces/shared': path.resolve(
          __dirname,
          '../../packages/shared/src',
        ),
        'ee-embed-sdk': path.resolve(
          __dirname,
          '../../packages/ee/embed-sdk/src',
        ),
        '@activepieces/pieces-framework': path.resolve(
          __dirname,
          '../../packages/pieces/framework/src/index.ts',
        ),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      tsconfigPaths(),
      customHtmlPlugin({
        title: AP_TITLE,
        icon: AP_FAVICON,
      }),
      ...(isDev
        ? [
            checker({
              typescript: {
                buildMode: true,
                tsconfigPath: './tsconfig.json',
                root: __dirname,
              },
            }),
          ]
        : []),
    ],

    build: {
      outDir: '../../dist/packages/web',
      emptyOutDir: true,
      reportCompressedSize: true,
      sourcemap: debug,
      minify: debug ? false : 'esbuild',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        onLog(level, log, handler) {
          if (
            log.cause &&
            log.message.includes(`Can't resolve original location of error.`)
          ) {
            return;
          }
          handler(level, log);
        },
      },
    },
  };
});
