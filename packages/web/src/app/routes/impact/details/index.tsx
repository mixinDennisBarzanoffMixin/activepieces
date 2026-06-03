import {
  PlatformAnalyticsReport,
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import {
  AlertCircle,
  ChevronDown,
  Clock,
  Download,
  Filter,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Workflow,
  X,
} from 'lucide-solid';
import { createMemo, For, mergeProps, Show } from 'solid-js';

import { ApAvatar } from '@/components/custom/ap-avatar';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { userHooks } from '@/hooks/user-hooks';
import { formatUtils } from '@/lib/format-utils';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { TimeSavedFilterContent } from '../components/time-saved-filter-content';
import { exportFlowDetailsCsv } from '../lib/impact-utils';
import { useDetailsFilters } from '../lib/use-details-filters';
import {
  FlowDetailRow,
  useFlowDetailsData,
} from '../lib/use-flow-details-data';

import { EditTimeSavedPopover } from './edit-time-saved-popover';

type FlowsDetailsProps = {
  report?: PlatformAnalyticsReport;
  isLoading: boolean;
  projects?: ProjectWithLimits[];
};

export function FlowsDetails(props: FlowsDetailsProps) {
  const {
    flowDetails,
    uniqueOwners,
    flowsMissingTimeSaved,
    timeSavedPerRunOverrides,
  } = useFlowDetailsData(() => props.report);

  const filters = useDetailsFilters(flowDetails, uniqueOwners);

  const columns = createMemo(
    (): ColumnDef<RowDataWithActions<FlowDetailRow>>[] => [
      {
        accessorKey: 'flowName',
        header: (props) => (
          <DataTableColumnHeader column={props.column} title={t('Flow Name')} />
        ),
        cell: (props) => (
          <div
            class={cn(
              'flex items-center gap-3 flex-wrap',
              DASHBOARD_CONTENT_PADDING_X,
            )}
          >
            <Workflow class="size-4 mr-2 text-primary shrink-0" />
            <span class="truncate">{props.row.original.flowName}</span>
          </div>
        ),
        size: 300,
      },
      {
        accessorKey: 'ownerId',
        header: (props) => (
          <DataTableColumnHeader column={props.column} title={t('Owner')} />
        ),
        cell: (props) => (
          <div class="flex items-center gap-2">
            <ApAvatar
              id={props.row.original.ownerId ?? ''}
              size="small"
              includeAvatar={true}
              includeName={false}
            />
            <OwnerFullName id={props.row.original.ownerId ?? ''} />
          </div>
        ),
      },
      {
        accessorKey: 'timeSavedPerRun',
        header: (props) => (
          <DataTableColumnHeader
            column={props.column}
            title={t('Time Saved Per Run')}
            sortable
          />
        ),
        cell: (cell) => {
          const override = timeSavedPerRunOverrides[cell.row.original.flowId];
          const timeSavedPerRun =
            override.value ?? cell.row.original.timeSavedPerRun;
          const hasValue = timeSavedPerRun && timeSavedPerRun > 0;
          const displayValue = hasValue
            ? formatUtils.formatToHoursAndMinutes(timeSavedPerRun)
            : null;

          const userHasAccessToProject = props.projects?.some(
            (project) => project.id === cell.row.original.projectId,
          );

          return (
            <Show
              when={userHasAccessToProject}
              fallback={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div class="flex items-center gap-1.5 text-muted-foreground cursor-not-allowed">
                      <Plus class="h-3.5 w-3.5" />
                      <span>{t('Add Estimated Time')}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t("You don't have permission to add")}
                  </TooltipContent>
                </Tooltip>
              }
            >
              <Show
                when={hasValue}
                fallback={
                  <EditTimeSavedPopover
                    flowId={cell.row.original.flowId}
                    currentValue={timeSavedPerRun}
                  >
                    <div class="flex items-center gap-1.5 cursor-pointer text-primary hover:underline">
                      <Plus class="h-3.5 w-3.5" />
                      <span>{t('Add Estimated Time')}</span>
                    </div>
                  </EditTimeSavedPopover>
                }
              >
                <div class="group/cell flex items-center gap-1.5">
                  <span>{displayValue}</span>
                  <span class="inline-flex opacity-0 group-hover/cell:opacity-100 transition-opacity">
                    <EditTimeSavedPopover
                      flowId={cell.row.original.flowId}
                      currentValue={timeSavedPerRun}
                    >
                      <Button variant="link" size="xs">
                        <Pencil class="size-3! mr-1" />
                        <span>{t('Edit')}</span>
                      </Button>
                    </EditTimeSavedPopover>
                  </span>
                </div>
              </Show>
            </Show>
          );
        },
      },
      {
        accessorKey: 'minutesSaved',
        header: (props) => (
          <DataTableColumnHeader
            column={props.column}
            title={t('Total Time Saved')}
            sortable
          />
        ),
        cell: (props) => (
          <div class="flex items-center gap-1.5">
            <Clock class="h-3.5 w-3.5" />
            <span>
              {formatUtils.formatToHoursAndMinutes(
                props.row.original.minutesSaved,
              )}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'projectName',
        header: (props) => (
          <DataTableColumnHeader
            column={props.column}
            title={t('Project Name')}
          />
        ),
        cell: (cell) => {
          const project = props.projects?.find(
            (p) => p.id === cell.row.original.projectId,
          );
          const userHasAccess = !!project;
          const projectName =
            project?.displayName ?? cell.row.original.projectName;

          const projectAvatar =
            project?.type === ProjectType.TEAM ? (
              <Avatar
                class="size-5 shrink-0 flex items-center justify-center rounded-[4px] text-xs font-bold"
                style={{
                  'background-color':
                    PROJECT_COLOR_PALETTE[project.icon.color].color,
                  color: PROJECT_COLOR_PALETTE[project.icon.color].textColor,
                }}
              >
                <span class="scale-75">
                  {projectName.charAt(0).toUpperCase()}
                </span>
              </Avatar>
            ) : (
              <LayoutGrid class="h-4 w-4 shrink-0" />
            );

          return (
            <div
              class={cn('flex items-center gap-1.5', {
                'text-foreground': userHasAccess,
                'text-muted-foreground': !userHasAccess,
              })}
            >
              {projectAvatar}
              {projectName}
            </div>
          );
        },
      },
    ],
  );

  return (
    <Show when={flowDetails() || props.isLoading}>
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3 flex-wrap">
          <div class="relative w-[200px]">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('Search flows')}
              value={filters.searchQuery()}
              onChange={(e) => filters.setSearchQuery(e.currentTarget.value)}
              class="pl-9 pr-8"
            />
            <Show when={filters.searchQuery()}>
              <button
                onClick={() => filters.setSearchQuery('')}
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X class="h-3.5 w-3.5" />
              </button>
            </Show>
          </div>

          <TimeSavedFilter filters={filters} />
          <OwnerFilter filters={filters} />

          <div class="flex-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportFlowDetailsCsv([...filters.filteredData()])
                }
                disabled={filters.filteredData().length === 0}
              >
                <Download class="h-4 w-4 mr-2" />
                {t('Download')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Download flows details')}</TooltipContent>
          </Tooltip>
        </div>

        <Show when={flowsMissingTimeSaved() > 0}>
          <div class="flex mx-3 items-start justify-between gap-3 p-4 rounded-lg border border-warning/50 bg-warning/10">
            <div class="flex items-start gap-3">
              <AlertCircle class="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div class="flex flex-col gap-1">
                <p class="text-sm font-medium">
                  {t(
                    'There are {count} flows missing their Estimated Time Per Run.',
                    { count: flowsMissingTimeSaved() },
                  )}
                </p>
                <p class="text-sm text-muted-foreground">
                  {t(
                    'This will cause inaccurate analytics and unreliable data.',
                  )}
                </p>
              </div>
            </div>
          </div>
        </Show>

        <DataTable
          columns={columns()}
          page={{
            data: filters.filteredData(),
            next: null,
            previous: null,
          }}
          isLoading={props.isLoading}
          clientPagination={true}
          initialSorting={[{ id: 'minutesSaved', desc: true }]}
          emptyStateTextTitle={t('No Flows Found')}
          emptyStateTextDescription={
            filters.searchQuery()
              ? t('Try adjusting your search')
              : t('Start running your flows to see time saved')
          }
          emptyStateIcon={<Workflow class="h-10 w-10 text-muted-foreground" />}
        />
      </div>
    </Show>
  );
}

