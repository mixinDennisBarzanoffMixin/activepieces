import { createTrigger, type ServerContext, TriggerStrategy } from '@activepieces/pieces-framework';
import { rows } from '../common/client';
import { scoped, sheet } from '../common/props';
import { snap, type Row, type Snap } from '../common/types';

const key = 'veritly-univer-row-hashes';

function changed(list: Row[], old: Snap) {
  return list
    .filter((item) => old[item.id] !== undefined && old[item.id] !== item.hash)
    .map((item) => ({
      ...item,
      previousHash: old[item.id],
    }));
}

export const rowChanged = createTrigger({
  name: 'row_changed',
  displayName: 'Row Changed',
  description: 'Triggers when an existing Veritly Univer row changes.',
  props: sheet,
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'row_12',
    index: 12,
    updatedAt: '2026-06-04T00:00:00.000Z',
    hash: 'next-row-hash',
    previousHash: 'previous-row-hash',
    values: {
      name: 'Dennis',
      status: 'processed',
    },
  },
  async test(context) {
    return (await rows(server(context), await scoped(context, context.propsValue))).rows.slice(0, 5);
  },
  async onEnable(context) {
    await context.store.put(key, snap((await rows(server(context), await scoped(context, context.propsValue))).rows));
  },
  async onDisable(context) {
    await context.store.delete(key);
  },
  async run(context) {
    const old = await context.store.get<Snap>(key);
    if (!old) throw new Error('Row hash state is missing');
    const list = (await rows(server(context), await scoped(context, context.propsValue))).rows;
    await context.store.put(key, snap(list));
    return changed(list, old);
  },
});

function server(ctx: unknown): ServerContext {
  const raw = ctx as { server?: ServerContext };
  if (!raw.server) throw new Error('Activepieces server context is required');
  return raw.server;
}
