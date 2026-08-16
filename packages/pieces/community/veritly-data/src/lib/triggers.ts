import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { data, type TriggerEvent } from './client';
import { props } from './props';

export const rowCreated = trigger({
  event: 'row.created',
  name: 'row_created',
  display: 'Row Created',
  description: 'Triggers after a project database row is created.',
  sample: { id: 'event_1', kind: 'row', action: 'created', resource: 'dataset_1', row: '724822c2-e0a5-4a4f-998f-3f890e55c11b', version: 0, created: 1 },
});

export const rowUpdated = trigger({
  event: 'row.updated',
  name: 'row_updated',
  display: 'Row Updated',
  description: 'Triggers after a project database row is updated.',
  sample: { id: 'event_2', kind: 'row', action: 'updated', resource: 'dataset_1', row: '724822c2-e0a5-4a4f-998f-3f890e55c11b', version: 2, created: 2 },
});

export const rowDeleted = trigger({
  event: 'row.deleted',
  name: 'row_deleted',
  display: 'Row Deleted',
  description: 'Triggers after a project database row is deleted.',
  sample: { id: 'event_3', kind: 'row', action: 'deleted', resource: 'dataset_1', row: '724822c2-e0a5-4a4f-998f-3f890e55c11b', created: 3 },
});

export const publicationCompleted = trigger({
  event: 'publication.completed',
  name: 'publication_completed',
  display: 'Publication Completed',
  description: 'Triggers after an explicit project data publication succeeds.',
  sample: { id: 'event_4', kind: 'job', action: 'completed', job: 'publish', resource: 'job_1', prep: 'prep_1', created: 4 },
});

export const publicationFailed = trigger({
  event: 'publication.failed',
  name: 'publication_failed',
  display: 'Publication Failed',
  description: 'Triggers after an explicit project data publication fails.',
  sample: { id: 'event_5', kind: 'job', action: 'failed', job: 'publish', resource: 'job_2', prep: 'prep_1', created: 5 },
});

export const reconciliationConflictCreated = trigger({
  event: 'reconciliation.conflict_created',
  name: 'reconciliation_conflict_created',
  display: 'Reconciliation Conflict Created',
  description: 'Triggers when explicit reconciliation creates a row-level discrepancy.',
  sample: { id: 'event_6', kind: 'issue', action: 'created', code: 'sync_conflict', resource: 'issue_1', prep: 'prep_1', created: 6 },
});

export const reconciliationConflictResolved = trigger({
  event: 'reconciliation.conflict_resolved',
  name: 'reconciliation_conflict_resolved',
  display: 'Reconciliation Conflict Resolved',
  description: 'Triggers when a row-level reconciliation discrepancy is resolved.',
  sample: { id: 'event_7', kind: 'issue', action: 'resolved', code: 'sync_conflict', resource: 'issue_1', prep: 'prep_1', created: 7 },
});

function trigger(input: Config) {
  const key = `veritly-data-${input.event}`;
  return createTrigger({
    name: input.name,
    displayName: input.display,
    description: input.description,
    props: { resource_id: props.resource },
    type: TriggerStrategy.WEBHOOK,
    sampleData: input.sample,
    async test() {
      return [];
    },
    async onEnable(context) {
      const hook = await data
        .create(server(context))
        .register(input.event, context.webhookUrl, context.propsValue.resource_id);
      await context.store.put(key, hook.id);
    },
    async onDisable(context) {
      const id = await context.store.get<string>(key);
      if (id) await data.create(server(context)).unregister(id);
      await context.store.delete(key);
    },
    async run(context) {
      const body = data.Event.parse(context.payload.body);
      if (topic(body) !== input.event) throw new Error(`Unexpected Veritly data event for ${input.event}`);
      return [body];
    },
  });
}

const Server = z.object({
  server: z.object({
    apiUrl: z.string().url(),
    publicUrl: z.string().url(),
    token: z.string().min(1),
  }),
});

function server(value: unknown) {
  return Server.parse(value).server;
}

function topic(event: ReturnType<typeof data.Event.parse>): TriggerEvent | undefined {
  if (event.kind === 'row') return `row.${event.action}`;
  if (event.kind === 'job' && event.job === 'publish') return `publication.${event.action}`;
  if (event.kind === 'issue' && event.code === 'sync_conflict') {
    return event.action === 'created' ? 'reconciliation.conflict_created' : 'reconciliation.conflict_resolved';
  }
  return;
}

type Config = {
  event: TriggerEvent;
  name: string;
  display: string;
  description: string;
  sample: Record<string, unknown>;
};
