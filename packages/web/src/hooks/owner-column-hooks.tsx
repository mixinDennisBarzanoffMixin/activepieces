import {
  AppConnectionOwners,
  UserWithMetaInformation,
  validateIndexBound,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import { User } from 'lucide-solid';
import { Show } from 'solid-js';

import {
  DataTableFilters,
  DataWithId,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { useEmbedding } from '@/components/providers/embed-provider';

import { ApAvatar } from '../components/custom/ap-avatar';

function useOwnerColumn<T extends HasOwner | HasOwnerId>(
  columns: ColumnDef<RowDataWithActions<T>, unknown>[],
  index: number,
): ColumnDef<RowDataWithActions<T>, unknown>[] {
  const {
    embedState: { isEmbedded },
  } = useEmbedding();
  if (isEmbedded) {
    return columns;
  }

  const ownerColumn: ColumnDef<RowDataWithActions<T>, unknown> = {
    accessorKey: 'owner',
    size: 180,
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={t('Owner')}
        icon={User}
      />
    ),
    cell: (props) => <OwnerColumn ownerId={owner(props.row.original)} />,
  };
  const safeIndex = validateIndexBound({ index, limit: columns.length });
  return [
    ...columns.slice(0, safeIndex),
    ownerColumn,
    ...columns.slice(safeIndex),
  ];
}

function useOwnerColumnFilter<
  T extends { owner?: UserWithMetaInformation | null | undefined },
>(
  filters: DataTableFilters<keyof T & string>[],
  index: number,
  owners: AppConnectionOwners[] | undefined,
): DataTableFilters<keyof T & string>[] {
  const {
    embedState: { isEmbedded },
  } = useEmbedding();
  if (isEmbedded) {
    return filters;
  }

  const opts = owners
    ? owners.map((owner) => ({
        label: `${owner.firstName} ${owner.lastName} (${owner.email})`,
        value: owner.email,
      }))
    : [];
  const ownerColumnFilter: DataTableFilters<keyof T & string> = {
    type: 'select',
    title: t('Owner'),
    accessorKey: 'owner',
    icon: <User />,
    options: opts,
  };
  const safeIndex = validateIndexBound({ index, limit: filters.length });
  return [
    ...filters.slice(0, safeIndex),
    ownerColumnFilter,
    ...filters.slice(safeIndex),
  ];
}

export const ownerColumnHooks = {
  useOwnerColumn,
  useOwnerColumnFilter,
};

type HasOwner = {
  owner?: UserWithMetaInformation | null | undefined;
} & DataWithId;
type HasOwnerId = { ownerId?: string | null | undefined } & DataWithId;

function owner(row: HasOwner | HasOwnerId) {
  if ('ownerId' in row) {
    return row.ownerId;
  }
  if ('owner' in row) {
    return row.owner?.id;
  }
  return undefined;
}

const OwnerColumn = (props: { ownerId: string | null | undefined }) => {
  return (
    <div class="text-left">
      <Show when={props.ownerId} fallback={<div class="text-left">-</div>}>
        {(id) => (
          <ApAvatar
            id={id()}
            includeAvatar={true}
            includeName={true}
            size="small"
          />
        )}
      </Show>
    </div>
  );
};
