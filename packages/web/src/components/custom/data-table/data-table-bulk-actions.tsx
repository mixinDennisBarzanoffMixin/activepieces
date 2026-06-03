import { t } from 'i18next';
import { X } from 'lucide-solid';
import { AnimatePresence, motion } from 'motion/react';
import { Show, For, type JSXElement } from 'solid-js';

import { Button } from '@/components/ui/button';

interface DataTableBulkActionsProps<TData> {
  selectedRows: TData[];
  actions: Array<{
    render: (selectedRows: TData[], resetSelection: () => void) => JSXElement;
  }>;
  resetSelection: () => void;
}

export function DataTableBulkActions<TData>(
  props: DataTableBulkActionsProps<TData>,
) {
  return (
    <AnimatePresence>
      <Show when={props.selectedRows.length > 0}>
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div class="flex items-center gap-3 bg-background border rounded-lg shadow-lg p-2">
            <For each={props.actions}>
              {(action) => (
                <>{action.render(props.selectedRows, props.resetSelection)}</>
              )}
            </For>
            <div class="border-l h-6 mx-1" />
            <span class="text-sm text-muted-foreground">
              {t('{count} selected', { count: props.selectedRows.length })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              onClick={props.resetSelection}
            >
              <X class="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </Show>
    </AnimatePresence>
  );
}
