import { Template, TemplateType } from '@activepieces/shared';
import { createQuery } from '@tanstack/solid-query';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import { FileText, Pencil, Trash, Tag, Clock, Puzzle } from 'lucide-solid';
import { createSignal, createMemo, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import {
  DataTable,
  RowDataWithActions,
  BulkAction,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { FormattedDate } from '@/components/custom/formatted-date';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIconList } from '@/features/pieces';
import { templatesApi, templatesMutations } from '@/features/templates';
import { platformHooks } from '@/hooks/platform-hooks';

import { CreateTemplateDialog } from './create-template-dialog';
import { UpdateTemplateDialog } from './update-template-dialog';

const PlatformTemplatesPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const { data, isLoading, refetch } = createQuery(() => ({
    queryKey: ['templates'],
    staleTime: 0,
    meta: { showErrorDialog: true, loadSubsetOptions: {} },
    queryFn: () => {
      return templatesApi.list({
        type: TemplateType.CUSTOM,
      });
    },
  }));

  const [selectedRows, setSelectedRows] = createSignal<Template[]>([]);

  const bulkDeleteMutation = templatesMutations.useBulkDeleteTemplates({
    onSuccess: () => {
      void refetch();
      toast.success(t('Templates deleted successfully'), {
        duration: 3000,
      });
    },
  });

  const columnsWithCheckbox: ColumnDef<RowDataWithActions<Template>>[] = [
    {
      id: 'select',
      accessorKey: 'select',
      size: 40,
      minSize: 40,
      maxSize: 40,
      header: (props) => (
        <Checkbox
          checked={
            props.table.getRowModel().rows.length > 0 &&
            props.table.getRowModel().rows.every((row) => row.getIsSelected())
          }
          onCheckedChange={(value) => {
            props.table.toggleAllRowsSelected(!!value);
            const allRows = props.table
              .getRowModel()
              .rows.map((row) => row.original);
            setSelectedRows(value ? allRows : []);
          }}
        />
      ),
      cell: (props) => {
        const isChecked = selectedRows().some(
          (selectedRow) => selectedRow.id === props.row.original.id,
        );

        return (
          <Checkbox
            checked={isChecked}
            onCheckedChange={(value) => {
              if (value) {
                const exists = selectedRows().some(
                  (selectedRow) => selectedRow.id === props.row.original.id,
                );
                if (!exists) {
                  setSelectedRows([...selectedRows(), props.row.original]);
                }
                props.row.toggleSelected(true);
                return;
              }

              setSelectedRows(
                selectedRows().filter(
                  (selectedRow) => selectedRow.id !== props.row.original.id,
                ),
              );
              props.row.toggleSelected(false);
            }}
          />
        );
      },
    },
    {
      accessorKey: 'name',
      size: 200,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Name')}
          icon={Tag}
        />
      ),
      cell: (props) => {
        return <div class="text-left">{props.row.original.name}</div>;
      },
    },
    {
      accessorKey: 'createdAt',
      size: 150,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Created')}
          icon={Clock}
        />
      ),
      cell: (props) => {
        return (
          <div class="text-left">
            <FormattedDate date={new Date(props.row.original.created)} />
          </div>
        );
      },
    },
    {
      accessorKey: 'pieces',
      size: 100,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Pieces')}
          icon={Puzzle}
        />
      ),
      cell: (props) => {
        const trigger = props.row.original.flows?.[0]?.trigger;
        if (!trigger) return null;
        return <PieceIconList trigger={trigger} maxNumberOfIconsToShow={2} />;
      },
    },
  ];

  const bulkActions: BulkAction<Template>[] = createMemo(() => [
    {
      render: (
        _selectedRows: RowDataWithActions<Template>[],
        resetSelection: () => void,
      ) => (
        <div onClick={(e) => e.stopPropagation()}>
          <ConfirmationDeleteDialog
            title={t('Delete Templates')}
            message={String(
              t('Are you sure you want to delete the selected templates?'),
            )}
            entityName={t('Templates')}
            mutationFn={async () => {
              await bulkDeleteMutation.mutateAsync(
                selectedRows().map((row) => row.id),
              );
              resetSelection();
              setSelectedRows([]);
            }}
          >
            <Show when={selectedRows().length > 0}>
              <Button
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive"
              >
                <Trash class="mr-1 w-4" />
                {`${t('Delete')} (${selectedRows().length})`}
              </Button>
            </Show>
          </ConfirmationDeleteDialog>
        </div>
      ),
    },
  ]);

  const toolbarButtons = createMemo(() => [
    <CreateTemplateDialog
      key="new-template"
      onDone={() => {
        void refetch();
      }}
    >
      <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm">
        {t('New Template')}
      </AnimatedIconButton>
    </CreateTemplateDialog>,
  ]);

  const isEnabled = platform.plan.manageTemplatesEnabled;
  return (
    <LockedFeatureGuard
      featureKey="TEMPLATES"
      locked={!isEnabled}
      lockTitle={t('Unlock Templates')}
      lockDescription={String(
        t(
          'Convert the most common automations into reusable templates 1 click away from your users',
        ),
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/templates.mp4"
    >
      <div class="flex flex-col w-full">
        <DashboardPageHeader
          description={String(
            t('Convert the most common automations into reusable templates'),
          )}
          title={String(t('Templates'))}
        />
        <DataTable
          emptyStateTextTitle={t('No templates found')}
          emptyStateTextDescription={t(
            'Create a template for your user to inspire them',
          )}
          emptyStateIcon={<FileText class="size-14" />}
          columns={columnsWithCheckbox}
          page={data}
          hidePagination={true}
          isLoading={isLoading}
          bulkActions={bulkActions}
          toolbarButtons={toolbarButtons}
          actions={[
            (row) => {
              return (
                <div class="flex items-end justify-end">
                  <Tooltip>
                    <TooltipTrigger>
                      <UpdateTemplateDialog
                        onDone={() => {
                          void refetch();
                        }}
                        template={row}
                      >
                        <Button variant="ghost" class="size-8 p-0">
                          <Pencil class="size-4" />
                        </Button>
                      </UpdateTemplateDialog>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t('Edit template')}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            },
          ]}
        />
      </div>
    </LockedFeatureGuard>
  );
};

export { PlatformTemplatesPage };
