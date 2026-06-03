import { t } from 'i18next';
import { Lock } from 'lucide-solid';

import { Button } from '@/components/ui/button';

function ResourceLockWidget(props: ResourceLockWidgetProps) {
  return (
    <div class="absolute top-[12px] z-40 w-full px-2 flex justify-center">
      <div class="py-1.5 px-3.5 border min-h-11.5 border-border bg-background z-40 w-full animate animate-fade duration-300 rounded-md flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Lock class="size-5" />
          <span>
            {t(
              '{name} is editing this {resource}. Only one person can edit at a time.',
              {
                name: props.lockedBy.userDisplayName,
                resource: props.resourceLabel,
              },
            )}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={props.takeOver}>
          {t('Take Over')}
        </Button>
      </div>
    </div>
  );
}

export { ResourceLockWidget };

type ResourceLockWidgetProps = {
  lockedBy: {
    userId: string;
    userDisplayName: string;
  };
  takeOver: () => void;
  resourceLabel: string;
};
