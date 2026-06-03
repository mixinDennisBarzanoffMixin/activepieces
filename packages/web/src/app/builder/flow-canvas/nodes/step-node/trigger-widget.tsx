import { t } from 'i18next';
import { Goal } from 'lucide-solid';

import { cn } from '@/lib/utils';

const TriggerWidget = (props: { isSelected: boolean }) => {
  return (
    <div
      class={cn(
        'flex items-center absolute transition-all  -translate-y-[26px] -translate-x-[1px]  border-border border border-1   justify-center gap-1 rounded-t-md bg-background text-muted-foreground text-xs py-1 px-2 z-10 ',
        {
          'border-primary text-primary ': props.isSelected,
          'group-hover:border-ring ': !props.isSelected,
        },
      )}
    >
      <Goal class="w-[10px] h-[10px]" /> {t('Trigger')}
    </div>
  );
};

export { TriggerWidget };
