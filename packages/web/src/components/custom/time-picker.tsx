'use client';

import { isNil } from '@activepieces/shared';
import { createSignal, createEffect } from 'solid-js';

import { cn } from '@/lib/utils';

import { TimePeriodSelect } from './time-period-select';
import { Period } from './time-picker-utils';
import { TimeUnitPickerInput } from './time-unit-input';

interface TimePickerProps {
  date: Date | undefined;
  setDate: (date: Date) => void;
  showSeconds?: boolean;
  name?: string;
}

const minutesItems = new Array(60).fill(0).map((_, index) => ({
  value: index.toString(),
  label: index < 10 ? `0${index}` : index.toString(),
}));

const hoursItems = new Array(12).fill(0).map((_, index) => ({
  value: (index + 1).toString(),
  label: index + 1 < 10 ? `0${index + 1}` : (index + 1).toString(),
}));

export function TimePicker({
  date,
  setDate,
  showSeconds,
  name = 'from',
}: TimePickerProps) {
  const [period, setPeriod] = createSignal<Period>(() => {
    if (date) {
      return date.getHours() >= 12 ? 'PM' : 'AM';
    }
    return name === 'from' ? 'AM' : 'PM';
  });
  createEffect(() => {
    if (date && date.getHours() >= 12) {
      setPeriod('PM');
    } else if (!date) {
      setPeriod(name === 'from' ? 'AM' : 'PM');
    }
  });
  const hasValueChanged =
    name === 'from'
      ? date?.getHours() !== 0 || date?.getMinutes() !== 0 || period() !== 'AM'
      : date?.getHours() !== 23 ||
        date?.getMinutes() !== 59 ||
        period() !== 'PM';
  const isActive = !isNil(date) && hasValueChanged;
  let minuteRef: HTMLInputElement | undefined;
  let hourRef: HTMLInputElement | undefined;
  let secondRef: HTMLInputElement | undefined;
  let periodRef: HTMLButtonElement | undefined;

  return (
    <div
      className={cn(
        'flex items-center transition-all  gap-2 w-full text-muted-foreground justify-center bg-accent/50 py-1 px-2 rounded-sm h-[43px] border border-solid border-border',
        {
          'text-foreground': isActive,
        },
      )}
    >
      <div className="grid gap-1 text-center">
        <TimeUnitPickerInput
          picker="12hours"
          isActive={isActive}
          period={period()}
          date={date}
          setDate={setDate}
          name={name}
          ref={(el) => (hourRef = el)}
          onRightFocus={() => minuteRef?.focus()}
          autoCompleteList={hoursItems}
        />
      </div>
      :
      <div className="grid gap-1 text-center">
        <TimeUnitPickerInput
          picker="minutes"
          id="minutes12"
          isActive={isActive}
          name={name}
          date={date}
          period={period()}
          setDate={setDate}
          ref={(el) => (minuteRef = el)}
          onLeftFocus={() => hourRef?.focus()}
          onRightFocus={() => secondRef?.focus()}
          autoCompleteList={minutesItems}
        />
      </div>
      <Show when={showSeconds}>
        <>
          :
          <div className="grid gap-1 text-center">
            <TimeUnitPickerInput
              picker="seconds"
              id="seconds12"
              name={name}
              isActive={isActive}
              date={date}
              setDate={setDate}
              ref={(el) => (secondRef = el)}
              onLeftFocus={() => minuteRef?.focus()}
              onRightFocus={() => periodRef?.focus()}
            />
          </div>
        </>
      </Show>
      <div className="grid gap-1 text-center">
        <TimePeriodSelect
          period={period()}
          isActive={isActive}
          setPeriod={setPeriod}
          date={date}
          setDate={setDate}
          ref={(el) => (periodRef = el)}
          onLeftFocus={() => secondRef?.focus()}
        />
      </div>
    </div>
  );
}
