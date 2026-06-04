declare module '@opencode-ai/univer-compat' {
  export type RowCell = string | number | boolean | null;

  export type Row = {
    index: number;
    values: RowCell[];
    hash: string;
  };

  export type RowReadOptions = {
    sheet?: string;
    start?: number;
    end?: number;
    width?: number;
    empty?: boolean;
  };

  export class Store {
    constructor(blob: unknown, persistEveryRev: number);
    hydrateUnit(unit: string): Promise<void>;
    latestSnapshot(unit: string, typ: number): { snap: string; rev: number };
    saveChangeset(unit: string, typ: number, baseRev: number, member: string, changeset: string): number;
    maybePersistUnit(unit: string, rev: number, always: boolean): Promise<void>;
  }

  export function exchangeFilesFromEnv(): unknown;
  export function runWithRequestProjectAsync<T>(projectId: string, fn: () => Promise<T>): Promise<T>;
  export function runWithRequestUserAsync<T>(userId: string, fn: () => Promise<T>): Promise<T>;
  export function readUnitRows(store: Store, unit: string, opts?: RowReadOptions): Promise<Row[]>;
  export function appendUnitRow(
    store: Store,
    unit: string,
    values: RowCell[],
    opts: { sheet?: string; member: string },
  ): Promise<{ sheet: string; row: number; rev: number }>;
  export function updateUnitCell(
    store: Store,
    unit: string,
    row: number,
    column: number,
    value: RowCell,
    opts: { sheet?: string; member: string },
  ): Promise<{ sheet: string; row: number; rev: number }>;
}
