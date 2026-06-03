import {
  ApplicationEvent,
  ApplicationEventName,
  SeekPage,
  summarizeApplicationEvent,
  isNil,
} from '@activepieces/shared';
import { A as Link } from '@solidjs/router';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import {
  CheckIcon,
  Eye,
  Folder,
  History,
  Key,
  Link2,
  Logs,
  Users,
  Wand,
  Workflow,
  FileText,
  User,
  Clock,
} from 'lucide-solid';
import { createSignal, For, Fragment, Show } from 'solid-js';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import {
  DataTable,
  DataTableFilters,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { auditLogQueries } from '@/features/platform-admin';
import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';

export default function AuditLogsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const [selectedEvent, setSelectedEvent] =
    createSignal<ApplicationEvent | null>(null);
  const [isSheetOpen, setIsSheetOpen] = createSignal(false);
  const { data: projects } = projectCollectionUtils.useAll();
  const { data: users } = platformUserHooks.useUsers();
  const { data: auditLogsData, isLoading } = auditLogQueries.useAuditLogs();

  const userOptions = (): { label: string; value: string }[] => {
    const data: unknown = users?.data;
    if (!Array.isArray(data)) {
      return [];
    }
    return data.filter(isUserOption).map((user) => ({
      label: user.email,
      value: user.id,
    }));
  };
  const projectOptions = (): { label: string; value: string }[] =>
    projects.map((project) => ({
      label: project.displayName,
      value: project.id,
    })) ?? [];
  const auditLogs = (): SeekPage<ApplicationEvent> | undefined => auditLogsData;
  const columns: ColumnDef<RowDataWithActions<ApplicationEvent>>[] = [
    {
      accessorKey: 'action',
      size: 180,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Action')}
          icon={Wand}
        />
      ),
      cell: (props) => {
        const icon = convertToIcon(props.row.original);
        return (
          <div class="text-left flex items-center gap-2">
            <Show when={!isNil(icon?.icon)}>
              <span class="text-muted-foreground shrink-0">{icon?.icon}</span>
            </Show>
            {formatUtils.convertEnumToHumanReadable(props.row.original.action)}
          </div>
        );
      },
    },
    {
      accessorKey: 'details',
      size: 320,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Details')}
          icon={FileText}
        />
      ),
      cell: (props) => (
        <div class="text-left">{convertToDetails(props.row.original)}</div>
      ),
    },
    {
      accessorKey: 'userId',
      size: 200,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Performed By')}
          icon={User}
        />
      ),
      cell: (props) => (
        <div class="text-left">{props.row.original.userEmail}</div>
      ),
    },
    {
      accessorKey: 'projectId',
      size: 130,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Project')}
          icon={Folder}
        />
      ),
      cell: (props) => (
        <Show
          when={eventProjectName(props.row.original)}
          fallback={<div class="text-left">{t('N/A')}</div>}
        >
          {(name) => (
            <Link href={`/projects/${props.row.original.projectId}`}>
              <div class="text-left text-primary hover:underline">{name()}</div>
            </Link>
          )}
        </Show>
      ),
    },
    {
      accessorKey: 'created',
      size: 110,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Created')}
          icon={Clock}
        />
      ),
      cell: (props) => (
        <div class="text-left">
          <FormattedDate date={new Date(props.row.original.created)} />
        </div>
      ),
    },
    {
      id: 'view',
      size: 50,
      cell: (props) => (
        <Button
          variant="ghost"
          size="icon"
          class="size-8"
          onClick={() => {
            setSelectedEvent(props.row.original);
            setIsSheetOpen(true);
          }}
        >
          <Eye class="size-4 text-muted-foreground" />
        </Button>
      ),
    },
  ];

  const filters: DataTableFilters<keyof ApplicationEvent>[] = [
    {
      type: 'select',
      title: t('Action'),
      accessorKey: 'action',
      options: Object.values(ApplicationEventName).map((action) => {
        return {
          label: formatUtils.convertEnumToHumanReadable(action),
          value: action,
        };
      }),
      icon: Wand,
    },
    {
      type: 'select',
      title: t('Performed By'),
      accessorKey: 'userId',
      options: userOptions(),
      icon: Users,
    },
    {
      type: 'select',
      title: t('Project'),
      accessorKey: 'projectId',
      options: projectOptions(),
      icon: Folder,
    },
    {
      type: 'date',
      title: t('Created'),
      accessorKey: 'created',
      icon: CheckIcon,
    },
  ];

  const isEnabled = platform.plan.auditLogEnabled;
  return (
    <LockedFeatureGuard
      featureKey="AUDIT_LOGS"
      locked={!isEnabled}
      lockTitle={t('Unlock Audit Logs')}
      lockDescription={t(
        'Comply with internal and external security policies by tracking activities done within your account',
      )}
    >
      <div class="flex flex-col  w-full">
        <DashboardPageHeader
          description={String(t('Track activities done within your platform'))}
          title={String(t('Audit Logs'))}
        />
        <DataTable
          emptyStateTextTitle={t('No audit logs found')}
          emptyStateTextDescription={t(
            'Come back later when you have some activity to audit',
          )}
          emptyStateIcon={<History class="size-14" />}
          filters={filters}
          columns={columns}
          page={auditLogs()}
          isLoading={isLoading}
        />
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent class="w-[480px] sm:max-w-[480px] flex flex-col p-0">
            <SheetHeader class="px-6 py-4 border-b shrink-0">
              <SheetTitle class="text-base">
                {formatUtils.convertEnumToHumanReadable(
                  selectedEvent()?.action ?? '',
                )}
              </SheetTitle>
              <p class="text-sm text-muted-foreground mt-1">
                <Show when={selectedEvent()}>
                  {(event) => convertToDetails(event())}
                </Show>
              </p>
            </SheetHeader>
            <div class="flex-1 overflow-y-auto">
              <div class="px-6 py-5 flex flex-col gap-4">
                <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('Who & When')}
                </p>
                <div class="grid grid-cols-[150px_1fr] gap-y-3 text-sm">
                  <Show when={selectedEvent()?.userEmail}>
                    {(email) => (
                      <>
                        <span class="text-muted-foreground">
                          {t('Performed By')}
                        </span>
                        <span class="font-medium">{email()}</span>
                      </>
                    )}
                  </Show>
                  <Show when={selectedEvent()?.projectDisplayName}>
                    {(name) => (
                      <>
                        <span class="text-muted-foreground">
                          {t('Project')}
                        </span>
                        <span class="font-medium">{name()}</span>
                      </>
                    )}
                  </Show>
                  <Show when={selectedEvent()?.ip}>
                    {(ip) => (
                      <>
                        <span class="text-muted-foreground">
                          {t('IP Address')}
                        </span>
                        <span class="font-medium">{ip()}</span>
                      </>
                    )}
                  </Show>
                  <span class="text-muted-foreground">{t('Created')}</span>
                  <span class="font-medium">
                    <Show when={selectedEvent()}>
                      {(event) => (
                        <FormattedDate date={new Date(event().created)} />
                      )}
                    </Show>
                  </span>
                </div>
              </div>
              <Show
                when={
                  selectedEvent() &&
                  extractEventDetails(selectedEvent()).length > 0
                }
              >
                <>
                  <Separator />
                  <div class="px-6 py-5 flex flex-col gap-4">
                    <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t('Event Details')}
                    </p>
                    <div class="grid grid-cols-[150px_1fr] gap-y-3 text-sm">
                      <For each={extractEventDetails(selectedEvent())}>
                        {(row) => (
                          <Fragment key={row.label}>
                            <span class="text-muted-foreground">
                              {row.label}
                            </span>
                            <span class="font-medium">{row.value}</span>
                          </Fragment>
                        )}
                      </For>
                    </div>
                  </div>
                </>
              </Show>
              <Separator />
              <div class="px-6 py-5 flex flex-col gap-4">
                <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('Full Payload')}
                </p>
                <SimpleJsonViewer data={selectedEvent()?.data ?? {}} />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </LockedFeatureGuard>
  );
}