type FiltersReturn = ReturnType<typeof useDetailsFilters>;

function TimeSavedFilter(props: { filters: FiltersReturn }) {
  return (
    <Popover
      open={props.filters.timeSavedPopoverOpen()}
      onOpenChange={props.filters.handleTimeSavedPopoverOpen}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" class="gap-2 font-normal border-dashed">
          <Clock class="h-4 w-4" />
          <span>{t('Total Time Saved')}</span>
          <Show when={props.filters.timeSavedLabel()}>
            <span class="rounded bg-accent px-1.5 py-0.5 text-xs font-medium">
              {props.filters.timeSavedLabel()}
            </span>
          </Show>
          <ChevronDown class="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[200px] p-4" align="start">
        <TimeSavedFilterContent
          draftMin={props.filters.draftTimeSaved().min}
          onMinChange={(v) => props.filters.updateDraftTimeSaved({ min: v })}
          unitMin={props.filters.draftTimeSaved().unitMin}
          onCycleUnitMin={props.filters.cycleDraftTimeUnitMin}
          draftMax={props.filters.draftTimeSaved().max}
          onMaxChange={(v) => props.filters.updateDraftTimeSaved({ max: v })}
          unitMax={props.filters.draftTimeSaved().unitMax}
          onCycleUnitMax={props.filters.cycleDraftTimeUnitMax}
          onApply={props.filters.applyTimeSavedFilter}
        />
      </PopoverContent>
    </Popover>
  );
}

