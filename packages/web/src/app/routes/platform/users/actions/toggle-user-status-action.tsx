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

export const ToggleUserStatusAction = (props: ToggleUserStatusActionProps) => {
  if (props.row.type === 'invitation') {
    return null;
  }

  const isAdmin = props.row.data.platformRole === PlatformRole.ADMIN;
  const isActive = props.row.data.status === UserStatus.ACTIVE;

  return (
    <div class="flex items-end justify-end">
      <Tooltip>
        <TooltipTrigger>
          <Button
            disabled={props.isUpdatingStatus || isAdmin}
            variant="ghost"
            class="size-8 p-0"
            loading={props.isUpdatingStatus}
            onClick={() => {
              props.onToggleStatus(props.row.data.id, props.row.data.status);
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
