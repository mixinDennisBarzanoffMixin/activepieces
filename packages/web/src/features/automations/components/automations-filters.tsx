import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  AppConnectionWithoutSensitiveData,
  FlowStatus,
  FolderDto,
} from '@activepieces/shared';
import { useNavigate } from '@solidjs/router';
import { t } from 'i18next';
import {
  Filter,
  FolderIcon,
  Link2,
  Search,
  Table2,
  ToggleLeft,
  User,
  Workflow,
  X,
} from 'lucide-solid';
import { createMemo, createSignal, mergeProps, Show } from 'solid-js';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { DownloadIcon } from '@/components/icons/download';
import { PlusIcon } from '@/components/icons/plus';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useOwnerOptions } from '@/features/automations/hooks/use-owner-options';
import { TemplatesBrowseDialog } from '@/features/templates';
import { formatUtils } from '@/lib/format-utils';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { CreateNewMenu } from './create-new-menu';
import { MultiSelectFilter } from './multi-select-filter';

type AutomationsFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: string[];
  onTypeFilterChange: (value: string[]) => void;
  statusFilter: string[];
  onStatusFilterChange: (value: string[]) => void;
  connectionFilter: string[];
  onConnectionFilterChange: (value: string[]) => void;
  ownerFilter: string[];
  onOwnerFilterChange: (value: string[]) => void;
  folderFilter: string[];
  onFolderFilterChange: (value: string[]) => void;
  onFilterChange?: () => void;
  folders: FolderDto[];
  connections: AppConnectionWithoutSensitiveData[] | undefined;
  pieces: PieceMetadataModelSummary[] | undefined;
  userHasPermissionToWriteFlow: boolean;
  userHasPermissionToWriteTable: boolean;
  userHasPermissionToWriteFolder: boolean;
  onCreateFlow: () => void;
  onCreateTable: () => void;
  onCreateFolder: () => void;
  onImportFlow: () => void;
  onImportTable: () => void;
  onClearAllFilters: () => void;
  hasActiveFilters: boolean;
  isCreatingFlow?: boolean;
  isCreatingTable?: boolean;
};

