import { describe, expect, test } from 'bun:test';
import { data } from '../src/lib/client';

describe('Veritly Data automation contract', () => {
  test('caps every row page at one thousand records', () => {
    expect(data.limit(undefined)).toBe(100);
    expect(data.limit(1_000)).toBe(1_000);
    expect(() => data.limit(1_001)).toThrow('Limit must be an integer from 1 to 1000');
  });

  test('drops raw cells from webhook payloads', () => {
    expect(
      data.Event.parse({
        id: 'event_1',
        kind: 'row',
        action: 'updated',
        resource: 'dataset_1',
        row: '724822c2-e0a5-4a4f-998f-3f890e55c11b',
        version: 2,
        created: 1,
        values: { Secret: 'must not leave the data service' },
      }),
    ).toEqual({
      id: 'event_1',
      kind: 'row',
      action: 'updated',
      resource: 'dataset_1',
      row: '724822c2-e0a5-4a4f-998f-3f890e55c11b',
      version: 2,
      created: 1,
    });
  });

  test('returns already completed jobs without polling', async () => {
    const job = Object.freeze({
      id: 'job_1',
      kind: 'publish',
      state: 'succeeded',
      progress: 1,
      created: 1,
      updated: 2,
    });
    expect(
      await data.wait({
        server: { apiUrl: 'https://automation.example', publicUrl: 'https://automation.example', token: 'engine' },
        job,
        timeout: 1,
      }),
    ).toEqual(job);
  });

  test('rejects failed jobs that omit the required backend error', async () => {
    expect(
      data.wait({
        server: { apiUrl: 'https://automation.example', publicUrl: 'https://automation.example', token: 'engine' },
        job: {
          id: 'job_2',
          kind: 'publish',
          state: 'failed',
          progress: 1,
          created: 1,
          updated: 2,
        },
        timeout: 1,
      }),
    ).rejects.toThrow('missing an error');
  });
});
