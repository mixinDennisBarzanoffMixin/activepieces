'use client';

import { t } from 'i18next';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { Period, display12HourValue, setDateByType } from './time-picker-utils';

export interface PeriodSelectorProps {
  period: Period;
  setPeriod: (m: Period) => void;
  date: Date | undefined;
  setDate: (date: Date) => void;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
  isActive: boolean;
}

export const TimePeriodSelect = (
  props: PeriodSelectorProps & { ref?: HTMLButtonElement },
) => {
  let ref: HTMLButtonElement | undefined;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') props.onRightFocus?.();
    if (e.key === 'ArrowLeft') props.onLeftFocus?.();
  };
  const handleValueChange = (value: Period) => {
    props.setPeriod(value);

    /**
     * trigger an update whenever the user switches between AM and PM;
     * otherwise user must manually change the hour each time
     */
    if (props.date) {
      const tempDate = new Date(props.date);
      const hours = display12HourValue(props.date.getHours());
      props.setDate(
        setDateByType(
          tempDate,
          hours.toString(),
          '12hours',
          props.period === 'AM' ? 'PM' : 'AM',
        ),
      );
    }
  };
  return (
    <div className="flex h-10 items-center">
      <Select
        value={props.period}
        onValueChange={(value: Period) => handleValueChange(value)}
      >
        <SelectTrigger
          ref={(el) => (ref = el)}
          class={cn(
            ' hover:bg-accent w-[73px] h-[29px] focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1  rounded-xs justify-center p-0 transition-all border-none text-sm shadow-none gap-3 ',
            {
              'bg-background': props.isActive,
            },
          )}
          onKeyDown={handleKeyDown}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">{t('AM')}</SelectItem>
          <SelectItem value="PM">{t('PM')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
