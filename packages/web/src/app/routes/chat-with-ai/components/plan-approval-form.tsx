import { t } from 'i18next';
import { Check, Circle, ListChecks, X } from 'lucide-solid';
import { motion } from 'motion/react';
import { For, Show } from 'solid-js';

import { Button } from '@/components/ui/button';

export function PlanApprovalForm(props: {
  planSummary: string;
  steps: string[];
  onApprove: () => void;
  onReject: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      class="rounded-2xl border bg-background overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <div class="px-4 pt-4 pb-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-2.5 flex-1 min-w-0">
            <div class="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 shrink-0 mt-0.5">
              <ListChecks class="h-4 w-4 text-primary" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-foreground">
                {t('Ready to execute')}
              </p>
              <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {props.planSummary}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => props.onDismiss()}
            aria-label={t('Close')}
          >
            <X class="size-3.5" />
          </button>
        </div>
      </div>

      <Show when={props.steps.length > 0}>
        <div class="px-4 pb-3">
          <div class="flex flex-col gap-0.5">
            <For each={props.steps}>
              {(step) => (
                <div class="flex items-center gap-2.5 py-1.5 px-2 rounded-md">
                  <Circle class="h-3 w-3 text-muted-foreground/30 shrink-0" />
                  <span class="text-xs text-muted-foreground">{step}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <div class="flex items-center gap-2 px-4 py-3 border-t bg-muted/30">
        <Button
          size="sm"
          onClick={() => props.onApprove()}
          class="gap-1.5"
          type="button"
        >
          <Check class="size-3.5" />
          {t('Approve')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => props.onReject()}
          class="text-muted-foreground"
          type="button"
        >
          {t('Cancel')}
        </Button>
      </div>
    </motion.div>
  );
}
