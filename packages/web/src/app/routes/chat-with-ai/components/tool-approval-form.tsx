import { t } from 'i18next';
import { X } from 'lucide-solid';
import { motion } from 'motion/react';
import { createSignal, createUniqueId, For, Fragment, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const APPROVAL_OPTIONS = [
  { value: 'approve', labelKey: 'Yes, proceed' },
  { value: 'reject', labelKey: 'No, cancel' },
] as const;

export function ToolApprovalForm(props: {
  displayName: string;
  onApprove: () => void;
  onReject: () => void;
  onDismiss: () => void;
}) {
  const fieldId = createUniqueId();
  const [hoveredIndex, setHoveredIndex] = createSignal<number | null>(null);

  function handleSelect(value: string) {
    if (value === 'approve') props.onApprove();
    if (value === 'reject') props.onReject();
  }

  return (
    <motion.div
      class="rounded-2xl border border-border/60 bg-background p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] dark:bg-neutral-900 dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-colors"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <Label class="block text-base font-semibold leading-snug text-foreground">
            {props.displayName}
          </Label>
        </div>
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 shrink-0"
          onClick={props.onDismiss}
          aria-label={t('Close')}
        >
          <X class="size-4" />
        </Button>
      </div>

      <div class="mt-4">
        <RadioGroup value="" onValueChange={handleSelect} class="gap-0">
          <For each={APPROVAL_OPTIONS}>
            {(option, i) => {
              const id = () => `${fieldId}-opt-${i()}`;
              const isHovered = () => hoveredIndex() === i();
              const prevHovered = () => hoveredIndex() === i() - 1;
              return (
                <Fragment key={option.value}>
                  <Show when={i() > 0}>
                    <div class="px-3">
                      <Separator
                        class={cn(
                          'bg-border/60 transition-opacity duration-150',
                          (isHovered() || prevHovered()) && 'opacity-0',
                        )}
                      />
                    </div>
                  </Show>
                  <Label
                    for={id()}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHoveredIndex(i())}
                    onMouseLeave={() =>
                      setHoveredIndex((prev) => (prev === i() ? null : prev))
                    }
                    class="group flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-normal cursor-pointer transition-colors hover:bg-muted"
                  >
                    <RadioGroupItem
                      id={id()}
                      value={option.value}
                      class="peer sr-only"
                    />
                    <span
                      aria-hidden
                      class="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted-foreground/10 text-xs font-medium text-muted-foreground transition-colors"
                    >
                      {i() + 1}
                    </span>
                    <span class="flex-1 leading-snug">
                      {t(option.labelKey)}
                    </span>
                  </Label>
                </Fragment>
              );
            }}
          </For>
        </RadioGroup>
      </div>
    </motion.div>
  );
}
