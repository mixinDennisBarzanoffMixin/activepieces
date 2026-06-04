import type { ServerContext } from '@activepieces/pieces-framework';
import type { VeritlyUniverRow, VeritlyUniverSheets, VeritlyUniverUpdateResult, VeritlyUniverWorkbooks } from '@activepieces/shared';
import { cell, row, type Row, type Scoped } from './types';

const timeout = 5000;

export async function workbooks(server: ServerContext) {
  console.log('[veritly-univer piece] workbooks dropdown');
  return await get<VeritlyUniverWorkbooks>(server, 'workbooks');
}

export async function sheets(server: ServerContext, props: { workbook_id: string }) {
  console.log('[veritly-univer piece] sheets dropdown', { workbookId: props.workbook_id });
  if (!props.workbook_id) throw new Error('Workbook ID is required');
  return await get<VeritlyUniverSheets>(server, `workbooks/${encodeURIComponent(props.workbook_id)}/sheets`);
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
  return await post<VeritlyUniverRow>(server, `workbooks/${encodeURIComponent(cfg.workbookId)}/sheets/${encodeURIComponent(cfg.sheetId)}/rows`, {
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
  return await post<VeritlyUniverUpdateResult>(server, `workbooks/${encodeURIComponent(cfg.workbookId)}/sheets/${encodeURIComponent(cfg.sheetId)}/cells`, {
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
  const target = url(server, path);
  console.log('[veritly-univer piece] GET', { path, url: target.toString() });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const res = await fetch(target, {
    headers: head(server),
    signal: ctrl.signal,
  }).finally(() => clearTimeout(timer));
  return await body<T>(res);
}

async function post<T>(server: ServerContext, path: string, data: unknown): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const res = await fetch(url(server, path), {
    method: 'POST',
    headers: {
      ...head(server),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    signal: ctrl.signal,
  }).finally(() => clearTimeout(timer));
  return await body<T>(res);
}

async function body<T>(res: Response): Promise<T> {
  console.log('[veritly-univer piece] response', { status: res.status, ok: res.ok, url: res.url });
  if (res.ok) return await res.json() as T;
  const text = await res.text();
  console.error('[veritly-univer piece] response error', { status: res.status, url: res.url, text });
  throw new Error(text);
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
