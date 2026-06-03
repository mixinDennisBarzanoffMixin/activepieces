import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { cn } from '@/lib/utils';

const TruncatedColumnTextValue = (props: {
  value: string;
  className?: string;
}) => {
  return (
    <TextWithTooltip tooltipMessage={props.value}>
      <div
        class={cn(
          'text-left truncate max-w-[120px] 2xl:max-w-[250px]',
          props.className,
        )}
      >
        {props.value}
      </div>
    </TextWithTooltip>
  );
};

export { TruncatedColumnTextValue };
