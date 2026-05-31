import { useSearchParams } from '@solidjs/router';
import { Column } from '@tanstack/solid-table';

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
    icon?: any | string;
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
  icon?: any;
} & (
  | DropdownFilterProps
  | InputFilterProps
  | DateFilterProps
  | CheckboxjhFilterProps
);

export function DataTableFilter<TData, TValue>({
  title,
  column,
  accessorKey,
  ...props
}: DataTableFilterProps & {
  column?: Column<TData, TValue>;
  accessorKey?: string;
}) {
  const facets = column?.getFacetedUniqueValues();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramKey = accessorKey ?? column?.id;

  const handleFilterChange = (
    filterValue: string | string[] | DateRange | undefined,
  ) => {
    setSearchParams(
      {
        ...searchParams,
        [paramKey as string]: undefined,
        [`${paramKey}After`]: undefined,
        [`${paramKey}Before`]: undefined,
        [CURSOR_QUERY_PARAM]: undefined,
        ...(filterValue
          ? Array.isArray(filterValue)
            ? filterValue.reduce(
                (acc, v) => ({
                  ...acc,
                  [paramKey as string]: [...(acc[paramKey as string] || []), v],
                }),
                {},
              )
            : typeof filterValue === 'object' && filterValue !== null
            ? {
                ...(filterValue.from
                  ? { [`${paramKey}After`]: filterValue.from.toISOString() }
                  : {}),
                ...(filterValue.to
                  ? { [`${paramKey}Before`]: filterValue.to.toISOString() }
                  : {}),
              }
            : { [paramKey as string]: filterValue }
          : {}),
      },
      { replace: true },
    );

    if (Array.isArray(filterValue)) {
      column?.setFilterValue(filterValue.length ? filterValue : undefined);
    } else if (typeof filterValue === 'object' && filterValue !== null) {
      column?.setFilterValue(
        filterValue.from || filterValue.to ? filterValue : undefined,
      );
    } else {
      column?.setFilterValue(filterValue ? filterValue : undefined);
    }
  };

  switch (props.type) {
    case 'input': {
      const filterValue = searchParams[paramKey as string] || '';
      return (
        <DataTableInputPopover
          title={title}
          filterValue={filterValue}
          handleFilterChange={handleFilterChange}
        />
      );
    }
    case 'select': {
      const filterValue = (searchParams[paramKey as string] as string[]) || [];
      const selectedValues = new Set(filterValue);
      return (
        <DataTableSelectPopover
          title={title}
          selectedValues={selectedValues}
          options={props.options}
          handleFilterChange={handleFilterChange}
          facets={facets}
        />
      );
    }
    case 'date': {
      const from = searchParams[`${paramKey}After`];
      const to = searchParams[`${paramKey}Before`];

      return (
        <DateTimePickerWithRange
          defaultSelectedRange={props.defaultPresetName}
          presetType="past"
          onChange={handleFilterChange}
          from={from ?? undefined}
          to={to ?? undefined}
        />
      );
    }
    case 'checkbox': {
      const key = paramKey || 'archivedAt';
      const isArchived = searchParams[key] === 'true';

      const handleCheckedChange = (checked: boolean) => {
        setSearchParams(
          {
            ...searchParams,
            [key]: checked ? 'true' : undefined,
            [CURSOR_QUERY_PARAM]: undefined,
          },
          { replace: true },
        );

        column?.setFilterValue(
          checked
            ? (row: any) => row.getValue('archivedAt') !== null
            : undefined,
        );
      };

      return (
        <DataTableInputCheckbox
          label={title ?? 'Archived'}
          checked={isArchived}
          handleCheckedChange={handleCheckedChange}
        />
      );
    }
  }
}
