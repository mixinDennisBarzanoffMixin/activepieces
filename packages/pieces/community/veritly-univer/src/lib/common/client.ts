import type { ServerContext } from '@activepieces/pieces-framework';
import { cell, row, type Row, type Scoped } from './types';

type Book = {
  id: string;
  name: string;
};

type Sheet = {
  id: string;
  name: string;
};

export async function workbooks(server: ServerContext) {
  return await get<{ workbooks: Book[] }>(server, 'workbooks');
}

export async function sheets(server: ServerContext, props: { workbook_id: string }) {
  if (!props.workbook_id) throw new Error('Workbook ID is required');
  return await get<{ sheets: Sheet[] }>(server, `workbooks/${encodeURIComponent(props.workbook_id)}/sheets`);
}

export async function rows(server: ServerContext, props: Scoped) {
  return await get<{ rows: Row[] }>(server, `workbooks/${encodeURIComponent(ref(props).workbookId)}/sheets/${encodeURIComponent(ref(props).sheetId)}/rows`);
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
  return await post<Row>(server, `workbooks/${encodeURIComponent(cfg.workbookId)}/sheets/${encodeURIComponent(cfg.sheetId)}/rows`, {
    values: row(props.values),
  });
}

export async function update(server: ServerContext, props: Scoped & { row_index?: number; column_index?: number; value: unknown }) {
  if (!Number.isFinite(props.row_index)) throw new Error('Row index is required');
  if (!Number.isFinite(props.column_index)) throw new Error('Column index is required');
  const r = props.row_index;
  const c = props.column_index;
  if (typeof r !== 'number') throw new Error('Row index is required');
  if (typeof c !== 'number') throw new Error('Column index is required');
  const cfg = ref(props);
  return await post(server, `workbooks/${encodeURIComponent(cfg.workbookId)}/sheets/${encodeURIComponent(cfg.sheetId)}/cells`, {
    rowIndex: r,
    columnIndex: c,
    value: cell(props.value),
  });
}

function ref(props: Scoped) {
  if (!props.workbook_id) throw new Error('Workbook ID is required');
  if (!props.sheet_id) throw new Error('Sheet ID is required');
  return {
    workbookId: props.workbook_id,
    sheetId: props.sheet_id,
  };
}

async function get<T>(server: ServerContext, path: string): Promise<T> {
  const res = await fetch(url(server, path), {
    headers: head(server),
  });
  return await body<T>(res);
}

async function post<T>(server: ServerContext, path: string, data: unknown): Promise<T> {
  const res = await fetch(url(server, path), {
    method: 'POST',
    headers: {
      ...head(server),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return await body<T>(res);
}

async function body<T>(res: Response): Promise<T> {
  if (res.ok) return await res.json() as T;
  throw new Error(await res.text());
}

function head(server: ServerContext) {
  return {
    Authorization: `Bearer ${server.token}`,
  };
}

function url(server: ServerContext, path: string) {
  const root = server.apiUrl.endsWith('/') ? server.apiUrl : `${server.apiUrl}/`;
  return new URL(`v1/veritly/worker/univer/${path}`, root);
}
