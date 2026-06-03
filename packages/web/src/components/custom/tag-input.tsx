'use client';

import { t } from 'i18next';
import { XIcon } from 'lucide-solid';
import { createSignal, For, Show, type JSX } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { InputProps } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

type TagInputProps = Omit<InputProps, 'value' | 'onChange'> & {
  value?: ReadonlyArray<string>;
  onChange: (value: ReadonlyArray<string>) => void;
  validateItem?: (item: string) => boolean;
  badgeClassName?: string;
  invalidBadgeClassName?: string;
  getTagMeta?: (item: string) => TagMeta | undefined;
  rightContent?: JSX.Element;
  type?: 'default' | 'email';
  showDescription?: boolean;
  onInputChange?: (value: string) => void;
};

const SEPARATOR = ' ';
const SPLIT_PATTERN = /[, ]/;

const TagInput = (props: TagInputProps) => {
  const {
    className,
    value = [],
    onChange,
    validateItem,
    badgeClassName,
    invalidBadgeClassName,
    getTagMeta,
    rightContent,
    type = 'default',
    showDescription = true,
    onInputChange,
    ...domProps
  } = props;

  const effectiveValidateItem =
    validateItem ||
    (type === 'email'
      ? (email: string) => formatUtils.emailRegex.test(email.trim())
      : undefined);

  const effectiveBadgeClassName =
    badgeClassName ||
    (type === 'email'
      ? 'rounded-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 font-normal'
      : undefined);

  const effectiveInvalidBadgeClassName =
    invalidBadgeClassName ||
    (type === 'email'
      ? 'text-destructive-800 bg-destructive-50 border-destructive-200 dark:text-destructive-200 dark:bg-destructive-900 dark:border-destructive-800'
      : undefined);

  const [pendingDataPoint, setPendingDataPoint] = createSignal('');
  let internalInputRef: HTMLInputElement | undefined;

  const commitWithSeparator = (input: string) => {
    const newDataPoints = new Set(
      [...value, ...input.split(SPLIT_PATTERN)].flatMap((x) => {
        const trimmedX = x.trim();
        return trimmedX.length > 0 ? [trimmedX] : [];
      }),
    );
    onChange(Array.from(newDataPoints));
    setPendingDataPoint('');
    onInputChange?.('');
  };

  const addPendingDataPoint = () => {
    const current = pendingDataPoint();
    if (current) {
      const newDataPoints = new Set(
        [...value, ...current.split(SPLIT_PATTERN)].flatMap((x) => {
          const trimmedX = x.trim();
          return trimmedX.length > 0 ? [trimmedX] : [];
        }),
      );
      onChange(Array.from(newDataPoints));
      onInputChange?.('');
      setPendingDataPoint('');
    }
  };

  return (
    <div class="w-full">
      <div class="relative w-full">
        <div
          class={cn(
            // caveat: :has() variant requires tailwind v3.4 or above: https://tailwindcss.com/blog/tailwindcss-v3-4#new-has-variant
            'has-focus-visible:ring-neutral-950 dark:has-focus-visible:ring-neutral-300 border-neutral-200 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 flex min-h-9 w-full rounded-md border bg-white ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 has-focus-visible:outline-hidden has-focus-visible:ring-2 has-focus-visible:ring-offset-2 cursor-text',
            className,
          )}
          onClick={() => internalInputRef?.focus()}
        >
          <ScrollArea class="w-full max-h-32" viewPortClassName="px-3 py-2">
            <div
              class={cn(
                'flex flex-wrap gap-2 text-sm',
                rightContent && 'pr-[140px]',
              )}
            >
              <For each={value}>
                {(item) => {
                  const isValid = effectiveValidateItem
                    ? effectiveValidateItem(item)
                    : true;
                  const tagMeta = getTagMeta?.(item);
                  const badge = (
                    <Badge
                      variant={'accent'}
                      class={cn(
                        'font-medium max-w-full cursor-default',
                        effectiveBadgeClassName,
                        !isValid && effectiveInvalidBadgeClassName,
                        tagMeta?.className,
                      )}
                    >
                      {tagMeta?.icon}
                      <span
                        class={cn(
                          'text-xs overflow-hidden text-ellipsis whitespace-nowrap min-w-0',
                          type === 'email' && 'max-w-[25ch]',
                        )}
                      >
                        {item}
                      </span>
                      <Button
                        variant={'ghost'}
                        size={'icon'}
                        class={'ml-2 h-3 w-3 shrink-0 hover:bg-transparent'}
                        onClick={() => {
                          onChange(value.filter((i) => i !== item));
                        }}
                      >
                        <XIcon class={'w-3'} />
                      </Button>
                    </Badge>
                  );
                  if (tagMeta?.tooltip) {
                    return (
                      <Tooltip>
                        <TooltipTrigger asChild>{badge}</TooltipTrigger>
                        <TooltipContent side="bottom">
                          {tagMeta.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return badge;
                }}
              </For>
              <input
                class={
                  'placeholder:text-neutral-500 dark:placeholder:text-neutral-400 w-full min-w-[200px] flex-1 outline-hidden bg-transparent'
                }
                autoComplete="off"
                value={pendingDataPoint()}
                onChange={(e) => {
                  const newValue = e.currentTarget.value;
                  if (SPLIT_PATTERN.test(newValue)) {
                    commitWithSeparator(newValue);
                  } else {
                    setPendingDataPoint(newValue);
                    onInputChange?.(newValue);
                  }
                }}
                {...domProps}
                onKeyDown={(e) => {
                  domProps.onKeyDown?.(e);
                  if (e.defaultPrevented) return;
                  if (
                    e.key === 'Enter' ||
                    e.key === SEPARATOR ||
                    e.key === ','
                  ) {
                    e.preventDefault();
                    addPendingDataPoint();
                  } else if (
                    e.key === 'Backspace' &&
                    pendingDataPoint().length === 0 &&
                    value.length > 0
                  ) {
                    e.preventDefault();
                    onChange(value.slice(0, -1));
                  }
                }}
                onBlur={(e) => {
                  addPendingDataPoint();
                  domProps.onBlur?.(e);
                }}
                placeholder={value.length > 0 ? '' : domProps.placeholder}
                ref={(el) => (internalInputRef = el)}
              />
            </div>
          </ScrollArea>
        </div>
        <Show when={rightContent}>
          <div class="absolute right-2 top-2 pointer-events-auto">
            {rightContent}
          </div>
        </Show>
      </div>
      <Show when={type === 'email' && showDescription}>
        <p class="text-xs text-muted-foreground mt-2">
          {t('Separate email addresses with a space or comma.')}
        </p>
      </Show>
    </div>
  );
};

export { TagInput };

type TagMeta = {
  className?: string;
  icon?: JSX.Element;
  tooltip?: string;
};

export type { TagMeta };