export const AutomationsFilters = (_props: AutomationsFiltersProps) => {
  const props = mergeProps(
    { isCreatingFlow: false, isCreatingTable: false },
    _props,
  );
  const navigate = useNavigate();
  const { embedState } = useEmbedding();
  const ownerOptions = useOwnerOptions();
  const [isTemplatesBrowseDialogOpen, setIsTemplatesBrowseDialogOpen] =
    createSignal(false);
  const typeOptions = [
    { value: 'flow', label: t('Flows') },
    ...(embedState.hideTables ? [] : [{ value: 'table', label: t('Tables') }]),
  ];

  const statusOptions = Object.values(FlowStatus).map((status) => ({
    value: status,
    label: formatUtils.convertEnumToHumanReadable(status),
  }));

  const folderOptions = createMemo(() =>
    props.folders.map((folder) => ({
      value: folder.id,
      label: folder.displayName,
    })),
  );

  const connectionOptions = createMemo(() =>
    (props.connections || []).map((connection) => {
      const pieceIcon = props.pieces?.find(
        (p) => p.name === connection.pieceName,
      )?.logoUrl;
      return {
        value: connection.externalId,
        label: connection.displayName,
        icon: pieceIcon ? (
          <img src={pieceIcon} alt="" class="h-4 w-4 object-contain" />
        ) : undefined,
      };
    }),
  );

  return (
    <>
      <div class={cn('overflow-x-auto mt-4 mb-4', DASHBOARD_CONTENT_PADDING_X)}>
        <div class="flex items-center justify-between gap-4 min-w-max">
          <div class="flex items-center gap-2">
            <div class="relative">
              <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  embedState.hideTables
                    ? t('Search flows...')
                    : t('Search flows and tables...')
                }
                value={props.searchTerm}
                onInput={(e) => {
                  props.onSearchChange(e.currentTarget.value);
                  props.onFilterChange?.();
                }}
                class="min-w-[300px] max-w-xs pl-8 pr-8 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Show when={props.searchTerm}>
                <button
                  onClick={() => {
                    props.onSearchChange('');
                    props.onFilterChange?.();
                  }}
                  class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X class="h-3 w-3" />
                </button>
              </Show>
            </div>

            <MultiSelectFilter
              label={t('Type')}
              icon={<Filter class="h-4 w-4" />}
              options={typeOptions}
              selectedValues={props.typeFilter}
              onInput={(values) => {
                props.onTypeFilterChange(values);
                props.onFilterChange?.();
              }}
            />

            <MultiSelectFilter
              label={t('Status')}
              icon={<ToggleLeft class="h-4 w-4" />}
              options={statusOptions}
              selectedValues={props.statusFilter}
              onInput={(values) => {
                props.onStatusFilterChange(values);
                props.onFilterChange?.();
              }}
            />

            <MultiSelectFilter
              label={t('Connections')}
              icon={<Link2 class="h-4 w-4" />}
              options={connectionOptions()}
              selectedValues={props.connectionFilter}
              onInput={(values) => {
                props.onConnectionFilterChange(values);
                props.onFilterChange?.();
              }}
              searchable
            />

            <Show when={!embedState.isEmbedded}>
              <MultiSelectFilter
                label={t('Owner')}
                icon={<User class="h-4 w-4" />}
                options={ownerOptions()}
                selectedValues={props.ownerFilter}
                onInput={(values) => {
                  props.onOwnerFilterChange(values);
                  props.onFilterChange?.();
                }}
                searchable
              />
            </Show>

            <Show when={folderOptions().length > 0}>
              <MultiSelectFilter
                label={t('Folder')}
                icon={<FolderIcon class="h-4 w-4" />}
                options={folderOptions()}
                selectedValues={props.folderFilter}
                onInput={(values) => {
                  props.onFolderFilterChange(values);
                  props.onFilterChange?.();
                }}
                searchable
              />
            </Show>

            <Show when={props.hasActiveFilters}>
              <Button
                variant="link"
                size="sm"
                class="h-9 text-sm gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  props.onClearAllFilters();
                  props.onFilterChange?.();
                }}
              >
                <X class="h-3.5 w-3.5" />
                {t('Clear all')}
              </Button>
            </Show>
          </div>

          <div class="flex items-center gap-2">
            <Show when={!embedState.hideExportAndImportFlow}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <AnimatedIconButton
                    icon={DownloadIcon}
                    iconSize={16}
                    variant="outline"
                    size="sm"
                    class="h-9"
                  >
                    {t('Import')}
                  </AnimatedIconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-48">
                  <PermissionNeededTooltip
                    hasPermission={props.userHasPermissionToWriteFlow}
                  >
                    <DropdownMenuItem
                      disabled={!props.userHasPermissionToWriteFlow}
                      onClick={props.onImportFlow}
                      class="cursor-pointer"
                    >
                      <Workflow class="h-4 w-4 mr-2" />
                      {t('Import Flow')}
                    </DropdownMenuItem>
                  </PermissionNeededTooltip>
                  <Show when={!embedState.hideTables}>
                    <PermissionNeededTooltip
                      hasPermission={props.userHasPermissionToWriteTable}
                    >
                      <DropdownMenuItem
                        disabled={!props.userHasPermissionToWriteTable}
                        onClick={props.onImportTable}
                        class="cursor-pointer"
                      >
                        <Table2 class="h-4 w-4 mr-2" />
                        {t('Import Table')}
                      </DropdownMenuItem>
                    </PermissionNeededTooltip>
                  </Show>
                </DropdownMenuContent>
              </DropdownMenu>
            </Show>

            <CreateNewMenu
              scope="root"
              align="end"
              userHasPermissionToWriteFlow={props.userHasPermissionToWriteFlow}
              userHasPermissionToWriteTable={
                props.userHasPermissionToWriteTable
              }
              userHasPermissionToWriteFolder={
                props.userHasPermissionToWriteFolder
              }
              isCreatingFlow={props.isCreatingFlow}
              isCreatingTable={props.isCreatingTable}
              onCreateFlow={props.onCreateFlow}
              onCreateTable={props.onCreateTable}
              onCreateFolder={props.onCreateFolder}
              onImportFlow={props.onImportFlow}
              onImportTable={props.onImportTable}
              onSelectTemplate={() => {
                if (embedState.isEmbedded) {
                  setIsTemplatesBrowseDialogOpen(true);
                } else {
                  navigate('/templates');
                }
              }}
            >
              <AnimatedIconButton
                icon={PlusIcon}
                iconSize={16}
                size="sm"
                class="h-9"
              >
                {t('Create New')}
              </AnimatedIconButton>
            </CreateNewMenu>
          </div>
        </div>
      </div>
      <TemplatesBrowseDialog
        open={isTemplatesBrowseDialogOpen}
        onOpenChange={setIsTemplatesBrowseDialogOpen}
      />
    </>
  );
};
