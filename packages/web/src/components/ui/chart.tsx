import {
  type Component,
  createContext,
  createUniqueId,
  splitProps,
  type JSX,
} from 'solid-js';

import { cn } from '@/lib/utils';

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
  [k in string]: {
    label?: JSX.Element;
    icon?: Component;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = createContext<ChartContextProps | null>(null);

function ChartContainer(
  _props: ClassName<JSX.IntrinsicElements['div']> & {
    config: ChartConfig;
    children: JSX.Element;
  },
) {
  const [local, rest] = splitProps(_props, [
    'id',
    'className',
    'children',
    'config',
  ]);
  const uniqueId = createUniqueId();
  const chartId = `chart-${local.id || uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config: local.config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        class={cn('flex aspect-video justify-center text-xs', local.className)}
        {...rest}
      >
        <ChartStyle id={chartId} config={local.config} />
        {local.children}
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle(props: { id: string; config: ChartConfig }) {
  return <style>{chartCss(props)}</style>;
}

function ChartTooltip(_props: ChartTooltipProps) {
  return null;
}

function ChartTooltipContent(_props: ChartTooltipContentProps) {
  return null;
}

function ChartLegend(_props: ChartLegendProps) {
  return null;
}

function ChartLegendContent(_props: ChartLegendContentProps) {
  return null;
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
};

type ChartTooltipProps = Record<string, unknown>;

type ChartLegendProps = Record<string, unknown>;

type ChartTooltipContentProps = ClassName<JSX.IntrinsicElements['div']> & {
  active?: boolean;
  label?: string;
};

type ChartLegendContentProps = ClassName<JSX.IntrinsicElements['div']> & {
  verticalAlign?: 'top' | 'bottom';
};

function chartCss(props: { id: string; config: ChartConfig }) {
  return `${chartThemeCss({ props, theme: 'light', prefix: THEMES.light })}
${chartThemeCss({ props, theme: 'dark', prefix: THEMES.dark })}`;
}

function chartThemeCss({
  props,
  theme,
  prefix,
}: {
  props: { id: string; config: ChartConfig };
  theme: keyof typeof THEMES;
  prefix: string;
}) {
  const vars = Object.entries(props.config)
    .map(([key, cfg]) => {
      const color = cfg.theme?.[theme] ?? cfg.color;
      return color ? `  --color-${key}: ${color};` : undefined;
    })
    .filter((value): value is string => !!value)
    .join('\n');

  return vars
    ? `${prefix} [data-chart=${props.id}] {
${vars}
}`
    : '';
}
