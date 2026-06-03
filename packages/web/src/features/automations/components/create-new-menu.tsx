import { t } from 'i18next';
import {
  FolderPlus,
  Loader2,
  Sparkles,
  Table2,
  Upload,
  Workflow,
} from 'lucide-solid';
import { createSignal, mergeProps, type JSX, Show } from 'solid-js';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { useEmbedding } from '@/components/providers/embed-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const CreateNewMenu = (_props: CreateNewMenuProps) => {
  const props = mergeProps(
    {
      scope: 'root',
      align: 'end',
      isCreatingFlow: false,
      isCreatingTable: false,
    },
    _props,
  );
  const { embedState } = useEmbedding();
  const [isOpen, setIsOpen] = createSignal(false);

  const showFolder = () => props.scope === 'root' && !embedState.hideFolders;
  const showTemplate = () => props.scope === 'root';
  const busy = () => props.isCreatingFlow || props.isCreatingTable;

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(next) => {
        if (busy() && !next) return;
        setIsOpen(next);
        props.onOpenChange?.(next);
      }}
    >
      <DropdownMenuTrigger asChild>{props.children}</DropdownMenuTrigger>
      <DropdownMenuContent align={props.align} class="w-48">
        <PermissionNeededTooltip
          hasPermission={props.userHasPermissionToWriteFlow}
        >
          <DropdownMenuItem
            disabled={!props.userHasPermissionToWriteFlow || busy()}
            onSelect={(e: Event) => {
              e.preventDefault();
              props.onCreateFlow();
            }}
            class="cursor-pointer"
          >
            <Show
              when={props.isCreatingFlow}
              fallback={<Workflow class="h-4 w-4 mr-2" />}
            >
              <Loader2 class="h-4 w-4 mr-2 animate-spin" />
            </Show>
            {props.isCreatingFlow ? t('Creating...') : t('New Flow')}
          </DropdownMenuItem>
        </PermissionNeededTooltip>

        <Show when={showTemplate() && props.onSelectTemplate}>
          <PermissionNeededTooltip
            hasPermission={props.userHasPermissionToWriteFlow}
          >
            <DropdownMenuItem
              disabled={!props.userHasPermissionToWriteFlow || busy()}
              onSelect={() => props.onSelectTemplate()}
              class="cursor-pointer"
            >
              <Sparkles class="h-4 w-4 mr-2" />
              {t('Start from Template')}
            </DropdownMenuItem>
          </PermissionNeededTooltip>
        </Show>

        <Show when={!embedState.hideTables}>
          <PermissionNeededTooltip
            hasPermission={props.userHasPermissionToWriteTable}
          >
            <DropdownMenuItem
              disabled={!props.userHasPermissionToWriteTable || busy()}
              onSelect={(e: Event) => {
                e.preventDefault();
                props.onCreateTable();
              }}
              class="cursor-pointer"
            >
              <Show
                when={props.isCreatingTable}
                fallback={<Table2 class="h-4 w-4 mr-2" />}
              >
                <Loader2 class="h-4 w-4 mr-2 animate-spin" />
              </Show>
              {props.isCreatingTable ? t('Creating...') : t('New Table')}
            </DropdownMenuItem>
          </PermissionNeededTooltip>
        </Show>

        <Show
          when={
            props.scope === 'folder' &&
            (!embedState.hideExportAndImportFlow || !embedState.hideTables)
          }
        >
          <>
            <DropdownMenuSeparator />
            <Show when={!embedState.hideExportAndImportFlow}>
              <PermissionNeededTooltip
                hasPermission={props.userHasPermissionToWriteFlow}
              >
                <DropdownMenuItem
                  disabled={!props.userHasPermissionToWriteFlow}
                  onClick={props.onImportFlow}
                  class="cursor-pointer"
                >
                  <Upload class="h-4 w-4 mr-2" />
                  {t('Import Flow')}
                </DropdownMenuItem>
              </PermissionNeededTooltip>
            </Show>
            <Show when={!embedState.hideTables}>
              <PermissionNeededTooltip
                hasPermission={props.userHasPermissionToWriteTable}
              >
                <DropdownMenuItem
                  disabled={!props.userHasPermissionToWriteTable}
                  onClick={props.onImportTable}
                  class="cursor-pointer"
                >
                  <Upload class="h-4 w-4 mr-2" />
                  {t('Import Table')}
                </DropdownMenuItem>
              </PermissionNeededTooltip>
            </Show>
          </>
        </Show>

        <Show when={showFolder() && props.onCreateFolder}>
          <>
            <DropdownMenuSeparator />
            <PermissionNeededTooltip
              hasPermission={props.userHasPermissionToWriteFolder}
            >
              <DropdownMenuItem
                disabled={!props.userHasPermissionToWriteFolder || busy()}
                onClick={props.onCreateFolder}
                class="cursor-pointer"
              >
                <FolderPlus class="h-4 w-4 mr-2" />
                {t('New Folder')}
              </DropdownMenuItem>
            </PermissionNeededTooltip>
          </>
        </Show>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type CreateNewMenuProps = {
  children: JSX.Element;
  scope?: 'root' | 'folder';
  align?: 'start' | 'end' | 'center';
  userHasPermissionToWriteFlow: boolean;
  userHasPermissionToWriteTable: boolean;
  userHasPermissionToWriteFolder: boolean;
  isCreatingFlow?: boolean;
  isCreatingTable?: boolean;
  onCreateFlow: () => void;
  onCreateTable: () => void;
  onCreateFolder?: () => void;
  onImportFlow: () => void;
  onImportTable: () => void;
  onSelectTemplate?: () => void;
  onOpenChange?: (open: boolean) => void;
};

export type CreateInFolderKind =
  | 'flow'
  | 'table'
  | 'import-flow'
  | 'import-table';
