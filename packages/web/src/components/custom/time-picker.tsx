'use client';

import { isNil } from '@activepieces/shared';
import {
  createSignal,
  createEffect,
  Show,
  mergeProps,
  createMemo,
} from 'solid-js';

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

export function TimePicker(_props: TimePickerProps) {
  const props = mergeProps({ name: 'from' }, _props);
  const [period, setPeriod] = createSignal<Period>(() => {
    if (props.date) {
      return props.date.getHours() >= 12 ? 'PM' : 'AM';
    }
    return props.name === 'from' ? 'AM' : 'PM';
  });
  createEffect(() => {
    if (props.date && props.date.getHours() >= 12) {
      setPeriod('PM');
    } else if (!props.date) {
      setPeriod(props.name === 'from' ? 'AM' : 'PM');
    }
  });
  const changed = createMemo(() =>
    props.name === 'from'
      ? props.date?.getHours() !== 0 ||
        props.date.getMinutes() !== 0 ||
        period() !== 'AM'
      : props.date?.getHours() !== 23 ||
        props.date.getMinutes() !== 59 ||
        period() !== 'PM',
  );
  const active = createMemo(() => !isNil(props.date) && changed());
  let minuteRef: HTMLInputElement | undefined;
  let hourRef: HTMLInputElement | undefined;
  let secondRef: HTMLInputElement | undefined;
  let periodRef: HTMLButtonElement | undefined;

  return (
    <div
      class={cn(
        'flex items-center transition-all  gap-2 w-full text-muted-foreground justify-center bg-accent/50 py-1 px-2 rounded-sm h-[43px] border border-solid border-border',
        {
          'text-foreground': active(),
        },
      )}
    >
      <div class="grid gap-1 text-center">
        <TimeUnitPickerInput
          picker="12hours"
          isActive={active()}
          period={period()}
          date={props.date}
          setDate={props.setDate}
          name={props.name}
          ref={(el: HTMLInputElement) => {
            hourRef = el;
          }}
          onRightFocus={() => minuteRef?.focus()}
          autoCompleteList={hoursItems}
        />
      </div>
      :
      <div class="grid gap-1 text-center">
        <TimeUnitPickerInput
          picker="minutes"
          id="minutes12"
          isActive={active()}
          name={props.name}
          date={props.date}
          period={period()}
          setDate={props.setDate}
          ref={(el: HTMLInputElement) => {
            minuteRef = el;
          }}
          onLeftFocus={() => hourRef?.focus()}
          onRightFocus={() => secondRef?.focus()}
          autoCompleteList={minutesItems}
        />
      </div>
      <Show when={props.showSeconds}>
        <>
          :
          <div class="grid gap-1 text-center">
            <TimeUnitPickerInput
              picker="seconds"
              id="seconds12"
              name={props.name}
              isActive={active()}
              date={props.date}
              setDate={props.setDate}
              ref={(el: HTMLInputElement) => {
                secondRef = el;
              }}
              onLeftFocus={() => minuteRef?.focus()}
              onRightFocus={() => periodRef?.focus()}
            />
          </div>
        </>
      </Show>
      <div class="grid gap-1 text-center">
        <TimePeriodSelect
          period={period()}
          isActive={active()}
          setPeriod={setPeriod}
          date={props.date}
          setDate={props.setDate}
          ref={(el: HTMLButtonElement) => {
            periodRef = el;
          }}
          onLeftFocus={() => secondRef?.focus()}
        />
      </div>
    </div>
  );
}
