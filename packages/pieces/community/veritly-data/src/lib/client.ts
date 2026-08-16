import type { ServerContext } from '@activepieces/pieces-framework';
import type {
  DataWebhookEvent as TriggerEventType,
  EditInput,
  InsertInput,
  Job as JobType,
  PublishInput,
  ReconcileInput,
  RemoveInput,
  UpsertInput,
  WritebackInput,
} from '@veritly/data-protocol/activepieces';
import { z } from 'zod';

const Value = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);
const Cells = z.record(z.string(), Value);
const Source = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('workbook'), file: z.string(), path: z.string(), revision: z.number().int().positive() }),
  z.object({ kind: z.literal('native') }),
]);
const Summary = z.object({
  id: z.string(),
  path: z.string(),
  schema: z.string(),
  source: Source,
  state: z.enum(['draft', 'ready', 'published', 'source_missing', 'repairing']),
  version: z.number().int().positive(),
  updated: z.number().int().nonnegative(),
});
const Command = z.object({ kind: z.string() }).passthrough();
const Prep = Summary.extend({
  project: z.string(),
  commands: z.array(Command),
  baseline: z
    .object({
      workbook: z.number().int().positive(),
      recipe: z.number().int().positive(),
      dataset: z.number().int().positive(),
      hash: z.string(),
    })
    .optional(),
  created: z.number().int().nonnegative(),
});
const Preps = z.object({ preps: z.array(Summary) });
const Column = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['text', 'boolean', 'integer', 'decimal', 'date', 'timestamp']),
  owner: z.enum(['shared', 'workbook', 'database', 'formula', 'derived']),
  nullable: z.boolean(),
  formula: z.string().optional(),
});
const Dataset = z.object({
  id: z.string(),
  prep: z.string().optional(),
  project: z.string(),
  schema: z.string(),
  table: z.string(),
  class: z.enum(['entity', 'derived', 'native']),
  columns: z.array(Column),
  keys: z.array(z.string()),
  rows: z.number().int().nonnegative(),
  bytes: z.number().int().nonnegative(),
  version: z.number().int().positive(),
});
const Datasets = z.object({ datasets: z.array(Dataset) });
const Row = z.object({ id: z.string().uuid(), version: z.number().int().nonnegative(), values: Cells });
const Rows = z.object({ rows: z.array(Row), cursor: z.string().optional() });
const Receipt = z.object({ id: z.string(), version: z.number().int().nonnegative(), created: z.number().int().nonnegative() });
const Job = z.object({
  id: z.string(),
  kind: z.enum(['profile', 'preview', 'publish', 'writeback', 'reconcile', 'export', 'cleanup']),
  state: z.enum(['queued', 'running', 'succeeded', 'failed', 'cancelled']),
  progress: z.number().min(0).max(1),
  error: z.string().optional(),
  created: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
});
const Base = { id: z.string(), resource: z.string(), created: z.number().int().nonnegative() };
const Event = z.discriminatedUnion('kind', [
  z.object({
    ...Base,
    kind: z.literal('row'),
    action: z.enum(['created', 'updated', 'deleted']),
    row: z.string().uuid(),
    version: z.number().int().nonnegative().optional(),
  }),
  z.object({
    ...Base,
    kind: z.literal('job'),
    action: z.enum(['completed', 'failed']),
    job: z.enum(['profile', 'preview', 'publish', 'writeback', 'reconcile', 'export', 'cleanup']),
    prep: z.string().optional(),
  }),
  z.object({
    ...Base,
    kind: z.literal('issue'),
    action: z.enum(['created', 'resolved']),
    code: z.enum([
      'version_conflict',
      'source_revision_changed',
      'dataset_revision_changed',
      'sync_conflict',
      'identity_invalid',
      'mapping_not_invertible',
      'formula_stale',
      'quota_exceeded',
      'repairing',
      'job_failed',
    ]),
    prep: z.string(),
  }),
  z.object({ ...Base, kind: z.literal('project'), action: z.literal('changed') }),
]);
const Hook = z.object({ id: z.string() });

