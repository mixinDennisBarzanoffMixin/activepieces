import { describe, expect, it } from 'vitest';
import { postgresReturningRows } from '../../../../src/app/veritly/office/postgres-returning';

describe('postgresReturningRows', () => {
  it('extracts UPDATE RETURNING rows from the pinned TypeORM PostgreSQL result', () => {
    const row = { id: 'row_1' };
    expect(postgresReturningRows([[row], 1])).toEqual([row]);
    expect(postgresReturningRows([[], 0])).toEqual([]);
  });

  it('accepts direct rows returned by older TypeORM PostgreSQL drivers', () => {
    const rows = [{ id: 'row_1' }, { id: 'row_2' }];
    expect(postgresReturningRows(rows)).toEqual(rows);
  });
});
