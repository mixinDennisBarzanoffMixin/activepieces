import type { ServerContext } from '@activepieces/pieces-framework';
import { cell, createUniverClient, ref, row, type Scoped } from './types';

export async function workbooks(server: ServerContext) {
  return await client(server).workbooks();
}

export async function sheets(server: ServerContext, props: { workbook_id: string }) {
  if (!props.workbook_id) throw new Error('Workbook ID is required');
  return await client(server).sheets(props.workbook_id);
}

export async function rows(server: ServerContext, props: Scoped) {
  return await client(server).rows(ref(props));
}

export async function find(server: ServerContext, props: Scoped & { query?: string }) {
  if (!props.query) throw new Error('Query is required');
  const q = props.query.toLowerCase();
  return {
    rows: (await rows(server, props)).rows.filter((item) =>
      item.values.some((value) => String(value).toLowerCase().includes(q))
    ),
  };
}

export async function append(server: ServerContext, props: Scoped & { values: unknown }) {
  const cfg = ref(props);
  return await client(server).append(cfg, row(props.values));
}

export async function update(server: ServerContext, props: Scoped & { row_index?: number; column_index?: number; value: unknown }) {
  if (!Number.isFinite(props.row_index)) throw new Error('Row index is required');
  if (!Number.isFinite(props.column_index)) throw new Error('Column index is required');
  const r = props.row_index;
  const c = props.column_index;
  if (typeof r !== 'number') throw new Error('Row index is required');
  if (typeof c !== 'number') throw new Error('Column index is required');
  const cfg = ref(props);
  return await client(server).update(cfg, {
    rowIndex: r,
    columnIndex: c,
    value: cell(props.value),
  });
}

function client(server: ServerContext) {
  return createUniverClient({
    baseUrl: server.apiUrl,
    token: server.token,
  });
}
