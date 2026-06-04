import { z } from 'zod';

export const VeritlyUniverCell = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const VeritlyUniverBook = z.object({
  id: z.string(),
  name: z.string(),
});

export const VeritlyUniverRow = z.object({
  id: z.string(),
  index: z.number(),
  values: z.array(VeritlyUniverCell),
  updatedAt: z.string(),
  hash: z.string(),
});

export const VeritlyUniverWorkbooks = z.object({
  workbooks: z.array(VeritlyUniverBook),
});

export const VeritlyUniverSheets = z.object({
  sheets: z.array(VeritlyUniverBook),
});

export const VeritlyUniverRows = z.object({
  rows: z.array(VeritlyUniverRow),
});

export const VeritlyUniverAppend = z.object({
  values: z.array(VeritlyUniverCell),
});

export const VeritlyUniverUpdate = z.object({
  rowIndex: z.number(),
  columnIndex: z.number(),
  value: VeritlyUniverCell,
});

export const VeritlyUniverUpdateResult = z.object({
  workbookId: z.string(),
  sheetId: z.string(),
  rowIndex: z.number(),
  columnIndex: z.number(),
  value: VeritlyUniverCell,
  revision: z.number(),
});

export type VeritlyUniverCell = z.infer<typeof VeritlyUniverCell>;
export type VeritlyUniverBook = z.infer<typeof VeritlyUniverBook>;
export type VeritlyUniverRow = z.infer<typeof VeritlyUniverRow>;
export type VeritlyUniverWorkbooks = z.infer<typeof VeritlyUniverWorkbooks>;
export type VeritlyUniverSheets = z.infer<typeof VeritlyUniverSheets>;
export type VeritlyUniverRows = z.infer<typeof VeritlyUniverRows>;
export type VeritlyUniverAppend = z.infer<typeof VeritlyUniverAppend>;
export type VeritlyUniverUpdate = z.infer<typeof VeritlyUniverUpdate>;
export type VeritlyUniverUpdateResult = z.infer<typeof VeritlyUniverUpdateResult>;

export type Cell = VeritlyUniverCell;
export type Row = VeritlyUniverRow;
export type Snap = Record<string, string>;

export type Ref = {
  workbookId: string;
  sheetId: string;
};

export type Scope = {
  workbook_id?: string;
  sheet_id?: string;
};

export type ClientOptions = {
  baseUrl: string;
  token: string;
  timeoutMs?: number;
  fetch?: (input: string | URL, init?: RequestInit) => Promise<Response>;
};

export const univerWorkerPaths = {
  root: 'v1/veritly/worker/univer',
  workbooks: 'workbooks',
  sheets(book: string) {
    return `workbooks/${encodeURIComponent(book)}/sheets`;
  },
  rows(ref: Ref) {
    return `workbooks/${encodeURIComponent(ref.workbookId)}/sheets/${encodeURIComponent(ref.sheetId)}/rows`;
  },
  cells(ref: Ref) {
    return `workbooks/${encodeURIComponent(ref.workbookId)}/sheets/${encodeURIComponent(ref.sheetId)}/cells`;
  },
};

export function ref(scope: Scope): Ref {
  if (!scope.workbook_id) throw new Error('Workbook ID is required');
  if (!scope.sheet_id) throw new Error('Sheet ID is required');
  return {
    workbookId: scope.workbook_id,
    sheetId: scope.sheet_id,
  };
}

export const scope = ref;

export function isCell(value: unknown): value is Cell {
  if (value === null) return true;
  if (typeof value === 'string') return true;
  if (typeof value === 'boolean') return true;
  return typeof value === 'number' && Number.isFinite(value);
}

export function cell(value: unknown): Cell {
  if (isCell(value)) return value;
  throw new Error('Cell value must be a string, number, boolean, or null');
}

export function row(value: unknown): Cell[] {
  if (!Array.isArray(value)) throw new Error('Row values must be an array');
  return value.map(cell);
}

export function snap(rows: Row[]): Snap {
  return Object.fromEntries(rows.map((item) => [item.id, item.hash]));
}

export function createUniverClient(opts: ClientOptions) {
  const send = async <T>(schema: z.ZodType<T>, method: string, path: string, data?: unknown): Promise<T> => {
    const timeout = opts.timeoutMs === undefined ? 5000 : opts.timeoutMs;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    const fetcher = opts.fetch === undefined ? fetch : opts.fetch;
    const res = await fetcher(url(opts.baseUrl, path), {
      method,
      headers: {
        Authorization: `Bearer ${opts.token}`,
        ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));
    if (res.ok) return schema.parse(await res.json());
    throw new Error(await res.text());
  };

  return {
    async workbooks() {
      return await send(VeritlyUniverWorkbooks, 'GET', univerWorkerPaths.workbooks);
    },
    async sheets(book: string) {
      if (!book) throw new Error('Workbook ID is required');
      return await send(VeritlyUniverSheets, 'GET', univerWorkerPaths.sheets(book));
    },
    async rows(target: Ref) {
      return await send(VeritlyUniverRows, 'GET', univerWorkerPaths.rows(target));
    },
    async append(target: Ref, values: Cell[]) {
      return await send(VeritlyUniverRow, 'POST', univerWorkerPaths.rows(target), { values });
    },
    async update(target: Ref, update: VeritlyUniverUpdate) {
      return await send(VeritlyUniverUpdateResult, 'POST', univerWorkerPaths.cells(target), update);
    },
  };
}

function url(base: string, path: string) {
  const root = base.endsWith('/') ? base : `${base}/`;
  return new URL(`${univerWorkerPaths.root}/${path}`, root);
}