class DataClient {
  constructor(private readonly server: ServerContext) {}

  private async request<T>(schema: z.ZodType<T>, method: string, path: string, body?: unknown) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5_000);
    const res = await fetch(url(this.server.apiUrl, path), {
      method,
      headers: {
        Authorization: `Bearer ${this.server.token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));
    if (!res.ok) throw new Error(await res.text());
    return schema.parse(await res.json());
  }

  async preps() {
    return await this.request(Preps, 'GET', 'preps');
  }

  async prep(id: string) {
    return await this.request(Prep, 'GET', `preps/${encodeURIComponent(id)}`);
  }

  async datasets() {
    return await this.request(Datasets, 'GET', 'datasets');
  }

  async rows(id: string, cursor: string | undefined, limit: number) {
    const query = new URLSearchParams({ limit: String(limit) });
    if (cursor) query.set('cursor', cursor);
    return await this.request(Rows, 'GET', `datasets/${encodeURIComponent(id)}/rows?${query}`);
  }

  async insert(id: string, input: InsertInput) {
    return await this.request(Row, 'POST', `datasets/${encodeURIComponent(id)}/rows`, input);
  }

  async edit(id: string, row: string, input: EditInput) {
    return await this.request(Row, 'POST', `datasets/${encodeURIComponent(id)}/rows/${encodeURIComponent(row)}/edit`, input);
  }

  async remove(id: string, row: string, input: RemoveInput) {
    return await this.request(Receipt, 'DELETE', `datasets/${encodeURIComponent(id)}/rows/${encodeURIComponent(row)}`, input);
  }

  async upsert(id: string, input: UpsertInput) {
    return await this.request(Row, 'POST', `datasets/${encodeURIComponent(id)}/upsert`, input);
  }

  async publish(id: string, input: PublishInput) {
    return await this.request(Job, 'POST', `preps/${encodeURIComponent(id)}/publish`, input);
  }

  async writeback(id: string, input: WritebackInput) {
    return await this.request(Job, 'POST', `preps/${encodeURIComponent(id)}/writeback`, input);
  }

  async reconcile(id: string, input: ReconcileInput) {
    return await this.request(Job, 'POST', `preps/${encodeURIComponent(id)}/reconcile`, input);
  }

  async job(id: string) {
    return await this.request(Job, 'GET', `jobs/${encodeURIComponent(id)}`);
  }

  async register(event: TriggerEvent, url: string, resource?: string) {
    return await this.request(Hook, 'POST', 'webhook-registrations', { event, url, resource });
  }

  async unregister(id: string) {
    return await this.request(z.object({ ok: z.literal(true) }), 'DELETE', `webhook-registrations/${encodeURIComponent(id)}`);
  }
}

async function wait(input: { server: ServerContext; job: JobType; timeout: number }) {
  const client = new DataClient(input.server);
  const end = Date.now() + input.timeout * 1_000;
  const next = async (job: JobType): Promise<JobType> => {
    if (job.state === 'succeeded') return job;
    if (job.state === 'failed') {
      if (!job.error) throw new Error('Failed Veritly data job response is missing an error');
      throw new Error(job.error);
    }
    if (job.state === 'cancelled') throw new Error('Veritly data job was cancelled');
    if (Date.now() >= end) throw new Error(`Veritly data job ${job.id} did not finish before the timeout`);
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    return await next(await client.job(job.id));
  };
  return await next(input.job);
}

function limit(value: number | undefined) {
  const parsed = value === undefined ? 100 : value;
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1_000) throw new Error('Limit must be an integer from 1 to 1000');
  return parsed;
}

function timeout(value: number | undefined) {
  const parsed = value === undefined ? 60 : value;
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 900) throw new Error('Timeout must be an integer from 1 to 900 seconds');
  return parsed;
}

function url(base: string, path: string) {
  const root = base.endsWith('/') ? base : `${base}/`;
  return new URL(`v1/veritly/worker/data/${path}`, root);
}

export const data = { create: (server: ServerContext) => new DataClient(server), wait, limit, timeout, Cells, Event };

export type TriggerEvent = TriggerEventType;
