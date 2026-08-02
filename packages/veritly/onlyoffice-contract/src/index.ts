import { z } from 'zod';

export const VeritlyOnlyOfficeCell = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const VeritlyOnlyOfficeBook = z.object({
  id: z.string(),
  name: z.string(),
});

export const VeritlyOnlyOfficeRow = z.object({
  index: z.number(),
  values: z.array(VeritlyOnlyOfficeCell),
  hash: z.string(),
});

export const VeritlyOnlyOfficeWorkbooks = z.object({
  workbooks: z.array(VeritlyOnlyOfficeBook),
});

export const VeritlyOnlyOfficeDocument = VeritlyOnlyOfficeBook.extend({
  kind: z.enum(['word', 'slide']),
});

export const VeritlyOnlyOfficeDocuments = z.object({
  documents: z.array(VeritlyOnlyOfficeDocument),
});

export const VeritlyOnlyOfficeSheets = z.object({
  sheets: z.array(VeritlyOnlyOfficeBook),
});

export const VeritlyOnlyOfficeRows = z.object({
  rows: z.array(VeritlyOnlyOfficeRow),
});

export const VeritlyOnlyOfficeAppend = z.object({
  values: z.array(VeritlyOnlyOfficeCell),
});

export const VeritlyOnlyOfficeUpdate = z.object({
  rowIndex: z.number(),
  columnIndex: z.number(),
  value: VeritlyOnlyOfficeCell,
});

export const VeritlyOnlyOfficeUpdateResult = z.object({
  workbookId: z.string(),
  sheetId: z.string(),
  rowIndex: z.number(),
  columnIndex: z.number(),
  value: VeritlyOnlyOfficeCell,
  revision: z.number(),
});

export const VeritlyOnlyOfficeSheetEventType = z.enum(['new_row_added', 'row_changed']);
export const VeritlyOnlyOfficeChartEventType = z.literal('chart_changed');
export const VeritlyOnlyOfficeEventType = z.union([
  VeritlyOnlyOfficeSheetEventType,
  VeritlyOnlyOfficeChartEventType,
]);

export const VeritlyOnlyOfficeSheetWebhookRegistration = z.object({
  id: z.string(),
  event: VeritlyOnlyOfficeSheetEventType,
  workbookId: z.string(),
  sheetId: z.string(),
  url: z.string().url(),
});

export const VeritlyOnlyOfficeChartWebhookRegistration = z.object({
  id: z.string(),
  event: VeritlyOnlyOfficeChartEventType,
  workbookId: z.string(),
  url: z.string().url(),
});

export const VeritlyOnlyOfficeWebhookRegistration = z.discriminatedUnion('event', [
  VeritlyOnlyOfficeSheetWebhookRegistration,
  VeritlyOnlyOfficeChartWebhookRegistration,
]);

export const VeritlyOnlyOfficeRegisterWebhook = z.discriminatedUnion('event', [
  VeritlyOnlyOfficeSheetWebhookRegistration.omit({ id: true }),
  VeritlyOnlyOfficeChartWebhookRegistration.omit({ id: true }),
]);

export const VeritlyOnlyOfficeRegisterWebhookResult = z.object({
  id: z.string(),
});

export const VeritlyOnlyOfficeSheetWebhookPayload = z.object({
  event: VeritlyOnlyOfficeSheetEventType,
  workbookId: z.string(),
  sheetId: z.string(),
  revision: z.number(),
  row: VeritlyOnlyOfficeRow,
});

export const VeritlyOnlyOfficeChart = z.object({
  provider: z.literal('onlyoffice'),
  fileId: z.string(),
  fileName: z.string(),
  chartId: z.string(),
  sourceId: z.string(),
  sourceName: z.string(),
  revision: z.number(),
  name: z.string(),
  spec: z.record(z.string(), z.unknown()),
  updated: z.number(),
});

export const VeritlyOnlyOfficeChartWebhookPayload = z.object({
  event: VeritlyOnlyOfficeChartEventType,
  workbookId: z.string(),
  revision: z.number(),
  charts: z.array(VeritlyOnlyOfficeChart),
});

export const VeritlyOnlyOfficeWebhookPayload = z.discriminatedUnion('event', [
  VeritlyOnlyOfficeSheetWebhookPayload,
  VeritlyOnlyOfficeChartWebhookPayload,
]);

