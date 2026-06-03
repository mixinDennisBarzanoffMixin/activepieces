import { t } from 'i18next';
import { CircleHelp } from 'lucide-solid';
import { createSignal, createEffect, For, Show } from 'solid-js';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  flowRunQueries,
  RunStatusCategory,
} from '@/features/flow-runs/hooks/flow-run-hooks';
import { formatUtils } from '@/lib/format-utils';

const DONUT_SIZE = 20;
const DONUT_RADIUS = 6;
const DONUT_STROKE = 2.5;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const DONUT_CENTER = DONUT_SIZE / 2;

function MiniDonut(props: { categories: RunStatusCategory[]; total: number }) {
  let accumulated = 0;
  return (
    <svg
      width={DONUT_SIZE}
      height={DONUT_SIZE}
      viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
    >
      <Show
        when={props.total === 0}
        fallback={props.categories.map((cat) => {
          const segmentLength = (cat.count / props.total) * DONUT_CIRCUMFERENCE;
          const offset = DONUT_CIRCUMFERENCE - accumulated;
          accumulated += segmentLength;
          return (
            <circle
              cx={DONUT_CENTER}
              cy={DONUT_CENTER}
              r={DONUT_RADIUS}
              fill="none"
              stroke={cat.color}
              strokeWidth={DONUT_STROKE}
              strokeDasharray={`${segmentLength} ${
                DONUT_CIRCUMFERENCE - segmentLength
              }`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${DONUT_CENTER} ${DONUT_CENTER})`}
            />
          );
        })}
      >
        <circle
          cx={DONUT_CENTER}
          cy={DONUT_CENTER}
          r={DONUT_RADIUS}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeWidth={DONUT_STROKE}
          opacity={0.4}
        />
      </Show>
    </svg>
  );
}

function RunsStatusChart() {
  const { categories, total, refetch } = flowRunQueries.useRunStats();
  const [open, setOpen] = createSignal(false);
  const [isVisible, setIsVisible] = createSignal(false);

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (v) {
      void refetch();
      return;
    }
    setIsVisible(false);
  };

  createEffect(() => {
    if (open) {
      requestAnimationFrame(() => setIsVisible(true));
    }
  });

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button class="flex items-center gap-2 px-3 py-1.5 border border-dashed rounded-md hover:bg-accent transition-colors text-sm text-muted-foreground">
          <MiniDonut categories={categories()} total={total()} />
          {t('Queue Status')}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" class="w-80 p-4">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <p class="text-sm font-medium">{t('Current Queue Status')}</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CircleHelp class="size-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t('Showing results from the last 7 days')}
                </TooltipContent>
              </Tooltip>
            </div>
            <p class="text-xs text-muted-foreground">
              {t('Total Runs')}: {formatUtils.formatNumberCompact(total())}
            </p>
          </div>

          <Show
            when={total() === 0}
            fallback={
              <>
                <div class="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                  <For each={categories()}>
                    {(cat) => (
                      <div
                        style={{
                          width: isVisible
                            ? `${(cat.count / total()) * 100}%`
                            : '0%',
                          'background-color': cat.color,
                          transition: 'width 600ms ease-out',
                        }}
                      />
                    )}
                  </For>
                </div>

                <div class="flex flex-col gap-1.5">
                  <For each={categories()}>
                    {(cat) => (
                      <div class="flex items-center justify-between text-xs">
                        <div class="flex items-center gap-2">
                          <div
                            class="size-2.5 rounded-full"
                            style={{ 'background-color': cat.color }}
                          />
                          <span>
                            {formatUtils.convertEnumToHumanReadable(cat.label)}
                          </span>
                        </div>
                        <span class="font-medium tabular-nums">
                          {formatUtils.formatNumberCompact(cat.count)}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </>
            }
          >
            <p class="text-sm text-muted-foreground">
              {t('There are no runs')}
            </p>
          </Show>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { RunsStatusChart };
