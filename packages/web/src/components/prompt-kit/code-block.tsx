import {
  bundledLanguages,
  codeToTokens,
  type BundledLanguage,
  type ThemedToken,
} from 'shiki';
import {
  createEffect,
  createSignal,
  For,
  JSX,
  mergeProps,
  Show,
  splitProps,
} from 'solid-js';

import { cn } from '@/lib/utils';

function CodeBlock(_props: CodeBlockProps) {
  const [local, props] = splitProps(_props, ['children', 'className']);
  return (
    <div
      class={cn(
        'not-prose flex w-full flex-col overflow-clip border',
        'border-border bg-card text-card-foreground rounded-xl',
        local.className,
      )}
      {...props}
    >
      {local.children}
    </div>
  );
}

function CodeBlockCode(_props: CodeBlockCodeProps) {
  const merged = mergeProps({ language: 'tsx' }, _props);
  const [local, props] = splitProps(merged, [
    'code',
    'language',
    'theme',
    'className',
  ]);
  const [tokenResult, setTokenResult] = createSignal<TokenResult | null>(null);

  createEffect(() => {
    if (!local.code) {
      setTokenResult(null);
      return;
    }

    let cancelled = false;

    async function highlight() {
      const themeOptions = local.theme
        ? { theme: local.theme }
        : {
            themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
            defaultColor: false as const,
          };

      const lang = isBundledLanguage(local.language)
        ? local.language
        : 'plaintext';

      let result;
      try {
        result = await codeToTokens(local.code, { lang, ...themeOptions });
      } catch {
        if (lang === 'plaintext') return;
        try {
          result = await codeToTokens(local.code, {
            lang: 'plaintext',
            ...themeOptions,
          });
        } catch {
          return;
        }
      }

      if (cancelled) return;

      setTokenResult({
        lines: result.tokens.map((line) =>
          line.map((token) => ({
            content: token.content,
            style: getTokenStyle(token),
          })),
        ),
        preStyle:
          typeof result.rootStyle === 'string'
            ? parseCssProperties(result.rootStyle)
            : {},
      });
    }

    void highlight();
    return () => {
      cancelled = true;
    };
  });

  return (
    <div
      class={cn(
        'w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4',
        local.className,
      )}
      {...props}
    >
      <Show
        when={tokenResult()}
        fallback={
          <pre>
            <code>{local.code}</code>
          </pre>
        }
      >
        {(result) => (
          <pre class="shiki" style={result().preStyle}>
            <code>
              <For each={result().lines}>
                {(line, index) => (
                  <span class="line">
                    <For each={line}>
                      {(token) => (
                        <span style={token.style}>{token.content}</span>
                      )}
                    </For>
                    {index() < result().lines.length - 1 ? '\n' : ''}
                  </span>
                )}
              </For>
            </code>
          </pre>
        )}
      </Show>
    </div>
  );
}

function CodeBlockGroup(_props: CodeBlockGroupProps) {
  const [local, props] = splitProps(_props, ['children', 'className']);
  return (
    <div
      class={cn('flex items-center justify-between', local.className)}
      {...props}
    >
      {local.children}
    </div>
  );
}

const EMPTY_STYLE: JSX.CSSProperties = {};
const FONT_STYLE_ITALIC = 1;
const FONT_STYLE_BOLD = 2;
const FONT_STYLE_UNDERLINE = 4;

function getTokenStyle(token: ThemedToken): JSX.CSSProperties {
  if (token.htmlStyle) {
    const style: JSX.CSSProperties = {};
    for (const [key, value] of Object.entries(token.htmlStyle)) {
      Object.assign(style, { [toCssPropertyKey(key)]: value });
    }
    return style;
  }
  const style: JSX.CSSProperties = {};
  if (token.color) {
    style.color = token.color;
  }
  if (token.fontStyle) {
    if (token.fontStyle & FONT_STYLE_ITALIC) style.fontStyle = 'italic';
    if (token.fontStyle & FONT_STYLE_BOLD) style.fontWeight = 'bold';
    if (token.fontStyle & FONT_STYLE_UNDERLINE)
      style.textDecoration = 'underline';
  }
  if (!token.color && !token.fontStyle) return EMPTY_STYLE;
  return style;
}

function parseCssProperties(cssString: string): JSX.CSSProperties {
  const style: JSX.CSSProperties = {};
  for (const part of cssString.split(';')) {
    const colonIndex = part.indexOf(':');
    if (colonIndex === -1) continue;
    const key = part.slice(0, colonIndex).trim();
    const value = part.slice(colonIndex + 1).trim();
    if (key && value) {
      Object.assign(style, { [toCssPropertyKey(key)]: value });
    }
  }
  return style;
}

function toCssPropertyKey(key: string): string {
  if (key.startsWith('--')) return key;
  return key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function isBundledLanguage(lang: string): lang is BundledLanguage {
  return lang in bundledLanguages;
}

type PrecomputedToken = {
  content: string;
  style: JSX.CSSProperties;
};

type TokenResult = {
  lines: PrecomputedToken[][];
  preStyle: JSX.CSSProperties;
};

export type CodeBlockProps = {
  children?: JSX.Element;
  className?: string;
} & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'className'>;

export type CodeBlockCodeProps = {
  code: string;
  language?: string;
  theme?: string;
  className?: string;
} & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'className'>;

export type CodeBlockGroupProps = {
  children?: JSX.Element;
  className?: string;
} & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'className'>;

export { CodeBlockGroup, CodeBlockCode, CodeBlock };
