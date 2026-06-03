import {
  createContext,
  useContext,
  createSignal,
  createEffect,
  mergeProps,
  splitProps,
  untrack,
  type JSX,
} from 'solid-js';

import { flagsHooks } from '@/hooks/flags-hooks';
import { colorsUtils } from '@/lib/color-utils';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: JSX.Element;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  forceLightMode: boolean;
  setForceLightMode: (value: boolean) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  forceLightMode: false,
  setForceLightMode: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const setFavicon = (url: string) => {
  document.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = url;
  document.head.appendChild(link);
};

export function ThemeProvider(_props: ThemeProviderProps) {
  const props = mergeProps(
    { defaultTheme: 'system', storageKey: 'ap-ui-theme' },
    _props,
  );
  const [local, rest] = splitProps(props, [
    'children',
    'defaultTheme',
    'storageKey',
  ]);
  const key = untrack(() => local.storageKey);
  const stored = untrack(() => localStorage.getItem(local.storageKey));
  const [theme, setTheme] = createSignal<Theme>(
    stored ? (stored as Theme) : untrack(() => local.defaultTheme),
  );
  const [forceLightMode, setForceLightMode] = createSignal(false);
  const branding = flagsHooks.useWebsiteBranding();
  createEffect(() => {
    const b = branding();
    if (!b) {
      return;
    }
    const root = window.document.documentElement;

    const resolvedTheme = forceLightMode()
      ? 'light'
      : theme() === 'system'
      ? 'light'
      : theme();
    root.classList.remove('light', 'dark');
    document.title = b.websiteName;
    document.documentElement.style.setProperty(
      '--primary',
      colorsUtils.hexToHslString(b.colors.primary.default),
    );

    setFavicon(b.logos.favIconUrl);
    switch (resolvedTheme) {
      case 'light': {
        document.documentElement.style.setProperty(
          '--primary-100',
          colorsUtils.hexToHslString(b.colors.primary.light),
        );
        document.documentElement.style.setProperty(
          '--primary-300',
          colorsUtils.hexToHslString(b.colors.primary.dark),
        );
        break;
      }
      case 'dark': {
        document.documentElement.style.setProperty(
          '--primary-100',
          colorsUtils.hexToHslString(b.colors.primary.dark),
        );
        document.documentElement.style.setProperty(
          '--primary-300',
          colorsUtils.hexToHslString(b.colors.primary.light),
        );
        break;
      }
      default:
        break;
    }

    root.classList.add(resolvedTheme);
  });

  const value = {
    get theme() {
      return theme();
    },
    setTheme: (t: Theme) => {
      localStorage.setItem(key, t);
      setTheme(t);
    },
    get forceLightMode() {
      return forceLightMode();
    },
    setForceLightMode: (v: boolean) => setForceLightMode(v),
  };

  return (
    <ThemeProviderContext.Provider {...rest} value={value}>
      {local.children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  return useContext(ThemeProviderContext);
};

export const useApRipple = () => {
  const ctx = useTheme();
  let el: HTMLElement | undefined;
  const ref = (node: HTMLElement) => {
    el = node;
    node.classList.add('relative', 'overflow-hidden');
  };
  const event = (e: MouseEvent) => {
    if (!el) return;
    const circle = document.createElement('span');
    const diameter = Math.max(el.clientWidth, el.clientHeight);
    const radius = diameter / 2;
    const box = el.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - box.left - radius}px`;
    circle.style.top = `${e.clientY - box.top - radius}px`;
    circle.style.background =
      ctx.theme === 'dark'
        ? 'rgba(233, 233, 233, 0.2)'
        : 'rgba(155, 155, 155, 0.2)';
    circle.className = 'pointer-events-none absolute rounded-full animate-ping';
    el.querySelector('[data-ripple-effect]')?.remove();
    circle.dataset.rippleEffect = 'true';
    el.appendChild(circle);
    window.setTimeout(() => circle.remove(), 450);
  };
  return [ref, event] as const;
};
