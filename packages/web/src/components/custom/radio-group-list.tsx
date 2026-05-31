import { cn } from '@/lib/utils';

import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

import { CardListItem } from './card-list';

export type RadioGroupListItem<T> = {
  label: string;
  value: T;
  labelExtra?: any;
  description?: string;
};
const RadioGroupList = <T,>({
  items,
  onChange,
  value,
  onHover,
  className,
}: {
  items: RadioGroupListItem<T>[];
  onChange: (value: T) => void;
  value: T | null;
  onHover?: (value: T | null) => void;
  className?: string;
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      <RadioGroup value={JSON.stringify(value)}>
        <For each={items}>
          {(item, index) => {
            const selected = item.value === value;
            return (
              <CardListItem
                class={cn(
                  `p-4 rounded-lg border block hover:border-primary/50 hover:bg-muted/50`,
                  {
                    'border-primary bg-primary/5': selected,
                  },
                )}
                onClick={() => onChange(item.value)}
                onMouseEnter={() => onHover && onHover(item.value)}
                onMouseLeave={() => onHover && onHover(null)}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-md font-medium flex items-center gap-2">
                    {item.label}
                    {item.labelExtra}
                  </h4>
                  <div className="shrink-0 w-5 h-5">
                    <RadioGroupItem
                      value={JSON.stringify(item.value)}
                      class="scale-125"
                    ></RadioGroupItem>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
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

RadioGroupList.displayName = 'RadioGroupList';
export { RadioGroupList };
