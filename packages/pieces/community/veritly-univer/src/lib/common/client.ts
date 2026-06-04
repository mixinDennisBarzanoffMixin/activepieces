import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type * as Compat from '@opencode-ai/univer-compat';
import { cell, ref, row, type Props, type Row } from './types';

let mod: Promise<typeof Compat> | undefined;
let store: Compat.Store | undefined;

async function compat() {
  if (!mod) {
    mod = import(
      pathToFileURL(path.resolve(__dirname, '../../../../../../../../../univer-compat/src/index.ts')).href
    ) as Promise<typeof Compat>;
  }
  return await mod;
}

function persist() {
  const raw = process.env['UNIVER_COMPAT_PERSIST_EVERY_REV']?.trim();
  if (!raw) throw new Error('UNIVER_COMPAT_PERSIST_EVERY_REV is required');
  const step = Number.parseInt(raw, 10);
  if (!Number.isFinite(step) || step < 1) throw new Error('UNIVER_COMPAT_PERSIST_EVERY_REV must be >= 1');
  return step;
}

async function db() {
  const api = await compat();
  if (!store) store = new api.Store(api.exchangeFilesFromEnv(), persist());
  return store;
}

function out(item: Compat.Row): Row {
  return {
    id: String(item.index),
    index: item.index,
    values: item.values,
    updatedAt: new Date().toISOString(),
    hash: item.hash,
  };
}

async function scope<T>(props: Props, fn: () => Promise<T>) {
  const api = await compat();
  const cfg = ref(props);
  return api.runWithRequestUserAsync(cfg.userId, () => api.runWithRequestProjectAsync(cfg.projectId, fn));
}

export async function rows(props: Props) {
  const api = await compat();
  const cfg = ref(props);
  return scope(props, async () => ({
    rows: (await api.readUnitRows(await db(), cfg.workbookId, { sheet: cfg.sheetId })).map(out),
  }));
}

export async function find(props: Props & { query: string }) {
  if (!props.query) throw new Error('Query is required');
  const q = props.query.toLowerCase();
  return {
    rows: (await rows(props)).rows.filter((item) =>
      item.values.some((value) => String(value).toLowerCase().includes(q))
    ),
  };
}

export async function append(props: Props & { values: unknown }) {
  const api = await compat();
  const cfg = ref(props);
  return scope(props, async () => {
    const res = await api.appendUnitRow(await db(), cfg.workbookId, row(props.values), {
      sheet: cfg.sheetId,
      member: 'activepieces',
    });
    const list = await api.readUnitRows(await db(), cfg.workbookId, { sheet: res.sheet, start: res.row, end: res.row });
    const item = list[0];
    if (!item) throw new Error('Appended row was not readable');
    return out(item);
  });
}

export async function update(props: Props & { row_index: number; column_index: number; value: unknown }) {
  if (!Number.isFinite(props.row_index)) throw new Error('Row index is required');
  if (!Number.isFinite(props.column_index)) throw new Error('Column index is required');
  const api = await compat();
  const cfg = ref(props);
  return scope(props, async () => {
    const res = await api.updateUnitCell(await db(), cfg.workbookId, props.row_index, props.column_index, cell(props.value), {
      sheet: cfg.sheetId,
      member: 'activepieces',
    });
    return {
      workbookId: cfg.workbookId,
      sheetId: res.sheet,
      rowIndex: res.row,
      columnIndex: props.column_index,
      value: cell(props.value),
      revision: res.rev,
    };
  });
}