function convertToIcon(event: ApplicationEvent) {
  switch (event.action) {
    case ApplicationEventName.FLOW_RUN_FINISHED:
    case ApplicationEventName.FLOW_RUN_STARTED:
    case ApplicationEventName.FLOW_RUN_RESUMED:
    case ApplicationEventName.FLOW_RUN_RETRIED:
      return {
        icon: <Logs class="size-4" />,
        tooltip: t('Flow Run'),
      };
    case ApplicationEventName.FLOW_CREATED:
    case ApplicationEventName.FLOW_DELETED:
    case ApplicationEventName.FLOW_UPDATED:
    case ApplicationEventName.FLOW_PUBLISHED:
    case ApplicationEventName.FLOW_ACTIVATED:
    case ApplicationEventName.FLOW_DEACTIVATED:
      return {
        icon: <Workflow class="size-4" />,
        tooltip: t('Flow'),
      };
    case ApplicationEventName.FOLDER_CREATED:
    case ApplicationEventName.FOLDER_DELETED:
    case ApplicationEventName.FOLDER_UPDATED:
      return {
        icon: <Folder class="size-4" />,
        tooltip: t('Folder'),
      };
    case ApplicationEventName.CONNECTION_DELETED:
    case ApplicationEventName.CONNECTION_UPSERTED:
      return {
        icon: <Link2 class="size-4" />,
        tooltip: t('Connection'),
      };
    case ApplicationEventName.VARIABLE_UPSERTED:
    case ApplicationEventName.VARIABLE_DELETED:
    case ApplicationEventName.VARIABLE_VALUE_REVEALED:
      return {
        icon: <Link2 class="size-4" />,
        tooltip: t('Variable'),
      };
    case ApplicationEventName.USER_SIGNED_UP:
    case ApplicationEventName.USER_SIGNED_IN:
    case ApplicationEventName.USER_PASSWORD_RESET:
    case ApplicationEventName.USER_EMAIL_VERIFIED:
      return {
        icon: <Users class="size-4" />,
        tooltip: t('User'),
      };
    case ApplicationEventName.SIGNING_KEY_CREATED:
      return {
        icon: <Key class="size-4" />,
        tooltip: t('Signing Key'),
      };
    default:
      return undefined;
  }
}

