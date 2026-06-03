import { Show } from 'solid-js';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatUtils } from '@/lib/format-utils';

type FormattedDateProps = {
  date: Date;
  includeTime?: boolean | undefined;
  className?: string;
};

export const FormattedDate = (props: FormattedDateProps) => {
  const formattedDate = formatUtils.formatDate(props.date);
  const formattedDateWithTime = formatUtils.formatDateWithTime(
    props.date,
    false,
  );
  const fullDateTimeTooltip = formatUtils.formatDateWithTime(props.date, true);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span class={props.className}>
          <Show when={props.includeTime} fallback={formattedDate}>
            {formattedDateWithTime}
          </Show>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{fullDateTimeTooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};
