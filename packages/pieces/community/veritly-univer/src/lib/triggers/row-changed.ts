import { createTrigger, type ServerContext, TriggerStrategy } from '@activepieces/pieces-framework';
import { rows } from '../common/client';
import { scoped, sheet } from '../common/props';
import { snap, type Row, type Snap } from '../common/types';

const key = 'veritly-univer-row-hashes';

function changed(list: Row[], old: Snap) {
  return list
    .filter((item) => old[String(item.index)] !== undefined && old[String(item.index)] !== item.hash)
    .map((item) => ({
      ...item,
      previousHash: old[String(item.index)],
    }));
}

export const rowChanged = createTrigger({
  name: 'row_changed',
  displayName: 'Row Changed',
  description: 'Triggers when an existing Veritly Univer row changes.',
  props: sheet,
  type: TriggerStrategy.POLLING,
  sampleData: {
    index: 12,
    hash: 'next-row-hash',
    previousHash: 'previous-row-hash',
    values: ['Dennis', 'processed'],
  },
  async test(context) {
    return (await rows(server(context), await scoped(context, context.propsValue))).rows.slice(0, 5);
  },
  async onEnable(context) {
    const list = (await rows(server(context), await scoped(context, context.propsValue))).rows;
    console.log('[veritly-univer] row_changed onEnable', {
      rows: list.length,
      first: list[0],
    });
    await context.store.put(key, snap(list));
  },
  async onDisable(context) {
    await context.store.delete(key);
  },
  async run(context) {
    const old = await context.store.get<Snap>(key);
    if (!old) throw new Error('Row hash state is missing');
    const list = (await rows(server(context), await scoped(context, context.propsValue))).rows;
    await context.store.put(key, snap(list));
    const out = changed(list, old);
    console.log('[veritly-univer] row_changed run', {
      old: Object.keys(old).length,
      rows: list.length,
      first: list[0],
      out: out.length,
      event: out[0],
    });
    return out;
  },
});

function server(ctx: unknown): ServerContext {
  const raw = ctx as { server?: ServerContext };
  if (!raw.server) throw new Error('Activepieces server context is required');
  return raw.server;
}
