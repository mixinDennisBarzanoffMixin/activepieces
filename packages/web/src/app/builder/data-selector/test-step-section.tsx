import { t } from 'i18next';
import { ArrowUpRight } from 'lucide-solid';
import { Show, createMemo } from 'solid-js';

import { Button } from '@/components/ui/button';

import { useBuilderStateContext } from '../builder-hooks';

export const TestStepSection = (props: { stepName: string }) => {
  const isTrigger = createMemo(() => props.stepName === 'trigger');
  const selectStepByName = useBuilderStateContext(
    (state) => state.selectStepByName,
  );

  return (
    <div class="flex items-center justify-between gap-2 mx-3 my-2 px-3 py-2 rounded-md bg-muted/50 border border-dashed border-border">
      <span class="text-xs text-muted-foreground leading-snug">
        <Show
          when={isTrigger()}
          fallback={t('No sample data yet — test this step first.')}
        >
          {t('No sample data yet — load it from the trigger.')}
        </Show>
      </span>
      <Button
        onClick={() => selectStepByName(props.stepName)}
        variant="ghost"
        size="sm"
        class="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 shrink-0"
      >
        <Show when={isTrigger()} fallback={t('Go to step')}>
          {t('Go to trigger')}
        </Show>
        <ArrowUpRight class="size-3" />
      </Button>
    </div>
  );
};
