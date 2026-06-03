import { ACTIVEPIECES_CHAT_TIERS } from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  CornerDownLeft,
  Equal,
  Lightbulb,
  Rocket,
} from 'lucide-solid';
import { createEffect, createSignal, For, type Component } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const TIER_CONFIG: Record<
  string,
  {
    icon: Component<{ class?: string }>;
    displayLabel: string;
    description: string;
  }
> = {
  fast: {
    icon: Equal,
    displayLabel: 'Fast',
    description: 'Quick replies for simple tasks',
  },
  smart: {
    icon: Lightbulb,
    displayLabel: 'Expert',
    description: 'Best for everyday use',
  },
  premium: {
    icon: Rocket,
    displayLabel: 'Heavy',
    description: 'Highest quality, a bit slower',
  },
};

export function ChatModelSelector(props: {
  selectedModel: string | null;
  onModelChange: (modelId: string) => void;
}) {
  const [open, setOpen] = createSignal(false);
  const [focusedIndex, setFocusedIndex] = createSignal(-1);
  let listRef: HTMLDivElement | undefined;

  const selectedTierId = () => props.selectedModel ?? 'smart';
  const selectedConfig = () =>
    TIER_CONFIG[selectedTierId()] ?? TIER_CONFIG.smart;

  createEffect(() => {
    if (!open) return;
    const idx = ACTIVEPIECES_CHAT_TIERS.findIndex(
      (tier) => tier.id === selectedTierId(),
    );
    setFocusedIndex(idx >= 0 ? idx : 0);
    const rafId = requestAnimationFrame(() => listRef?.focus());
    return () => cancelAnimationFrame(rafId);
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < ACTIVEPIECES_CHAT_TIERS.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev > 0 ? prev - 1 : ACTIVEPIECES_CHAT_TIERS.length - 1,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const tier = ACTIVEPIECES_CHAT_TIERS[focusedIndex()];
      if (tier) {
        props.onModelChange(tier.id);
        setOpen(false);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open()}
          class="h-7 gap-1 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <span>{t(selectedConfig().displayLabel)}</span>
          <ChevronDown class="size-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        class="w-[330px] p-0"
        align="end"
        side="top"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div
          ref={(el) => (listRef = el)}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          class="outline-none"
        >
          <div class="py-1">
            <For each={ACTIVEPIECES_CHAT_TIERS}>
              {(tier, index) => {
                const config = TIER_CONFIG[tier.id];
                if (!config) return null;
                const Icon = config.icon;
                const isSelected = () => selectedTierId() === tier.id;
                const isFocused = () => focusedIndex() === index();
                return (
                  <div
                    onClick={() => {
                      props.onModelChange(tier.id);
                      setOpen(false);
                    }}
                    onMouseEnter={() => setFocusedIndex(index())}
                    class={cn(
                      'flex items-center gap-3 px-3 py-3.5 cursor-pointer transition-colors',
                      isFocused() && 'bg-accent',
                    )}
                  >
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-background">
                      <Icon class="size-4 text-foreground" />
                    </div>
                    <div class="flex flex-1 flex-col gap-0.5">
                      <span class="text-sm font-medium">
                        {t(config.displayLabel)}
                      </span>
                      <span class="text-xs text-muted-foreground">
                        {t(config.description)}
                      </span>
                    </div>
                    <Check
                      class={cn(
                        'size-4 shrink-0',
                        isSelected() ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </div>
                );
              }}
            </For>
          </div>
          <div class="flex items-center gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
            <div class="flex items-center gap-1">
              <kbd class="flex h-5 w-5 items-center justify-center rounded border bg-muted">
                <ArrowUp class="size-3" />
              </kbd>
              <kbd class="flex h-5 w-5 items-center justify-center rounded border bg-muted">
                <ArrowDown class="size-3" />
              </kbd>
              <span>{t('to navigate')}</span>
            </div>
            <div class="flex items-center gap-1">
              <kbd class="flex h-5 w-5 items-center justify-center rounded border bg-muted">
                <CornerDownLeft class="size-3" />
              </kbd>
              <span>{t('to select')}</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
