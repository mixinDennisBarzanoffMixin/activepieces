import { format, subDays, addDays, startOfDay, endOfDay } from 'date-fns';
import { t } from 'i18next';
import { Calendar as CalendarIcon, Clock } from 'lucide-solid';
import {
  createSignal,
  createMemo,
  createEffect,
  Show,
  mergeProps,
} from 'solid-js';

import { TimePicker } from '@/components/custom/time-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export type DateRange = { from?: Date; to?: Date };

export type PresetKey =
  | '7days'
  | '14days'
  | '30days'
  | '90days'
  | '7'
  | '14'
  | '30'
  | '90';

type DateTimePickerWithRangeProps = {
  onChange: (date: DateRange | undefined) => void;
  className?: string;
  from?: string;
  to?: string;
  maxDate?: Date;
  minDate?: Date;
  presetType: 'past' | 'future';
  defaultSelectedRange?: PresetKey;
};

const applyTimeToDate = (timeDate: Date, targetDate: Date): Date => {
  const d = new Date(targetDate);
  d.setHours(
    timeDate.getHours(),
    timeDate.getMinutes(),
    timeDate.getSeconds(),
    timeDate.getMilliseconds(),
  );
  return d;
};

const getDayBoundaries = () => {
  const now = new Date();
  return {
    from: startOfDay(now),
    to: endOfDay(now),
  };
};

const PRESETS: Record<PresetKey, () => { from: Date; to: Date }> = {
  '7days': () => ({ from: subDays(new Date(), 7), to: new Date() }),
  '14days': () => ({ from: subDays(new Date(), 14), to: new Date() }),
  '30days': () => ({ from: subDays(new Date(), 30), to: new Date() }),
  '90days': () => ({ from: subDays(new Date(), 90), to: new Date() }),
  '7': () => ({ from: new Date(), to: addDays(new Date(), 7) }),
  '14': () => ({ from: new Date(), to: addDays(new Date(), 14) }),
  '30': () => ({ from: new Date(), to: addDays(new Date(), 30) }),
  '90': () => ({ from: new Date(), to: addDays(new Date(), 90) }),
};

const getPresetLabel = (value: string) => {
  const labels: Record<string, string> = {
    '7days': t('Last 7 Days'),
    '14days': t('Last 14 Days'),
    '30days': t('Last 30 Days'),
    '90days': t('Last 90 Days'),
    '7': t('Next 7 days'),
    '14': t('Next 14 days'),
    '30': t('Next 30 days'),
    '90': t('Next 90 days'),
  };
  return labels[value] || '';
};

const detectPreset = (
  from?: Date,
  to?: Date,
  presetType?: 'past' | 'future',
): string | null => {
  if (!from || !to) return null;

  const candidates =
    presetType === 'past'
      ? (['7days', '14days', '30days', '90days'] as PresetKey[])
      : (['7', '14', '30', '90'] as PresetKey[]);

  for (const key of candidates) {
    const { from: pf, to: pt } = PRESETS[key]();
    if (
      startOfDay(pf).getTime() === startOfDay(from).getTime() &&
      endOfDay(pt).getTime() === endOfDay(to).getTime()
    ) {
      return key;
    }
  }

  return null;
};

export const getDefaultRange = (presetKey: PresetKey) => {
  const preset = PRESETS[presetKey]();
  preset.from.setHours(0, 0, 0, 0);
  preset.to.setHours(23, 59, 59, 999);
  return preset;
};

const getInitialDateAndPreset = (
  fromProp?: string,
  toProp?: string,
  presetType: 'past' | 'future' = 'past',
  defaultPresetKey?: PresetKey,
): { initialDate: DateRange | undefined; initialPreset: string | null } => {
  let initialDate: DateRange | undefined;
  let initialPreset: string | null = null;

  if (fromProp && toProp) {
    initialDate = {
      from: new Date(fromProp),
      to: new Date(toProp),
    };
    initialPreset = detectPreset(initialDate.from, initialDate.to, presetType);
  } else if (defaultPresetKey) {
    initialDate = getDefaultRange(defaultPresetKey);
    initialPreset = defaultPresetKey;
  }

  return { initialDate, initialPreset };
};

