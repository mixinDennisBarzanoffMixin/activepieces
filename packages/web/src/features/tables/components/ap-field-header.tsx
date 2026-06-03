import { Permission } from '@activepieces/shared';
import { ChevronDown } from 'lucide-solid';
import { For, Show, createSignal, JSX } from 'solid-js';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { cn } from '@/lib/utils';

import { ClientField } from '../stores/store/ap-tables-client-state';
import { FieldHeaderContext, tablesUtils } from '../utils/utils';

import { useTableState } from './ap-table-state-provider';
import ApFieldActionMenuItemRenderer, {
  FieldActionType,
} from './field-action-menu-item-renderer';

type ApFieldHeaderProps = {
  field: ClientField & { index: number };
};

export function ApFieldHeader(props: ApFieldHeaderProps) {
  const [isPopoverOpen, setIsPopoverOpen] = createSignal(false);
  const [popoverContent, setPopoverContent] = createSignal<
    JSX.Element | string | number | null | undefined
  >(null);
  const lockedByOtherUser = useTableState((state) => state.lockedByOtherUser);
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const canEdit = userHasTableWritePermission && !lockedByOtherUser;
  const actions = canEdit
    ? [FieldActionType.RENAME, FieldActionType.DELETE]
    : [];

  return (
    <FieldHeaderContext.Provider
      value={{
        setIsPopoverOpen,
        setPopoverContent,
        get field() {
          return props.field;
        },
        userHasTableWritePermission: canEdit,
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            class={cn(
              'h-full w-full flex items-center justify-between gap-2 py-2.5 px-3 bg-muted/50  font-normal',
              'hover:bg-muted cursor-pointer',
              'data-[state=open]:bg-muted',
            )}
          >
            <div class="flex items-center gap-2">
              {tablesUtils.getColumnIcon(props.field.type)}
              <span class="text-sm">{props.field.name}</span>
            </div>
            <Show when={actions.length > 0}>
              <ChevronDown class="h-4 w-4" />
            </Show>
          </div>
        </DropdownMenuTrigger>
        <Show when={actions.length > 0}>
          <DropdownMenuContent
            noAnimationOnOut={true}
            onCloseAutoFocus={(e: Event) => {
              e.preventDefault();
            }}
            align="start"
            class="w-56 rounded-sm"
          >
            <For each={actions}>
              {(action) => (
                <div>
                  <ApFieldActionMenuItemRenderer action={action} />
                </div>
              )}
            </For>
          </DropdownMenuContent>
        </Show>
      </DropdownMenu>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <div class="w-full h-full -mt-[40px] pointer-events-none" />
        </PopoverTrigger>
        <PopoverContent align="start" class="p-3">
          {popoverContent()}
        </PopoverContent>
      </Popover>
    </FieldHeaderContext.Provider>
  );
}
