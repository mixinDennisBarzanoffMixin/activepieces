import { For, mergeProps, Show } from 'solid-js';

import { cn } from '@/lib/utils';

type DataListProps = {
  data?: Record<string, unknown>;
  className?: string;
};

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export const DataList = (_props: DataListProps) => {
  const props = mergeProps({ data: {}, className: '' }, _props);
  const entries = () =>
    Object.entries(props.data).filter(
      (entry) => entry[1] !== null && entry[1] !== undefined,
    );

  return (
    <Show
      when={entries().length > 0}
      fallback={
        <div
          class={cn('text-sm text-muted-foreground italic', props.className)}
        >
          No data available
        </div>
      }
    >
      <dl
        class={cn('grid gap-y-2 text-sm leading-relaxed', props.className)}
        style={{ 'word-break': 'break-word' }}
      >
        <For each={entries()}>
          {(entry) => (
            <div class="grid grid-cols-[auto_1fr] gap-x-3 items-start">
              <dt class="font-medium text-muted-foreground capitalize">
                {entry[0]}
              </dt>
              <dd class="text-primary">{formatValue(entry[1])}</dd>
            </div>
          )}
        </For>
      </dl>
    </Show>
  );
};
