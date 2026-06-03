import { PlatformRole, UserStatus } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import {
  Tag,
  Fingerprint,
  Shield,
  Clock,
  Activity,
  Info,
  Mail,
  Hash,
} from 'lucide-solid';
import { Show } from 'solid-js';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { TruncatedColumnTextValue } from '@/components/custom/data-table/truncated-column-text-value';
import { FormattedDate } from '@/components/custom/formatted-date';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { UserRowData } from './index';

type ColumnDefWithAccessorKey = ColumnDef<RowDataWithActions<UserRowData>> & {
  accessorKey: string;
};

export const createUsersTableColumns = (): ColumnDefWithAccessorKey[] => [
  {
    accessorKey: 'identity',
    size: 320,
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={t('Identity')}
        icon={Fingerprint}
      />
    ),
    cell: (props) => {
      const invite = () => props.row.original.type === 'invitation';
      const external = () =>
        props.row.original.type === 'user'
          ? props.row.original.data.externalId
          : undefined;
      const email = () => props.row.original.data.email;
      const show = () => email().includes('@');

      return (
        <div class="flex items-center gap-2">
          <Show when={invite()}>
            <Tooltip>
              <TooltipTrigger>
                <Info class="h-4 w-4 text-orange-700" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('Pending Invitation')}</p>
              </TooltipContent>
            </Tooltip>
          </Show>
          <div
            class={`flex flex-col gap-0.5 ${invite() ? 'text-orange-700' : ''}`}
          >
            <Show when={show()}>
              <div class="flex items-center gap-1.5">
                <Mail class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <TruncatedColumnTextValue
                  value={email()}
                  class="max-w-[200px] 2xl:max-w-[280px]"
                />
              </div>
            </Show>
            <Show when={external()}>
              <div class="flex items-center gap-1.5">
                <Hash class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <TruncatedColumnTextValue
                  value={external()}
                  class="max-w-[200px] 2xl:max-w-[280px]"
                />
              </div>
            </Show>
            <Show when={!show() && !external()}>
              <span class="text-muted-foreground">-</span>
            </Show>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'name',
    size: 210,
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={t('Name')}
        icon={Tag}
      />
    ),
    cell: (props) => {
      const name = () =>
        props.row.original.type === 'user'
          ? props.row.original.data.firstName +
            ' ' +
            props.row.original.data.lastName
          : '';

      return (
        <Show
          when={props.row.original.type === 'user'}
          fallback={<div class="text-muted-foreground">-</div>}
        >
          <TruncatedColumnTextValue
            value={name()}
            class="max-w-[160px] 2xl:max-w-[200px]"
          />
        </Show>
      );
    },
  },
  {
    accessorKey: 'role',
    size: 90,
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={t('Role')}
        icon={Shield}
      />
    ),
    cell: (props) => {
      const role = () => props.row.original.data.platformRole;
      return (
        <div class="text-left">
          {role() === PlatformRole.ADMIN
            ? t('Admin')
            : role() === PlatformRole.OPERATOR
            ? t('Operator')
            : t('Member')}
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    size: 130,
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
          <FormattedDate date={new Date(props.row.original.data.created)} />
        </div>
      );
    },
  },
  {
    accessorKey: 'lastActiveDate',
    size: 130,
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={t('Last Active')}
        icon={Clock}
      />
    ),
    cell: (props) => {
      const date = () =>
        props.row.original.type === 'user'
          ? props.row.original.data.lastActiveDate
          : undefined;

      return (
        <Show
          when={props.row.original.type === 'user' && date()}
          fallback={<div class="text-muted-foreground">-</div>}
        >
          <div class="text-left">
            {<FormattedDate date={new Date(date())} />}
          </div>
        </Show>
      );
    },
  },
  {
    accessorKey: 'status',
    size: 100,
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={t('Status')}
        icon={Activity}
      />
    ),
    cell: (props) => {
      const active = () =>
        props.row.original.type === 'user' &&
        props.row.original.data.status === UserStatus.ACTIVE;

      return (
        <Show
          when={props.row.original.type === 'user'}
          fallback={<div class="text-left text-orange-700">{t('Pending')}</div>}
        >
          <div class="text-left">
            <Show when={active()} fallback={t('Deactivated')}>
              {t('Activated')}
            </Show>
          </div>
        </Show>
      );
    },
  },
];
