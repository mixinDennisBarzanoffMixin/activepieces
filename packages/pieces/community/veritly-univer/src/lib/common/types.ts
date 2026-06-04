export type Cell = string | number | boolean | null;

export type Ref = {
  userId: string;
  projectId: string;
  workbookId: string;
  sheetId: string;
};

export type Row = {
  id: string;
  index: number;
  values: Cell[];
  updatedAt: string;
  hash: string;
};

export type Props = {
  veritly_user_id: string;
  project_id: string;
  workbook_id: string;
  sheet_id: string;
};

export type Snap = Record<string, string>;

export function ref(props: Props): Ref {
  if (!props.veritly_user_id) throw new Error('Veritly User ID is required');
  if (!props.project_id) throw new Error('Project ID is required');
  if (!props.workbook_id) throw new Error('Workbook ID is required');
  if (!props.sheet_id) throw new Error('Sheet ID is required');
  return {
    userId: props.veritly_user_id,
    projectId: props.project_id,
    workbookId: props.workbook_id,
    sheetId: props.sheet_id,
  };
}

export function cell(value: unknown): Cell {
  if (value === null) return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  throw new Error('Cell value must be a string, number, boolean, or null');
}

export function row(value: unknown): Cell[] {
  if (!Array.isArray(value)) throw new Error('Row values must be an array');
  return value.map(cell);
}

export function snap(rows: Row[]): Snap {
  return Object.fromEntries(rows.map((item) => [item.id, item.hash]));
}
