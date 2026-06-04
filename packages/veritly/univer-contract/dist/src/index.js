"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scope = exports.univerWorkerPaths = exports.VeritlyUniverUpdateResult = exports.VeritlyUniverUpdate = exports.VeritlyUniverAppend = exports.VeritlyUniverRows = exports.VeritlyUniverSheets = exports.VeritlyUniverWorkbooks = exports.VeritlyUniverRow = exports.VeritlyUniverBook = exports.VeritlyUniverCell = void 0;
exports.ref = ref;
exports.isCell = isCell;
exports.cell = cell;
exports.row = row;
exports.snap = snap;
exports.createUniverClient = createUniverClient;
const zod_1 = require("zod");
exports.VeritlyUniverCell = zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), zod_1.z.null()]);
exports.VeritlyUniverBook = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
});
exports.VeritlyUniverRow = zod_1.z.object({
    index: zod_1.z.number(),
    values: zod_1.z.array(exports.VeritlyUniverCell),
    hash: zod_1.z.string(),
});
exports.VeritlyUniverWorkbooks = zod_1.z.object({
    workbooks: zod_1.z.array(exports.VeritlyUniverBook),
});
exports.VeritlyUniverSheets = zod_1.z.object({
    sheets: zod_1.z.array(exports.VeritlyUniverBook),
});
exports.VeritlyUniverRows = zod_1.z.object({
    rows: zod_1.z.array(exports.VeritlyUniverRow),
});
exports.VeritlyUniverAppend = zod_1.z.object({
    values: zod_1.z.array(exports.VeritlyUniverCell),
});
exports.VeritlyUniverUpdate = zod_1.z.object({
    rowIndex: zod_1.z.number(),
    columnIndex: zod_1.z.number(),
    value: exports.VeritlyUniverCell,
});
exports.VeritlyUniverUpdateResult = zod_1.z.object({
    workbookId: zod_1.z.string(),
    sheetId: zod_1.z.string(),
    rowIndex: zod_1.z.number(),
    columnIndex: zod_1.z.number(),
    value: exports.VeritlyUniverCell,
    revision: zod_1.z.number(),
});
exports.univerWorkerPaths = {
    root: 'v1/veritly/worker/univer',
    workbooks: 'workbooks',
    sheets(book) {
        return `workbooks/${encodeURIComponent(book)}/sheets`;
    },
    rows(ref) {
        return `workbooks/${encodeURIComponent(ref.workbookId)}/sheets/${encodeURIComponent(ref.sheetId)}/rows`;
    },
    cells(ref) {
        return `workbooks/${encodeURIComponent(ref.workbookId)}/sheets/${encodeURIComponent(ref.sheetId)}/cells`;
    },
};
function ref(scope) {
    if (!scope.workbook_id)
        throw new Error('Workbook ID is required');
    if (!scope.sheet_id)
        throw new Error('Sheet ID is required');
    return {
        workbookId: scope.workbook_id,
        sheetId: scope.sheet_id,
    };
}
exports.scope = ref;
function isCell(value) {
    if (value === null)
        return true;
    if (typeof value === 'string')
        return true;
    if (typeof value === 'boolean')
        return true;
    return typeof value === 'number' && Number.isFinite(value);
}
function cell(value) {
    if (isCell(value))
        return value;
    throw new Error('Cell value must be a string, number, boolean, or null');
}
function row(value) {
    if (!Array.isArray(value))
        throw new Error('Row values must be an array');
    return value.map(cell);
}
function snap(rows) {
    return Object.fromEntries(rows.map((item) => [String(item.index), item.hash]));
}
function createUniverClient(opts) {
    const send = async (schema, method, path, data) => {
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
        if (res.ok)
            return schema.parse(await res.json());
        throw new Error(await res.text());
    };
    return {
        async workbooks() {
            return await send(exports.VeritlyUniverWorkbooks, 'GET', exports.univerWorkerPaths.workbooks);
        },
        async sheets(book) {
            if (!book)
                throw new Error('Workbook ID is required');
            return await send(exports.VeritlyUniverSheets, 'GET', exports.univerWorkerPaths.sheets(book));
        },
        async rows(target) {
            return await send(exports.VeritlyUniverRows, 'GET', exports.univerWorkerPaths.rows(target));
        },
        async append(target, values) {
            return await send(exports.VeritlyUniverRow, 'POST', exports.univerWorkerPaths.rows(target), { values });
        },
        async update(target, update) {
            return await send(exports.VeritlyUniverUpdateResult, 'POST', exports.univerWorkerPaths.cells(target), update);
        },
    };
}
function url(base, path) {
    const root = base.endsWith('/') ? base : `${base}/`;
    return new URL(`${exports.univerWorkerPaths.root}/${path}`, root);
}
//# sourceMappingURL=index.js.map