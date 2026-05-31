import { PlatformRole, UserStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { CircleMinus, RotateCcw } from 'lucide-solid';
import { Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { UserRowData } from '../index';

type ToggleUserStatusActionProps = {
  row: UserRowData;
  isUpdatingStatus: boolean;
  onToggleStatus: (userId: string, currentStatus: UserStatus) => void;
};

export const ToggleUserStatusAction = ({
  row,
  isUpdatingStatus,
  onToggleStatus,
}: ToggleUserStatusActionProps) => {
  if (row.type === 'invitation') {
    return null;
  }

  const isAdmin = row.data.platformRole === PlatformRole.ADMIN;
  const isActive = row.data.status === UserStatus.ACTIVE;

  return (
    <div className="flex items-end justify-end">
      <Tooltip>
        <TooltipTrigger>
          <Button
            disabled={isUpdatingStatus || isAdmin}
            variant="ghost"
            class="size-8 p-0"
            loading={isUpdatingStatus}
            onClick={() => {
              onToggleStatus(row.data.id, row.data.status);
            }}
          >
            <Show when={isActive} fallback={<RotateCcw class="size-4" />}>
              <CircleMinus class="size-4" />
            </Show>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isAdmin
            ? t('Admin cannot be deactivated')
            : isActive
            ? t('Deactivate user')
            : t('Activate user')}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
