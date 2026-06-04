import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type * as Compat from '@opencode-ai/univer-compat';
import { cell, ref, row, type Identity, type Row, type Scoped } from './types';

let mod: Promise<typeof Compat> | undefined;
let store: Compat.Store | undefined;

type Book = {
  id: string;
  name: string;
};

type Sheet = {
  id: string;
  name: string;
};

type BookWire = {
  sheets?: Record<string, Record<string, unknown>>;
  sheetOrder?: string[];
};

type Db = Compat.Store & {
  listPersistedSheetUnits(): Promise<Book[]>;
};

type Api = typeof Compat & {
  parseSnapshotWorkbook(snap: string): { wb: BookWire };
  sheetIdsFromWorkbook(wb: BookWire): string[];
};

async function compat() {
  if (!mod) {
    mod = import(
      pathToFileURL(path.resolve(__dirname, '../../../../../../../../../univer-compat/src/index.ts')).href
    ) as Promise<typeof Compat>;
  }
  return await mod;
}

async function api() {
  return await compat() as Api;
}

function persist() {
  const raw = process.env['UNIVER_COMPAT_PERSIST_EVERY_REV']?.trim();
  if (!raw) throw new Error('UNIVER_COMPAT_PERSIST_EVERY_REV is required');
  const step = Number.parseInt(raw, 10);
  if (!Number.isFinite(step) || step < 1) throw new Error('UNIVER_COMPAT_PERSIST_EVERY_REV must be >= 1');
  return step;
}

async function db() {
  const pkg = await api();
  if (!store) store = new pkg.Store(pkg.exchangeFilesFromEnv(), persist());
  return store as Db;
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

async function scope<T>(props: Scoped, fn: () => Promise<T>) {
  const api = await compat();
  const cfg = ref(props);
  return api.runWithRequestUserAsync(cfg.userId, () => api.runWithRequestProjectAsync(cfg.projectId, fn));
}

export async function workbooks(id: Identity) {
  const pkg = await api();
  return pkg.runWithRequestUserAsync(id.userId, () =>
    pkg.runWithRequestProjectAsync(id.projectId, async () => ({
      workbooks: await (await db()).listPersistedSheetUnits(),
    }))
  );
}

export async function sheets(props: Identity & { workbook_id: string }) {
  if (!props.workbook_id) throw new Error('Workbook ID is required');
  const pkg = await api();
  return pkg.runWithRequestUserAsync(props.userId, () =>
    pkg.runWithRequestProjectAsync(props.projectId, async () => {
      const dbs = await db();
      await dbs.hydrateUnit(props.workbook_id);
      const snap = dbs.latestSnapshot(props.workbook_id, 2).snap;
      const wb = pkg.parseSnapshotWorkbook(snap).wb;
      return {
        sheets: pkg.sheetIdsFromWorkbook(wb).map((id: string): Sheet => {
          const raw = wb.sheets ? wb.sheets[id] : undefined;
          const name = raw && typeof raw['name'] === 'string' && raw['name'].trim() ? raw['name'].trim() : id;
          return { id, name };
        }),
      };
    })
  );
}

export async function rows(props: Scoped) {
  const api = await compat();
  const cfg = ref(props);
  return scope(props, async () => ({
    rows: (await api.readUnitRows(await db(), cfg.workbookId, { sheet: cfg.sheetId })).map(out),
  }));
}

export async function find(props: Scoped & { query?: string }) {
  if (!props.query) throw new Error('Query is required');
  const q = props.query.toLowerCase();
  return {
    rows: (await rows(props)).rows.filter((item) =>
      item.values.some((value) => String(value).toLowerCase().includes(q))
    ),
  };
}

export async function append(props: Scoped & { values: unknown }) {
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

export async function update(props: Scoped & { row_index?: number; column_index?: number; value: unknown }) {
  if (!Number.isFinite(props.row_index)) throw new Error('Row index is required');
  if (!Number.isFinite(props.column_index)) throw new Error('Column index is required');
  const r = props.row_index;
  const c = props.column_index;
  if (typeof r !== 'number') throw new Error('Row index is required');
  if (typeof c !== 'number') throw new Error('Column index is required');
  const api = await compat();
  const cfg = ref(props);
  return scope(props, async () => {
    const res = await api.updateUnitCell(await db(), cfg.workbookId, r, c, cell(props.value), {
      sheet: cfg.sheetId,
      member: 'activepieces',
    });
    return {
      workbookId: cfg.workbookId,
      sheetId: res.sheet,
      rowIndex: res.row,
      columnIndex: c,
      value: cell(props.value),
      revision: res.rev,
    };
  });
}
