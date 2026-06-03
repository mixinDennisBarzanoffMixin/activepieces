import { t } from 'i18next';
import { Pencil, Trash } from 'lucide-solid';
import { Match, Show, Switch, useContext } from 'solid-js';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

import { FieldHeaderContext } from '../utils/utils';

import { useTableState } from './ap-table-state-provider';
import RenameFieldPopoverContent from './rename-field-popovercontent';

export enum FieldActionType {
  DELETE,
  RENAME,
}

const ApFieldActionMenuItemRenderer = (props: { action: FieldActionType }) => {
  const fieldHeaderContext = useContext(FieldHeaderContext);
  const deleteField = useTableState((state) => state.deleteField);

  return (
    <Show when={fieldHeaderContext}>
      {(ctx) => (
        <Switch>
          <Match when={props.action === FieldActionType.DELETE}>
            <ConfirmationDeleteDialog
              title={t('Delete Field')}
              message={String(
                t('This field and all its data will be permanently deleted.'),
              )}
              mutationFn={() => {
                deleteField(ctx().field.index);
              }}
              entityName={t('field')}
              buttonText={t('Delete')}
            >
              <DropdownMenuItem
                onSelect={(e: Event) => {
                  e.preventDefault();
                  ctx().setPopoverContent(null);
                  ctx().setIsPopoverOpen(false);
                }}
                class="flex items-center gap-2 text-destructive cursor-pointer"
              >
                <Trash class="h-4 w-4 text-destructive" />
                <span class="text-destructive">{t('Delete')}</span>
              </DropdownMenuItem>
            </ConfirmationDeleteDialog>
          </Match>
          <Match when={props.action === FieldActionType.RENAME}>
            <DropdownMenuItem
              onSelect={() => {
                ctx().setPopoverContent(
                  <RenameFieldPopoverContent name={ctx().field.name} />,
                );
                //this is needed because the popover is not open when the content is set
                // so we need to wait for the next frame to open it
                requestAnimationFrame(() => {
                  ctx().setIsPopoverOpen(true);
                });
              }}
              class="flex items-center gap-2 cursor-pointer"
            >
              <Pencil class="h-4 w-4 " />
              <span>{t('Rename')}</span>
            </DropdownMenuItem>
          </Match>
        </Switch>
      )}
    </Show>
  );
};

export default ApFieldActionMenuItemRenderer;
