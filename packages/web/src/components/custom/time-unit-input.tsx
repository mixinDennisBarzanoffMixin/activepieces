import { isNil } from '@activepieces/shared';
import { createSignal, createEffect, createMemo } from 'solid-js';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { AutoComplete } from './autocomplete';
import {
  Period,
  TimePickerType,
  getArrowByType,
  getDateByType,
  setDateByType,
} from './time-picker-utils';

export interface TimeUnitPickerInputProps extends any {
  picker: TimePickerType;
  date: Date | undefined;
  setDate: (date: Date) => void;
  period?: Period;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
  isActive: boolean;
  autoCompleteList?: { value: string; label: string }[];
  isAutocompleteOpen?: boolean;
  name?: string;
}

const TimeUnitPickerInputInner = (
  props: TimeUnitPickerInputProps & { ref?: HTMLInputElement },
) => {
  let ref: HTMLInputElement | undefined;
  const [flag, setFlag] = createSignal(false);
  const [prevIntKey, setPrevIntKey] = createSignal('0');

  /**
   * allow the user to enter the second digit within 2 seconds
   * otherwise start again with entering first digit
   */
  createEffect(() => {
    if (flag()) {
      const timer = setTimeout(() => {
        setFlag(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  });

  const calculatedValue = createMemo(() => {
    return getDateByType(props.date, props.picker);
  });

  const calculateNewValue = (key: string) => {
    /*
     * If picker is '12hours' and the first digit is 0, then the second digit is automatically set to 1.
     * The second entered digit will break the condition and the value will be set to 10-12.
     */
    if (props.picker === '12hours') {
      if (
        flag() &&
        calculatedValue().slice(1, 2) === '1' &&
        prevIntKey() === '0'
      )
        return '0' + key;
    }

    return !flag() ? '0' + key : calculatedValue().slice(1, 2) + key;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    props.onKeyDown?.(e);
    if (e.key === 'Tab') return;
    e.preventDefault();
    if (e.key === 'ArrowRight') props.onRightFocus?.();
    if (e.key === 'ArrowLeft') props.onLeftFocus?.();
    if (['ArrowUp', 'ArrowDown'].includes(e.key) && !props.isAutocompleteOpen) {
      const step = e.key === 'ArrowUp' ? 1 : -1;
      const newValue = getArrowByType(calculatedValue(), step, props.picker);
      if (flag()) setFlag(false);
      const tempDate = new Date(props.date);
      props.setDate(
        setDateByType(tempDate, newValue, props.picker, props.period),
      );
    }
    if (e.key >= '0' && e.key <= '9') {
      if (props.picker === '12hours') setPrevIntKey(e.key);
      const newValue = calculateNewValue(e.key);
      setFlag((prev) => !prev);
      const tempDate = new Date(props.date);
      props.setDate(
        setDateByType(tempDate, newValue, props.picker, props.period),
      );
    }
  };

  return (
    <Input
      ref={(el) => (ref = el)}
      id={props.id || props.picker}
      name={props.name || props.picker}
      class={cn(
        'hover:bg-accent caret-primary w-[73px] h-[29px] p-0 text-center rounded-xs bg-transparent transition-all  text-sm tabular-nums border-none [&::-webkit-inner-spin-button]:appearance-none',
        props.className,
        {
          'bg-background': props.isActive,
        },
      )}
      value={props.value || calculatedValue()}
      onChange={(e) => {
        e.preventDefault();
        props.onChange?.(e);
      }}
      type={props.type}
      inputMode="decimal"
      onKeyDown={handleKeyDown}
      onClick={props.onClick}
    />
  );
};

const TimeUnitPickerInput = (
  props: TimeUnitPickerInputProps & { ref?: HTMLInputElement },
) => {
  let ref: HTMLInputElement | undefined;
  const [open, setOpen] = createSignal(false);
  let listRef: HTMLDivElement | undefined;
  const [filterValue, setFilterValue] = createSignal('');

  if (isNil(props.autoCompleteList) || props.autoCompleteList.length === 0) {
    return <TimeUnitPickerInputInner {...props} ref={(el) => (ref = el)} />;
  }
  return (
    <>
      <TimeUnitPickerInputInner
        {...props}
        onKeyDown={(e) => {
          props.onKeyDown?.(e);
          if (
            e.key === 'ArrowDown' ||
            e.key === 'ArrowUp' ||
            (e.key === 'Enter' && open())
          ) {
            const event = new KeyboardEvent('keydown', {
              key: e.key,
              bubbles: true,
              cancelable: true,
            });
            if (listRef) {
              listRef.dispatchEvent(event);
            }
            event.preventDefault();
          }
        }}
        setDate={(date) => {
          props.setDate(date);
          const fv = getDateByType(date, props.picker);
          setFilterValue(fv[0] === '0' ? fv.slice(1) : fv);
        }}
        ref={(el) => (ref = el)}
        isAutocompleteOpen={open()}
        onClick={() => {
          setFilterValue('');
          setOpen(true);
        }}
      />
      <AutoComplete
        class={cn('bg-transparent text-muted-foreground rounded-xs', {
          'bg-background': props.isActive,
          'hover:bg-accent': !props.isActive,
          'text-foreground': props.isActive,
        })}
        items={props.autoCompleteList.filter((item) =>
          item.label.includes(filterValue()),
        )}
        selectedValue={''}
        open={open()}
        setOpen={(open) => {
          setFilterValue('');
          setOpen(open);
        }}
        listRef={listRef}
        onSelectedValueChange={(value) => {
          const tempDate = new Date(
            props.date || new Date(new Date().setHours(0, 0, 0, 0)),
          );
          props.setDate(
            setDateByType(tempDate, value, props.picker, props.period),
          );
        }}
      >
        <div className="w-full -mt-2"></div>
      </AutoComplete>
    </>
  );
};

export { TimeUnitPickerInput };