function OwnerFilter(props: { filters: FiltersReturn }) {
  return (
    <Popover
      open={props.filters.ownerFilter().popoverOpen}
      onOpenChange={(open) =>
        props.filters.updateOwnerFilter({ popoverOpen: open })
      }
    >
      <PopoverTrigger asChild>
        <Button variant="outline" class="gap-2 font-normal border-dashed">
          <Filter class="h-4 w-4" />
          <span>{t('Owner')}</span>
          <Show when={props.filters.selectedOwners().length > 0}>
            <span class="flex items-center gap-1">
              <For each={props.filters.selectedOwners().slice(0, 2)}>
                {(owner) => (
                  <span class="flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-xs font-medium">
                    <ApAvatar id={owner.id} size="xsmall" hideHover={true} />
                    <OwnerFullName id={owner.id} maxWidth="max-w-[80px]" />
                  </span>
                )}
              </For>
              <Show when={props.filters.selectedOwners().length > 2}>
                <span class="rounded bg-accent px-1.5 py-0.5 text-xs font-medium">
                  +{props.filters.selectedOwners().length - 2}
                </span>
              </Show>
            </span>
          </Show>
          <ChevronDown class="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[240px] p-0" align="start">
        <div class="p-2 border-b">
          <div class="relative">
            <Search class="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('Search owners...')}
              value={props.filters.ownerFilter().searchQuery}
              onChange={(e) =>
                props.filters.updateOwnerFilter({
                  searchQuery: e.currentTarget.value,
                })
              }
              class="pl-8 h-8"
            />
          </div>
        </div>
        <div class="max-h-[220px] overflow-auto">
          <For each={props.filters.filteredOwners()}>
            {(owner) => (
              <div
                onClick={() => props.filters.toggleOwner(owner.id)}
                class="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-accent"
              >
                <Checkbox
                  checked={props.filters
                    .ownerFilter()
                    .selectedIds.includes(owner.id)}
                  class="pointer-events-none"
                />
                <ApAvatar id={owner.id} size="small" hideHover={true} />
                <OwnerFullName id={owner.id} />
              </div>
            )}
          </For>
          <Show when={props.filters.filteredOwners().length === 0}>
            <div class="py-6 text-center text-sm text-muted-foreground">
              {t('No owners found')}
            </div>
          </Show>
        </div>
        <Show when={props.filters.ownerFilter().selectedIds.length > 0}>
          <div class="p-2 border-t">
            <button
              onClick={() =>
                props.filters.updateOwnerFilter({ selectedIds: [] })
              }
              class="w-full text-center text-sm text-primary hover:underline"
            >
              {t('Clear all')}
            </button>
          </div>
        </Show>
      </PopoverContent>
    </Popover>
  );
}

function OwnerFullName(_props: { id: string; maxWidth?: string }) {
  const props = mergeProps({ maxWidth: 'max-w-[120px]' }, _props);
  // eslint-disable-next-line solid/reactivity
  const { data: user } = userHooks.useUserById(_props.id);
  return (
    <span class={`truncate ${props.maxWidth}`}>
      <Show when={user} fallback={props.id}>
        {(data) => `${data().firstName} ${data().lastName}`.trim()}
      </Show>
    </span>
  );
}