export type VeritlyOnlyOfficeCell = z.infer<typeof VeritlyOnlyOfficeCell>;
export type VeritlyOnlyOfficeBook = z.infer<typeof VeritlyOnlyOfficeBook>;
export type VeritlyOnlyOfficeRow = z.infer<typeof VeritlyOnlyOfficeRow>;
export type VeritlyOnlyOfficeWorkbooks = z.infer<typeof VeritlyOnlyOfficeWorkbooks>;
export type VeritlyOnlyOfficeDocument = z.infer<typeof VeritlyOnlyOfficeDocument>;
export type VeritlyOnlyOfficeDocuments = z.infer<typeof VeritlyOnlyOfficeDocuments>;
export type VeritlyOnlyOfficeSheets = z.infer<typeof VeritlyOnlyOfficeSheets>;
export type VeritlyOnlyOfficeRows = z.infer<typeof VeritlyOnlyOfficeRows>;
export type VeritlyOnlyOfficeAppend = z.infer<typeof VeritlyOnlyOfficeAppend>;
export type VeritlyOnlyOfficeUpdate = z.infer<typeof VeritlyOnlyOfficeUpdate>;
export type VeritlyOnlyOfficeUpdateResult = z.infer<typeof VeritlyOnlyOfficeUpdateResult>;
export type VeritlyOnlyOfficeEventType = z.infer<typeof VeritlyOnlyOfficeEventType>;
export type VeritlyOnlyOfficeWebhookRegistration = z.infer<typeof VeritlyOnlyOfficeWebhookRegistration>;
export type VeritlyOnlyOfficeRegisterWebhook = z.infer<typeof VeritlyOnlyOfficeRegisterWebhook>;
export type VeritlyOnlyOfficeRegisterWebhookResult = z.infer<typeof VeritlyOnlyOfficeRegisterWebhookResult>;
export type VeritlyOnlyOfficeWebhookPayload = z.infer<typeof VeritlyOnlyOfficeWebhookPayload>;

export type Cell = VeritlyOnlyOfficeCell;
export type Row = VeritlyOnlyOfficeRow;
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

export const onlyOfficeWorkerPaths = {
  root: 'v1/veritly/worker/onlyoffice',
  workbooks: 'workbooks',
  documents: 'documents',
  document(id: string) {
    return `documents/${encodeURIComponent(id)}/content`;
  },
  sheets(book: string) {
    return `workbooks/${encodeURIComponent(book)}/sheets`;
  },
  rows(ref: Ref) {
    return `workbooks/${encodeURIComponent(ref.workbookId)}/sheets/${encodeURIComponent(ref.sheetId)}/rows`;
  },
  cells(ref: Ref) {
    return `workbooks/${encodeURIComponent(ref.workbookId)}/sheets/${encodeURIComponent(ref.sheetId)}/cells`;
  },
  webhooks: 'webhook-registrations',
  webhook(id: string) {
    return `webhook-registrations/${encodeURIComponent(id)}`;
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
  return Object.fromEntries(rows.map((item) => [String(item.index), item.hash]));
}

export function createOnlyOfficeClient(opts: ClientOptions) {
  const send = async <T>(schema: z.ZodType<T>, method: string, path: string, data?: unknown): Promise<T> => {
    const res = await request(method, path, data);
    if (res.ok) return schema.parse(await res.json());
    throw new Error(await res.text());
  };

  return {
    async workbooks() {
      return await send(VeritlyOnlyOfficeWorkbooks, 'GET', onlyOfficeWorkerPaths.workbooks);
    },
    async documents() {
      return await send(VeritlyOnlyOfficeDocuments, 'GET', onlyOfficeWorkerPaths.documents);
    },
    async document(id: string) {
      if (!id) throw new Error('Document ID is required');
      const res = await request('GET', onlyOfficeWorkerPaths.document(id));
      if (!res.ok) throw new Error(await res.text());
      return new Uint8Array(await res.arrayBuffer());
    },
    async sheets(book: string) {
      if (!book) throw new Error('Workbook ID is required');
      return await send(VeritlyOnlyOfficeSheets, 'GET', onlyOfficeWorkerPaths.sheets(book));
    },
    async rows(target: Ref) {
      return await send(VeritlyOnlyOfficeRows, 'GET', onlyOfficeWorkerPaths.rows(target));
    },
    async append(target: Ref, values: Cell[]) {
      return await send(VeritlyOnlyOfficeRow, 'POST', onlyOfficeWorkerPaths.rows(target), { values });
    },
    async update(target: Ref, update: VeritlyOnlyOfficeUpdate) {
      return await send(VeritlyOnlyOfficeUpdateResult, 'POST', onlyOfficeWorkerPaths.cells(target), update);
    },
    async registerWebhook(input: VeritlyOnlyOfficeRegisterWebhook) {
      return await send(VeritlyOnlyOfficeRegisterWebhookResult, 'POST', onlyOfficeWorkerPaths.webhooks, input);
    },
    async unregisterWebhook(id: string) {
      return await send(z.object({ ok: z.literal(true) }), 'DELETE', onlyOfficeWorkerPaths.webhook(id));
    },
  };

  async function request(method: string, path: string, data?: unknown) {
    const timeout = opts.timeoutMs === undefined ? 5000 : opts.timeoutMs;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    const fetcher = opts.fetch === undefined ? fetch : opts.fetch;
    return await fetcher(url(opts.baseUrl, path), {
      method,
      headers: {
        Authorization: `Bearer ${opts.token}`,
        ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));
  }
}

function url(base: string, path: string) {
  const root = base.endsWith('/') ? base : `${base}/`;
  return new URL(`${onlyOfficeWorkerPaths.root}/${path}`, root);
}
