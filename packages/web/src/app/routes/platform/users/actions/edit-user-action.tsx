import { t } from 'i18next';
import { Pencil } from 'lucide-solid';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { UserRowData } from '../index';

import { UpdateUserDialog } from './update-user-dialog';

type EditUserActionProps = {
  row: UserRowData;
  onUpdate: () => void;
};

export const EditUserAction = (props: EditUserActionProps) => {
  if (props.row.type === 'invitation') {
    return null;
  }

  return (
    <div class="flex items-end justify-end">
      <Tooltip>
        <TooltipTrigger>
          <UpdateUserDialog
            userId={props.row.data.id}
            role={props.row.data.platformRole}
            externalId={props.row.data.externalId ?? undefined}
            onUpdate={props.onUpdate}
          >
            <Button variant="ghost" class="size-8 p-0">
              <Pencil class="size-4" />
            </Button>
          </UpdateUserDialog>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t('Edit user')}</TooltipContent>
      </Tooltip>
    </div>
  );
};
