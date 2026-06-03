import { Field, Table, PopulatedRecord, isNil } from '@activepieces/shared';
import { A as Link, useParams } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { t } from 'i18next';
import { FileX } from 'lucide-solid';
import {
  JSX,
  Match,
  Show,
  Switch,
  createContext,
  createEffect,
  createSignal,
  useContext,
} from 'solid-js';

import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { buttonVariants } from '@/components/ui/button';
import {
  TableState,
  ApTableStore,
  createApTableStore,
} from '@/features/tables/stores/store/ap-tables-client-state';
import { cn } from '@/lib/utils';

import { fieldsApi } from '../api/fields-api';
import { recordsApi } from '../api/records-api';
import { tablesApi } from '../api/tables-api';

const TableContext = createContext<ApTableStore | null>(null);

export const TableStateProviderWithTable = (props: {
  children: JSX.Element;
  table: Table;
  fields: Field[];
  records: PopulatedRecord[];
}) => {
  const [store, setStore] = createSignal<ApTableStore | null>(null);
  createEffect(() => {
    setStore(
      createApTableStore(props.table, props.fields, props.records).current,
    );
  });
  return (
    <Show when={store()}>
      {(state) => (
        <TableContext.Provider value={state()}>
          {props.children}
        </TableContext.Provider>
      )}
    </Show>
  );
};

export function ApTableStateProvider(props: { children: JSX.Element }) {
  const tableId = useParams().tableId;
  const {
    data: table,
    isLoading: isTableLoading,
    error: tableError,
  } = createQuery(() => ({
    queryKey: ['table', tableId],
    queryFn: () => {
      return tablesApi.getById(tableId!);
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  }));

  const {
    data: fields,
    isLoading: isFieldsLoading,
    error: fieldsError,
  } = createQuery(() => ({
    queryKey: ['fields', tableId],
    queryFn: () =>
      fieldsApi.list({
        tableId: tableId!,
      }),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  }));

  const {
    data: records,
    isLoading: isRecordsLoading,
    error: recordsError,
  } = createQuery(() => ({
    queryKey: ['records', tableId],
    queryFn: () =>
      recordsApi.list({
        tableId: tableId!,
        limit: 99999999,
        cursor: undefined,
      }),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  }));

  return (
    <Switch>
      <Match when={isTableLoading || isFieldsLoading || isRecordsLoading}>
        <RouteLoadingBar />
      </Match>
      <Match
        when={
          tableError ||
          fieldsError ||
          recordsError ||
          isNil(table) ||
          isNil(fields) ||
          isNil(records)
        }
      >
        <div class="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div class="rounded-full bg-muted p-4">
            <FileX class="h-10 w-10 text-muted-foreground" />
          </div>

          <div>
            <h2 class="text-lg font-semibold">{t('Table not available')}</h2>
            <p class="text-sm text-muted-foreground">
              {t(
                'We couldn’t load this table. It may have been removed or is unavailable.',
              )}
            </p>
          </div>

          <Link class={cn(buttonVariants({ variant: 'outline' }))} to="/tables">
            {t('Go to Tables')}
          </Link>
        </div>
      </Match>
      <Match when={!isNil(table) && !isNil(fields) && !isNil(records)}>
        <TableStateProviderWithTable
          table={table}
          fields={fields}
          records={records.data}
        >
          {props.children}
        </TableStateProviderWithTable>
      </Match>
    </Switch>
  );
}

export function useTableState<T>(selector: (state: TableState) => T) {
  const tableStore = useContext(TableContext);
  if (!tableStore) {
    throw new Error('Table context not found');
  }
  return tableStore(selector);
}

export function useOptionalTableStore() {
  const tableStore = useContext(TableContext);
  return tableStore ?? null;
}
