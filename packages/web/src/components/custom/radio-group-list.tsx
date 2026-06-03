import { For, type JSXElement } from 'solid-js';

import { cn } from '@/lib/utils';

import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

import { CardListItem } from './card-list';

export type RadioGroupListItem<T> = {
  label: string;
  value: T;
  labelExtra?: JSXElement;
  description?: string;
};
const RadioGroupList = <T,>(props: {
  items: RadioGroupListItem<T>[];
  onChange: (value: T) => void;
  value: T | null;
  onHover?: (value: T | null) => void;
  className?: string;
}) => {
  return (
    <div class={cn('space-y-4', props.className)}>
      <RadioGroup value={JSON.stringify(props.value)}>
        <For each={props.items}>
          {(item) => {
            const selected = item.value === props.value;
            return (
              <CardListItem
                class={cn(
                  `p-4 rounded-lg border block hover:border-primary/50 hover:bg-muted/50`,
                  {
                    'border-primary bg-primary/5': selected,
                  },
                )}
                onClick={() => props.onChange(item.value)}
                onMouseEnter={() => props.onHover && props.onHover(item.value)}
                onMouseLeave={() => props.onHover && props.onHover(null)}
              >
                <div class="flex justify-between items-center mb-2">
                  <h4 class="text-md font-medium flex items-center gap-2">
                    {item.label}
                    {item.labelExtra}
                  </h4>
                  <div class="shrink-0 w-5 h-5">
                    <RadioGroupItem
                      value={JSON.stringify(item.value)}
                      class="scale-125"
                    />
                  </div>
                </div>
                <div class="text-sm text-muted-foreground">
                  {item.description}
                </div>
              </CardListItem>
            );
          }}
        </For>
      </RadioGroup>
    </div>
  );
};

export { RadioGroupList };
