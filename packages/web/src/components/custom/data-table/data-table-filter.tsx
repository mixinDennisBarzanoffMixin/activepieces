import { useSearchParams } from '@solidjs/router';
import { Column } from '@tanstack/solid-table';
import { JSX, Match, Switch, createMemo, splitProps } from 'solid-js';

import {
  DateRange,
  DateTimePickerWithRange,
  PresetKey,
} from '@/components/custom/date-time-picker-range';

import { DataTableInputCheckbox } from './data-table-checkbox-filter';
import { DataTableInputPopover } from './data-table-input-popover';
import { DataTableSelectPopover } from './data-table-select-popover';

import { CURSOR_QUERY_PARAM } from '.';

type DropdownFilterProps = {
  type: 'select';
  options: {
    label: string;
    value: string;
    icon?: JSX.Element | string;
  }[];
};

type InputFilterProps = {
  type: 'input';
};
type DateFilterProps = {
  type: 'date';
  defaultPresetName?: PresetKey;
};
type CheckboxjhFilterProps = {
  type: 'checkbox';
};

export type DataTableFilterProps = {
  title?: string;
  icon?: JSX.Element;
} & (
  | DropdownFilterProps
  | InputFilterProps
  | DateFilterProps
  | CheckboxjhFilterProps
);

export function DataTableFilter<TData, TValue>(
  _props: DataTableFilterProps & {
    column?: Column<TData, TValue>;
    accessorKey?: string;
  },
) {
  const [local, props] = splitProps(_props, ['title', 'column', 'accessorKey']);
  const facets = createMemo(() => local.column?.getFacetedUniqueValues());
  const [searchParams, setSearchParams] = useSearchParams();
  const paramKey = createMemo(() => local.accessorKey ?? local.column?.id);

  const handleFilterChange = (
    filterValue: string | string[] | DateRange | undefined,
  ) => {
    const key = paramKey();
    if (!key) return;

    setSearchParams(
      {
        ...searchParams,
        [key]: undefined,
        [`${key}After`]: undefined,
        [`${key}Before`]: undefined,
        [CURSOR_QUERY_PARAM]: undefined,
        ...(filterValue
          ? Array.isArray(filterValue)
            ? filterValue.reduce(
                (acc, v) => ({
                  ...acc,
                  [key]: [...((acc[key] as string[] | undefined) || []), v],
                }),
                {} as Record<string, string[]>,
              )
            : typeof filterValue === 'object'
            ? {
                ...(filterValue.from
                  ? { [`${key}After`]: filterValue.from.toISOString() }
                  : {}),
                ...(filterValue.to
                  ? { [`${key}Before`]: filterValue.to.toISOString() }
                  : {}),
              }
            : { [key]: filterValue }
          : {}),
      },
      { replace: true },
    );

    if (Array.isArray(filterValue)) {
      local.column?.setFilterValue(
        filterValue.length ? filterValue : undefined,
      );
    } else if (typeof filterValue === 'object') {
      local.column?.setFilterValue(
        filterValue.from || filterValue.to ? filterValue : undefined,
      );
    } else {
      local.column?.setFilterValue(filterValue ? filterValue : undefined);
    }
  };

  return (
    <Switch>
      <Match when={props.type === 'input'}>
        <DataTableInputPopover
          title={local.title}
          filterValue={searchParams[paramKey() as string] || ''}
          handleFilterChange={handleFilterChange}
        />
      </Match>
      <Match when={props.type === 'select'}>
        {(() => {
          const key = paramKey();
          return (
            <DataTableSelectPopover
              title={local.title}
              selectedValues={new Set(searchParams[key] as string[])}
              options={props.type === 'select' ? props.options : []}
              handleFilterChange={handleFilterChange}
              facets={facets()}
            />
          );
        })()}
      </Match>
      <Match when={props.type === 'date'}>
        <DateTimePickerWithRange
          defaultSelectedRange={
            props.type === 'date' ? props.defaultPresetName : undefined
          }
          presetType="past"
          onChange={handleFilterChange}
          from={searchParams[`${paramKey()}After`] ?? undefined}
          to={searchParams[`${paramKey()}Before`] ?? undefined}
        />
      </Match>
      <Match when={props.type === 'checkbox'}>
        <DataTableInputCheckbox
          label={local.title ?? 'Archived'}
          checked={searchParams[paramKey() || 'archivedAt'] === 'true'}
          handleCheckedChange={(checked) => {
            const key = paramKey() || 'archivedAt';
            setSearchParams(
              {
                ...searchParams,
                [key]: checked ? 'true' : undefined,
                [CURSOR_QUERY_PARAM]: undefined,
              },
              { replace: true },
            );

            local.column?.setFilterValue(
              checked
                ? (row: { getValue: (id: string) => unknown }) =>
                    row.getValue('archivedAt') !== null
                : undefined,
            );
          }}
        />
      </Match>
    </Switch>
  );
}
