import { PlanStepStatus, PlanStepUpdate } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ListChecks, Loader2, X } from 'lucide-solid';
import { AnimatePresence, motion } from 'motion/react';
import { createMemo, For, Match, Show, Switch } from 'solid-js';

import { TextShimmer } from '@/components/ui/text-shimmer';
import { cn } from '@/lib/utils';

import { PlanProgressData } from '../lib/message-parsers';

function computeStepStatuses({
  stepCount,
  updates,
}: {
  stepCount: number;
  updates: PlanStepUpdate[];
}): PlanStepStatus[] {
  const statuses: PlanStepStatus[] = Array.from(
    { length: stepCount },
    () => 'pending',
  );
  for (const update of updates) {
    if (update.stepIndex >= 0 && update.stepIndex < stepCount) {
      statuses[update.stepIndex] = update.status;
    }
  }
  return statuses;
}

function StepIndicator(props: { status: PlanStepStatus; index: number }) {
  return (
    <Switch
      fallback={
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground/50 text-[10px] font-medium">
          {props.index + 1}
        </span>
      }
    >
      <Match when={props.status === 'done'}>
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
          <Check class="h-3 w-3 text-green-600 dark:text-green-400" />
        </span>
      </Match>
      <Match when={props.status === 'executing'}>
        <span class="flex h-5 w-5 items-center justify-center">
          <Loader2 class="h-4 w-4 text-primary animate-spin" />
        </span>
      </Match>
      <Match when={props.status === 'error'}>
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10">
          <X class="h-3 w-3 text-destructive" />
        </span>
      </Match>
      <Match when={props.status === 'pending'}>
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground/50 text-[10px] font-medium">
          {props.index + 1}
        </span>
      </Match>
    </Switch>
  );
}

function overallStatus(
  statuses: PlanStepStatus[],
): 'pending' | 'executing' | 'done' | 'error' {
  if (statuses.some((s) => s === 'error')) return 'error';
  if (statuses.every((s) => s === 'done')) return 'done';
  if (statuses.some((s) => s === 'executing' || s === 'done'))
    return 'executing';
  return 'pending';
}

function completedCount(statuses: PlanStepStatus[]): number {
  return statuses.filter((s) => s === 'done').length;
}

export function PlanProgressCard(props: {
  progress: PlanProgressData;
  updates: PlanStepUpdate[];
  currentActivity?: string | null;
  isStreaming?: boolean;
}) {
  const stepStatuses = createMemo(() =>
    computeStepStatuses({
      stepCount: props.progress.steps.length,
      updates: props.updates,
    }),
  );

  const rawStatus = createMemo(() => overallStatus(stepStatuses()));
  const status = createMemo(() =>
    props.isStreaming && rawStatus() === 'done' ? 'executing' : rawStatus(),
  );
  const done = createMemo(() => completedCount(stepStatuses()));
  const total = createMemo(() => props.progress.steps.length);

  return (
    <motion.div
      class="rounded-xl border bg-background overflow-hidden my-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div class="px-3.5 pt-3 pb-2">
        <div class="flex items-center justify-between gap-2">
          <h3 class="font-medium text-xs flex items-center gap-1.5 text-foreground">
            <ListChecks class="h-3.5 w-3.5 text-muted-foreground" />
            {props.progress.title}
          </h3>
          <Show
            when={status() === 'done'}
            fallback={
              <Show
                when={status() === 'error'}
                fallback={
                  status() === 'executing' ? (
                    <span class="text-xs text-muted-foreground">
                      {done()}/{total()}
                    </span>
                  ) : null
                }
              >
                <span class="inline-flex items-center gap-1 text-destructive text-xs font-medium">
                  <X class="h-3 w-3" />
                  {t('Error')}
                </span>
              </Show>
            }
          >
            <span class="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
              <Check class="h-3 w-3" />
              {t('Done')}
            </span>
          </Show>
        </div>
      </div>

      <div class="px-3.5 pb-3">
        <div class="flex flex-col gap-0.5">
          <For each={props.progress.steps}>
            {(step, index) => {
              const stepStatus = () => stepStatuses()[index()] ?? 'pending';
              return (
                <div>
                  <motion.div
                    class="flex items-center gap-2.5 py-1 px-1 rounded-md"
                    initial={false}
                    animate={{
                      backgroundColor:
                        stepStatus() === 'executing'
                          ? 'var(--color-primary-50, rgba(99,102,241,0.05))'
                          : 'transparent',
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <StepIndicator status={stepStatus()} index={index()} />
                    <div class="flex items-center gap-2 min-w-0">
                      <span
                        class={cn(
                          'text-xs transition-all duration-200',
                          stepStatus() === 'done' &&
                            'line-through text-muted-foreground',
                          stepStatus() === 'executing' &&
                            'font-medium text-foreground',
                          stepStatus() === 'error' && 'text-destructive',
                          stepStatus() === 'pending' && 'text-muted-foreground',
                        )}
                      >
                        {step}
                      </span>
                      <Show when={stepStatus() === 'executing'}>
                        <span class="text-[11px] text-primary font-medium shrink-0">
                          {t('Running')}
                        </span>
                      </Show>
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    <Show
                      when={
                        stepStatus() === 'executing' && props.currentActivity
                      }
                    >
                      <motion.div
                        class="ml-8 mt-0.5 mb-1"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <TextShimmer
                          class="text-[11px] text-muted-foreground"
                          duration={3}
                        >
                          {props.currentActivity}
                        </TextShimmer>
                      </motion.div>
                    </Show>
                  </AnimatePresence>
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </motion.div>
  );
}
