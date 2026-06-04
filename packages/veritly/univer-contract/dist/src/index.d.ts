import { z } from 'zod';
export declare const VeritlyUniverCell: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
export declare const VeritlyUniverBook: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export declare const VeritlyUniverRow: z.ZodObject<{
    id: z.ZodString;
    index: z.ZodNumber;
    values: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
    updatedAt: z.ZodString;
    hash: z.ZodString;
}, z.core.$strip>;
export declare const VeritlyUniverWorkbooks: z.ZodObject<{
    workbooks: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const VeritlyUniverSheets: z.ZodObject<{
    sheets: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const VeritlyUniverRows: z.ZodObject<{
    rows: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        index: z.ZodNumber;
        values: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
        updatedAt: z.ZodString;
        hash: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const VeritlyUniverAppend: z.ZodObject<{
    values: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
}, z.core.$strip>;
export declare const VeritlyUniverUpdate: z.ZodObject<{
    rowIndex: z.ZodNumber;
    columnIndex: z.ZodNumber;
    value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
}, z.core.$strip>;
export declare const VeritlyUniverUpdateResult: z.ZodObject<{
    workbookId: z.ZodString;
    sheetId: z.ZodString;
    rowIndex: z.ZodNumber;
    columnIndex: z.ZodNumber;
    value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
    revision: z.ZodNumber;
}, z.core.$strip>;
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
export declare const univerWorkerPaths: {
    root: string;
    workbooks: string;
    sheets(book: string): string;
    rows(ref: Ref): string;
    cells(ref: Ref): string;
};
export declare function ref(scope: Scope): Ref;
export declare const scope: typeof ref;
export declare function isCell(value: unknown): value is Cell;
export declare function cell(value: unknown): Cell;
export declare function row(value: unknown): Cell[];
export declare function snap(rows: Row[]): Snap;
export declare function createUniverClient(opts: ClientOptions): {
    workbooks(): Promise<{
        workbooks: {
            id: string;
            name: string;
        }[];
    }>;
    sheets(book: string): Promise<{
        sheets: {
            id: string;
            name: string;
        }[];
    }>;
    rows(target: Ref): Promise<{
        rows: {
            id: string;
            index: number;
            values: (string | number | boolean | null)[];
            updatedAt: string;
            hash: string;
        }[];
    }>;
    append(target: Ref, values: Cell[]): Promise<{
        id: string;
        index: number;
        values: (string | number | boolean | null)[];
        updatedAt: string;
        hash: string;
    }>;
    update(target: Ref, update: VeritlyUniverUpdate): Promise<{
        workbookId: string;
        sheetId: string;
        rowIndex: number;
        columnIndex: number;
        value: string | number | boolean | null;
        revision: number;
    }>;
};
//# sourceMappingURL=index.d.ts.map