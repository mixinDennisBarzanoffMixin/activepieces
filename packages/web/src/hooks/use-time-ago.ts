import dayjs from 'dayjs';
import { createSignal, createEffect } from 'solid-js';

import { formatUtils } from '@/lib/format-utils';

export const useTimeAgo = (date: Date) => {
  const [timeAgo, setTimeAgo] = createSignal(() =>
    formatUtils.formatDateToAgo(date),
  );

  createEffect(() => {
    const updateInterval = () => {
      const now = dayjs();
      const inputDate = dayjs(date);
      const diffInSeconds = now.diff(inputDate, 'second');

      // Update every second if less than a minute
      // Update every minute if less than an hour
      // Update every hour if less than a day
      // Update every day if more than a day
      if (diffInSeconds < 60) return 1000;
      if (diffInSeconds < 3600) return 60000;
      if (diffInSeconds < 86400) return 3600000;
      return 86400000;
    };

    const intervalId = setInterval(() => {
      setTimeAgo(formatUtils.formatDateToAgo(date));
    }, updateInterval());

    return () => clearInterval(intervalId);
  }, [date]);

  return timeAgo;
};