function convertToDetails(event: ApplicationEvent): string {
  switch (event.action) {
    case ApplicationEventName.FLOW_RUN_STARTED:
      return `Flow run started in ${formatUtils.convertEnumToHumanReadable(
        event.data.flowRun.environment,
      )} environment`;
    case ApplicationEventName.FLOW_RUN_FINISHED:
      return `Flow run finished — ${formatUtils.convertEnumToHumanReadable(
        event.data.flowRun.status,
      )}`;
    case ApplicationEventName.FLOW_RUN_RESUMED:
      return `Flow run resumed in ${formatUtils.convertEnumToHumanReadable(
        event.data.flowRun.environment,
      )} environment`;
    case ApplicationEventName.FLOW_RUN_RETRIED:
      return `Flow run retried from failed step in ${formatUtils.convertEnumToHumanReadable(
        event.data.flowRun.environment,
      )} environment`;
    case ApplicationEventName.FLOW_CREATED:
      return t('A new flow was created');
    case ApplicationEventName.FLOW_DELETED:
      return `Flow "${event.data.flowVersion.displayName}" was deleted`;
    default:
      return summarizeApplicationEvent(event) ?? '';
  }
}

function eventProjectName(event: ApplicationEvent): string | undefined {
  if (!event.projectId || !('project' in event.data)) {
    return undefined;
  }
  return event.data.project?.displayName;
}

function isUserOption(user: unknown): user is { email: string; id: string } {
  return (
    typeof user === 'object' &&
    user !== null &&
    'email' in user &&
    typeof user.email === 'string' &&
    'id' in user &&
    typeof user.id === 'string'
  );
}

