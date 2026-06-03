import {
  ProjectType,
  ProjectWithLimits,
  TeamProjectsLimit,
} from '@activepieces/shared';
import { useNavigate, useSearchParams } from '@solidjs/router';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import { CheckIcon, Package, Pencil, Trash } from 'lucide-solid';
import { createEffect, createMemo, createSignal, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import {
  DataTable,
  RowDataWithActions,
  BulkAction,
} from '@/components/custom/data-table';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { globalConnectionsQueries } from '@/features/connections';
import {
  CreateProjectButton,
  EditProjectDialog,
  projectCollectionUtils,
} from '@/features/projects';
import { PlatformAdminProjectAlertSubscriptionBulkActions } from '@/features/projects/components/platform-admin-project-alert-subscription-bulk-actions';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';
import { validationUtils } from '@/lib/validation-utils';

import { projectsTableColumns } from './columns';

export default function ProjectsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEnabled = platform.plan.teamProjectsLimit !== TeamProjectsLimit.NONE;
  const { project: currentProject } =
    projectCollectionUtils.useCurrentProject();

  createEffect(() => {
    if (!searchParams.has('type')) {
      setSearchParams({ type: ProjectType.TEAM }, { replace: true });
    }
  });

  const filters = createMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const displayName = params.get('displayName');
    const types = params.getAll('type');
    return {
      displayName: typeof displayName === 'string' ? displayName : undefined,
      type: Object.values(ProjectType).filter((type) => types.includes(type)),
    };
  });

  const { data: allProjects } =
    projectCollectionUtils.useAllPlatformProjects(filters);

  const [selectedRows, setSelectedRows] = createSignal<ProjectWithLimits[]>([]);
  const [editDialogOpen, setEditDialogOpen] = createSignal(false);
  const [editDialogInitialValues, setEditDialogInitialValues] = createSignal<
    { projectName?: string; externalId?: string } | undefined
  >();
  const [editDialogProjectId, setEditDialogProjectId] =
    createSignal<string>('');
  const { data: allGlobalConnectionsPage } =
    globalConnectionsQueries.useGlobalConnections({
      request: { limit: 9999 },
      extraKeys: [],
    });
  const allProjectsWithGlobalConnectionsCount = createMemo(() => {
    return allProjects.map((project) => ({
      ...project,
      globalConnectionsCount:
        allGlobalConnectionsPage?.data.filter((connection) =>
          connection.projectIds.includes(project.id),
        ).length ?? 0,
    }));
  });
  const columns = createMemo(() =>
    projectsTableColumns({
      platform,
    }),
  );

  const columnsWithCheckbox = createMemo<
    ColumnDef<
      RowDataWithActions<ProjectWithLimits & { globalConnectionsCount: number }>
    >[]
  >(() => [
    {
      id: 'select',
      accessorKey: 'select',
      size: 40,
      minSize: 40,
      maxSize: 40,
      header: (props) => {
        const selectableRows = props.table
          .getRowModel()
          .rows.filter(
            (row) =>
              row.original.id !== currentProject?.id &&
              row.original.type !== ProjectType.PERSONAL,
          );
        const allSelectableSelected =
          selectableRows.length > 0 &&
          selectableRows.every((row) => row.getIsSelected());
        const someSelectableSelected = selectableRows.some((row) =>
          row.getIsSelected(),
        );

        return (
          <Checkbox
            checked={allSelectableSelected || someSelectableSelected}
            onCheckedChange={(value) => {
              const isChecked = !!value;
              selectableRows.forEach((row) => row.toggleSelected(isChecked));

              if (isChecked) {
                const selectableProjects = selectableRows.map(
                  (row) => row.original,
                );
                const newSelectedRows = [
                  ...selectableProjects,
                  ...selectedRows(),
                ];
                const uniqueRows = Array.from(
                  new Map(
                    newSelectedRows.map((item) => [item.id, item]),
                  ).values(),
                );
                setSelectedRows(uniqueRows);
              } else {
                const filteredRows = selectedRows().filter(
                  (row) =>
                    !selectableRows.some((r) => r.original.id === row.id),
                );
                setSelectedRows(filteredRows);
              }
            }}
          />
        );
      },
      cell: (props) => {
        const isCurrentProject = props.row.original.id === currentProject?.id;
        const isPersonalProject =
          props.row.original.type === ProjectType.PERSONAL;
        const isDisabled = isCurrentProject || isPersonalProject;
        const isChecked = selectedRows().some(
          (selectedRow) => selectedRow.id === props.row.original.id,
        );

        return (
          <Tooltip>
            <TooltipTrigger>
              <div class={isDisabled ? 'cursor-not-allowed' : ''}>
                <Checkbox
                  checked={isChecked}
                  disabled={isDisabled}
                  onCheckedChange={(value) => {
                    if (isDisabled) return;

                    const isChecked = !!value;
                    let newSelectedRows = [...selectedRows()];
                    if (isChecked) {
                      const exists = newSelectedRows.some(
                        (selectedRow) =>
                          selectedRow.id === props.row.original.id,
                      );
                      if (!exists) {
                        newSelectedRows.push(props.row.original);
                      }
                    } else {
                      newSelectedRows = newSelectedRows.filter(
                        (selectedRow) =>
                          selectedRow.id !== props.row.original.id,
                      );
                    }
                    setSelectedRows(newSelectedRows);
                    props.row.toggleSelected(!!value);
                  }}
                />
              </div>
            </TooltipTrigger>
            <Show when={isDisabled}>
              <TooltipContent side="right">
                <Show
                  when={isCurrentProject}
                  fallback={t(
                    "Personal projects cannot be deleted, and you can't subscribe to their alerts",
                  )}
                >
                  {t(
                    'Cannot delete active project, switch to another project first',
                  )}
                </Show>
              </TooltipContent>
            </Show>
          </Tooltip>
        );
      },
    },
    ...columns(),
  ]);

  const bulkActions = createMemo<BulkAction<ProjectWithLimits>[]>(() => [
    {
      render: (
        _: RowDataWithActions<ProjectWithLimits>[],
        resetSelection: () => void,
      ) => (
        <PlatformAdminProjectAlertSubscriptionBulkActions
          selectedProjects={selectedRows()}
          resetSelection={() => {
            resetSelection();
            setSelectedRows([]);
          }}
        />
      ),
    },
    {
      render: (
        _: RowDataWithActions<ProjectWithLimits>[],
        resetSelection: () => void,
      ) => {
        const canDeleteAny = selectedRows().some(
          (row) =>
            row.id !== currentProject?.id && row.type !== ProjectType.PERSONAL,
        );
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <ConfirmationDeleteDialog
              title={t('Delete Projects')}
              message={String(
                t(
                  'The selected projects and all their data will be permanently deleted.',
                ),
              )}
              entityName={t('Projects')}
              buttonText={t('Delete')}
              mutationFn={() => {
                const deletableProjects = selectedRows().filter(
                  (row) =>
                    row.id !== currentProject?.id &&
                    row.type !== ProjectType.PERSONAL,
                );
                projectCollectionUtils.delete(
                  deletableProjects.map((row) => row.id),
                );
                resetSelection();
                setSelectedRows([]);
              }}
              onError={(error) => {
                toast.error(t('Error'), {
                  description: errorToastMessage(error),
                  duration: 3000,
                });
              }}
            >
              <Show when={selectedRows().length > 0}>
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-destructive hover:text-destructive"
                  disabled={!canDeleteAny}
                >
                  <Trash class="mr-1 w-4" />
                  {`${t('Delete')} (${selectedRows().length})`}
                </Button>
              </Show>
            </ConfirmationDeleteDialog>
          </div>
        );
      },
    },
  ]);

  const toolbarButtons = createMemo(() => [
    <CreateProjectButton
      key="new-project"
      variant="full"
      projects={allProjects}
    />,
  ]);

  const errorToastMessage = (error: unknown): string | undefined => {
    if (validationUtils.isValidationError(error)) {
      console.error(t('Validation error'), error);
      switch (error.response?.data.params?.message) {
        case 'PROJECT_HAS_ENABLED_FLOWS':
          return t('Project has enabled flows. Please disable them first.');
        case 'ACTIVE_PROJECT':
          return t(
            'This project is active. Please switch to another project first.',
          );
      }
      return undefined;
    }
  };

  const actions = [
    (row: ProjectWithLimits) => {
      return (
        <div class="flex items-end justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                class="size-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setEditDialogInitialValues({
                    projectName: row.displayName,
                  });
                  setEditDialogProjectId(row.id);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Edit project')}</TooltipContent>
          </Tooltip>
        </div>
      );
    },
  ];

  return (
    <LockedFeatureGuard
      featureKey="PROJECTS"
      locked={!isEnabled}
      lockTitle={t('Unlock Projects')}
      lockDescription={t(
        'Orchestrate your automation teams across projects with their own flows, connections and usage quotas',
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/projects.mp4"
    >
      <div class="flex flex-col w-full">
        <DashboardPageHeader
          title={String(t('Projects'))}
          description={String(t('Manage your automation projects'))}
        />
        <DataTable
          emptyStateTextTitle={t('No projects found')}
          emptyStateTextDescription={t(
            'Start by creating projects to manage your automation teams',
          )}
          emptyStateIcon={<Package class="size-14" />}
          onRowClick={(project) => {
            projectCollectionUtils.setCurrentProject(project.id);
            navigate('/');
          }}
          filters={[
            {
              type: 'input',
              title: t('Name'),
              accessorKey: 'displayName',
              icon: CheckIcon,
            },
            {
              type: 'select',
              title: t('Type'),
              accessorKey: 'type',
              options: Object.values(ProjectType).map((type) => {
                return {
                  label:
                    formatUtils.convertEnumToHumanReadable(type) + ' Project',
                  value: type,
                };
              }),
              icon: CheckIcon,
            },
          ]}
          columns={columnsWithCheckbox()}
          page={{
            data: allProjectsWithGlobalConnectionsCount(),
            next: null,
            previous: null,
          }}
          isLoading={false}
          clientPagination={true}
          bulkActions={bulkActions()}
          toolbarButtons={toolbarButtons()}
          actions={actions}
        />
        <EditProjectDialog
          open={editDialogOpen()}
          onClose={() => {
            setEditDialogOpen(false);
          }}
          initialValues={editDialogInitialValues()}
          projectId={editDialogProjectId()}
        />
      </div>
    </LockedFeatureGuard>
  );
}
