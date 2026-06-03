import { For } from 'solid-js';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CalendarProps = {
  className?: string;
  mode?: 'single' | 'range';
  selected?: Date | { from?: Date; to?: Date };
  onSelect?: (value: Date | { from?: Date; to?: Date } | undefined) => void;
  disabled?: (date: Date) => boolean;
};

function Calendar(props: CalendarProps) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const days = Array.from(
    {
      length: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(),
    },
    (_, index) => new Date(start.getFullYear(), start.getMonth(), index + 1),
  );

  const select = (day: Date) => {
    if (props.disabled?.(day)) return;
    if (props.mode === 'range') {
      const selected =
        props.selected && !(props.selected instanceof Date)
          ? props.selected
          : {};
      props.onSelect?.(
        selected.from && !selected.to
          ? { ...selected, to: day }
          : { from: day },
      );
      return;
    }
    props.onSelect?.(day);
  };

  return (
    <div
      class={cn('w-72 rounded-md border bg-background p-3', props.className)}
    >
      <div class="mb-2 text-center text-sm font-medium">
        {today.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </div>
      <div class="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        <For each={['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']}>
          {(day) => <div>{day}</div>}
        </For>
      </div>
      <div class="mt-1 grid grid-cols-7 gap-1">
        <For each={Array.from({ length: start.getDay() })}>{() => <div />}</For>
        <For each={days}>
          {(day) => (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={props.disabled?.(day)}
              class="h-8 w-8 p-0"
              onClick={() => select(day)}
            >
              {day.getDate()}
            </Button>
          )}
        </For>
      </div>
    </div>
  );
}

function CalendarDayButton(props: any) {
  return <Button {...props} />;
}

export { Calendar, CalendarDayButton };