function extractEventDetails(event: ApplicationEvent): EventDetailRow[] {
  switch (event.action) {
    case ApplicationEventName.FLOW_RUN_STARTED:
    case ApplicationEventName.FLOW_RUN_FINISHED:
    case ApplicationEventName.FLOW_RUN_RESUMED:
    case ApplicationEventName.FLOW_RUN_RETRIED: {
      const { flowRun } = event.data;
      const rows: EventDetailRow[] = [
        {
          label: t('Status'),
          value: formatUtils.convertEnumToHumanReadable(flowRun.status),
        },
        {
          label: t('Environment'),
          value: formatUtils.convertEnumToHumanReadable(flowRun.environment),
        },
      ];
      if (flowRun.triggeredBy) {
        rows.push({
          label: t('Triggered By'),
          value: formatUtils.convertEnumToHumanReadable(flowRun.triggeredBy),
        });
      }
      if (flowRun.startTime) {
        rows.push({
          label: t('Start Time'),
          value: new Date(flowRun.startTime).toLocaleString(),
        });
      }
      if (flowRun.finishTime) {
        rows.push({
          label: t('Finish Time'),
          value: new Date(flowRun.finishTime).toLocaleString(),
        });
      }
      return rows;
    }
    case ApplicationEventName.FLOW_CREATED:
      return [];
    case ApplicationEventName.FLOW_DELETED:
    case ApplicationEventName.FLOW_UPDATED:
    case ApplicationEventName.FLOW_PUBLISHED:
    case ApplicationEventName.FLOW_ACTIVATED:
    case ApplicationEventName.FLOW_DEACTIVATED:
      return [{ label: t('Flow'), value: event.data.flowVersion.displayName }];
    case ApplicationEventName.CONNECTION_UPSERTED:
    case ApplicationEventName.CONNECTION_DELETED: {
      const { connection } = event.data;
      return [
        { label: t('Connection'), value: connection.displayName },
        { label: t('Piece'), value: connection.pieceName ?? t('N/A') },
        {
          label: t('Type'),
          value: formatUtils.convertEnumToHumanReadable(connection.type),
        },
        {
          label: t('Status'),
          value: formatUtils.convertEnumToHumanReadable(connection.status),
        },
      ];
    }
    case ApplicationEventName.VARIABLE_UPSERTED:
    case ApplicationEventName.VARIABLE_DELETED:
    case ApplicationEventName.VARIABLE_VALUE_REVEALED: {
      const { variable } = event.data;
      return [{ label: t('Variable'), value: variable.name }];
    }
    case ApplicationEventName.FOLDER_CREATED:
    case ApplicationEventName.FOLDER_UPDATED:
    case ApplicationEventName.FOLDER_DELETED:
      return [{ label: t('Folder'), value: event.data.folder.displayName }];
    case ApplicationEventName.USER_SIGNED_IN:
    case ApplicationEventName.USER_PASSWORD_RESET:
    case ApplicationEventName.USER_EMAIL_VERIFIED:
      return [];
    case ApplicationEventName.USER_SIGNED_UP:
      return [
        {
          label: t('Source'),
          value: formatUtils.convertEnumToHumanReadable(event.data.source),
        },
      ];
    case ApplicationEventName.SIGNING_KEY_CREATED:
      return [
        { label: t('Key Name'), value: event.data.signingKey.displayName },
      ];
    case ApplicationEventName.PROJECT_ROLE_CREATED:
    case ApplicationEventName.PROJECT_ROLE_UPDATED:
    case ApplicationEventName.PROJECT_ROLE_DELETED: {
      const { projectRole } = event.data;
      return [
        { label: t('Role'), value: projectRole.name },
        {
          label: t('Permissions'),
          value: projectRole.permissions
            .map((p) => formatUtils.convertEnumToHumanReadable(p))
            .join(', '),
        },
      ];
    }
    case ApplicationEventName.PROJECT_RELEASE_CREATED: {
      const { release } = event.data;
      const rows: EventDetailRow[] = [
        { label: t('Release'), value: release.name },
        {
          label: t('Type'),
          value: formatUtils.convertEnumToHumanReadable(release.type),
        },
      ];
      if (release.description) {
        rows.push({ label: t('Description'), value: release.description });
      }
      return rows;
    }
  }
}

type EventDetailRow = {
  label: string;
  value: string;
};
