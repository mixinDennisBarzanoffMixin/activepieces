import {
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip as ChartTooltip,
} from 'chart.js';
import { t } from 'i18next';
import { Download } from 'lucide-solid';
import { Show, createEffect, onCleanup } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { downloadChartAsPng } from '../lib/impact-utils';

Chart.register(
  CategoryScale,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ChartTooltip,
);

type AnalyticsAreaChartProps = {
  title: string;
  subtitle: string;
  tooltipLabel: string;
  dataKey: string;
  color: string;
  gradientId: string;
  chartData: Array<Record<string, string | number>>;
  isLoading: boolean;
  emptyIcon: JSX.Element;
  emptyText: string;
  downloadFilename: string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
};

export function AnalyticsAreaChart({
  title,
  subtitle,
  tooltipLabel,
  dataKey,
  color,
  gradientId,
  chartData,
  isLoading,
  emptyIcon,
  emptyText,
  downloadFilename,
  yAxisFormatter,
  tooltipFormatter,
}: AnalyticsAreaChartProps) {
  let chartRef = null;

  const chartConfig = {
    [dataKey]: { label: tooltipLabel, color },
  } satisfies ChartConfig;

  return (
    <Card ref={(el) => (chartRef = el)}>
      <CardHeader class="space-y-0 pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <CardTitle class="text-base font-medium">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8 print:hidden"
                onClick={() => downloadChartAsPng(chartRef, downloadFilename)}
              >
                <Download class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Download as PNG')}</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent class="pt-4">
        <Show
          when={isLoading}
          fallback={
            <Show
              when={chartData.length === 0}
              fallback={
                  <ChartContainer config={chartConfig} class="h-[300px] w-full">
                    <AreaCanvas
                      data={chartData}
                      dataKey={dataKey}
                      color={color}
                      yAxisFormatter={yAxisFormatter}
                      tooltipFormatter={tooltipFormatter}
                      tooltipLabel={tooltipLabel}
                    />
                  </ChartContainer>
              }
            >
              <div className="flex h-[300px] w-full flex-col items-center justify-center gap-2">
                {emptyIcon}
                <p className="text-sm text-muted-foreground">{emptyText}</p>
              </div>
            </Show>
          }
        >
          <Skeleton class="h-[300px] w-full" />
        </Show>
      </CardContent>
    </Card>
  );
}

function AreaCanvas({
  data,
  dataKey,
  color,
  yAxisFormatter,
  tooltipFormatter,
  tooltipLabel,
}: {
  data: Array<Record<string, string | number>>;
  dataKey: string;
  color: string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
  tooltipLabel: string;
}) {
  let canvas: HTMLCanvasElement | undefined;

  createEffect(() => {
    if (!canvas) {
      return;
    }
    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map((item) =>
          new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        ),
        datasets: [
          {
            label: tooltipLabel,
            data: data.map((item) => Number(item[dataKey])),
            borderColor: color,
            backgroundColor: `${color}33`,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => {
                const value = Number(item.raw);
                return `${tooltipLabel}: ${tooltipFormatter ? tooltipFormatter(value) : value}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: 'hsl(var(--muted-foreground))' },
          },
          y: {
            border: { display: false },
            grid: { color: 'hsl(var(--border))' },
            ticks: {
              color: 'hsl(var(--muted-foreground))',
              callback: (value) =>
                yAxisFormatter ? yAxisFormatter(Number(value)) : value,
            },
          },
        },
      },
    });

    onCleanup(() => chart.destroy());
  });

  return <canvas ref={(el) => (canvas = el)} />;
}
