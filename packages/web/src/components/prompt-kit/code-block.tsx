import {
  bundledLanguages,
  codeToTokens,
  type BundledLanguage,
  type ThemedToken,
} from 'shiki';
import { createSignal, createEffect, JSX } from 'solid-js';

import { cn } from '@/lib/utils';

function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  return (
    <div
      className={cn(
        'not-prose flex w-full flex-col overflow-clip border',
        'border-border bg-card text-card-foreground rounded-xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CodeBlockCode({
  code,
  language = 'tsx',
  theme,
  className,
  ...props
}: CodeBlockCodeProps) {
  const [tokenResult, setTokenResult] = createSignal<TokenResult | null>(null);

  createEffect(() => {
    if (!code) {
      setTokenResult(null);
      return;
    }

    let cancelled = false;

    async function highlight() {
      const themeOptions = theme
        ? { theme }
        : {
            themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
            defaultColor: false as const,
          };

      const lang = isBundledLanguage(language) ? language : 'plaintext';

      let result;
      try {
        result = await codeToTokens(code, { lang, ...themeOptions });
      } catch {
        if (lang === 'plaintext') return;
        try {
          result = await codeToTokens(code, {
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

    highlight();
    return () => {
      cancelled = true;
    };
  }, [code, language, theme]);

  const classNames = cn(
    'w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4',
    className,
  );

  if (!tokenResult) {
    return (
      <div className={classNames} {...props}>
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  const lastLineIndex = tokenResult.lines.length - 1;

  return (
    <div className={classNames} {...props}>
      <pre className="shiki" style={tokenResult.preStyle}>
        <code>
          {tokenResult.lines.map((line, lineIndex) => (
            <span key={lineIndex} className="line">
              {line.map((token, tokenIndex) => (
                <span key={tokenIndex} style={token.style}>
                  {token.content}
                </span>
              ))}
              {lineIndex < lastLineIndex ? '\n' : ''}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function CodeBlockGroup({
  children,
  className,
  ...props
}: CodeBlockGroupProps) {
  return (
    <div
      className={cn('flex items-center justify-between', className)}
      {...props}
    >
      {children}
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
} & JSX.HTMLAttributes<HTMLDivElement>;

export type CodeBlockCodeProps = {
  code: string;
  language?: string;
  theme?: string;
  className?: string;
} & JSX.HTMLAttributes<HTMLDivElement>;

export type CodeBlockGroupProps = JSX.HTMLAttributes<HTMLDivElement>;

export { CodeBlockGroup, CodeBlockCode, CodeBlock };