export function DateTimePickerWithRange(_props: DateTimePickerWithRangeProps) {
  const props = mergeProps({ maxDate: new Date(), presetType: 'past' }, _props);
  const { initialDate, initialPreset } = createMemo(() => {
    return getInitialDateAndPreset(
      props.from,
      props.to,
      props.presetType,
      props.defaultSelectedRange,
    );
  })();

  const [date, setDate] = createSignal<DateRange | undefined>(initialDate);
  const [timeDate, setTimeDate] = createSignal<DateRange>({
    from: initialDate?.from,
    to: initialDate?.to,
  });
  const [selectedPreset, setSelectedPreset] = createSignal<string | null>(
    initialPreset,
  );

  const isDefaultApplied = {
    current: !!initialPreset && !props.from && !props.to,
  };

  createEffect(() => {
    if (isDefaultApplied.current && date()) {
      props.onChange(date());
      isDefaultApplied.current = false;
    }
  });

  createEffect(() => {
    if (props.from && props.to) {
      const newDate: DateRange = {
        from: new Date(props.from),
        to: new Date(props.to),
      };
      setDate(newDate);
      setTimeDate({ from: newDate.from, to: newDate.to });
      const preset = detectPreset(newDate.from, newDate.to, props.presetType);
      setSelectedPreset(preset);
    } else if (!props.from && !props.to) {
      setDate(initialDate);
      setTimeDate({ from: initialDate?.from, to: initialDate?.to });
      setSelectedPreset(initialPreset);
    }
  });

  const handleSelect = (selectedDate: DateRange | undefined) => {
    setSelectedPreset(null);
    if (!selectedDate) {
      setDate(undefined);
      props.onChange(undefined);
      return;
    }

    const newDate = {
      from: selectedDate.from
        ? applyTimeToDate(
            timeDate().from || getDayBoundaries().from,
            selectedDate.from,
          )
        : undefined,
      to: selectedDate.to
        ? applyTimeToDate(
            timeDate().to || getDayBoundaries().to,
            selectedDate.to,
          )
        : undefined,
    };
    setDate(newDate);
    props.onChange(newDate);
  };

  const handlePresetChange = (value: string) => {
    const newRange = PRESETS[value as PresetKey]();
    newRange.from.setHours(0, 0, 0, 0);
    newRange.to.setHours(23, 59, 59, 999);

    setDate(newRange);
    setTimeDate({ from: newRange.from, to: newRange.to });
    setSelectedPreset(value);
    props.onChange(newRange);
  };

  return (
    <div class={cn('grid gap-2', props.className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            class={cn(
              'min-w-[90px] border-dashed justify-start text-left font-normal',
            )}
          >
            <CalendarIcon class="mr-2 h-4 w-4" />
            <Show
              when={selectedPreset()}
              fallback={
                <Show
                  when={date()?.from}
                  fallback={<span>{t('Pick a date range')}</span>}
                >
                  <Show
                    when={date()?.to}
                    fallback={format(date()!.from!, 'LLL dd, y, hh:mm a')}
                  >
                    <div class="flex gap-2 items-center">
                      <div>{format(date()!.from!, 'LLL dd, y, hh:mm a')}</div>
                      <div>{t('to')}</div>
                      <div>{format(date()!.to!, 'LLL dd, y, hh:mm a')}</div>
                    </div>
                  </Show>
                </Show>
              }
            >
              <span>{getPresetLabel(selectedPreset()!)}</span>
            </Show>
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-2" align="start">
          <div class="flex space-x-2 mb-2">
            <Select
              onValueChange={handlePresetChange}
              value={selectedPreset() || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder={String(t('Select preset'))} />
              </SelectTrigger>
              <SelectContent>
                <Show
                  when={props.presetType === 'past'}
                  fallback={
                    <>
                      <SelectItem value="7">{t('Next 7 days')}</SelectItem>
                      <SelectItem value="14">{t('Next 14 days')}</SelectItem>
                      <SelectItem value="30">{t('Next 30 days')}</SelectItem>
                      <SelectItem value="90">{t('Next 90 days')}</SelectItem>
                    </>
                  }
                >
                  <>
                    <SelectItem value="7days">{t('Last 7 Days')}</SelectItem>
                    <SelectItem value="14days">{t('Last 14 Days')}</SelectItem>
                    <SelectItem value="30days">{t('Last 30 Days')}</SelectItem>
                    <SelectItem value="90days">{t('Last 90 Days')}</SelectItem>
                  </>
                </Show>
              </SelectContent>
            </Select>
          </div>

          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date()?.from}
            selected={date()}
            onSelect={handleSelect}
            numberOfMonths={2}
            weekStartsOn={1}
            toDate={props.maxDate}
            fromDate={props.minDate}
          />

          <Separator class="mb-4" />

          <div class="flex gap-1.5 px-2 items-center text-sm mb-3">
            <Clock class="w-4 h-4 text-muted-foreground" />
            {t('Select Time Range')}
          </div>

          <div class="flex gap-3 items-center px-2 mb-2">
            <TimePicker
              date={timeDate().from}
              name="from"
              setDate={(fromTime) => {
                const fromWithTime = applyTimeToDate(
                  fromTime,
                  date()?.from ?? new Date(),
                );
                const updated = { from: fromWithTime, to: date()?.to };
                setDate(updated);
                setTimeDate({ ...timeDate(), from: fromTime });
                setSelectedPreset(null);
                props.onChange(updated);
              }}
            />
            {t('to')}
            <TimePicker
              date={timeDate().to}
              name="to"
              setDate={(toTime) => {
                const toWithTime = applyTimeToDate(
                  toTime,
                  date()?.to ?? date()?.from ?? new Date(),
                );
                const updated = { from: date()?.from, to: toWithTime };
                setDate(updated);
                setTimeDate({ ...timeDate(), to: toTime });
                setSelectedPreset(null);
                props.onChange(updated);
              }}
            />
          </div>

          <div class="flex justify-center mt-3">
            <Button
              variant="ghost"
              size="sm"
              class="text-primary hover:text-primary! w-full"
              onClick={() => {
                setDate(undefined);
                setTimeDate({ from: undefined, to: undefined });
                setSelectedPreset(null);
                props.onChange(undefined);
              }}
            >
              {t('Clear')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
