import { createTrigger, type ServerContext, TriggerStrategy } from '@activepieces/pieces-framework';
import { rows } from '../common/client';
import { scoped, sheet } from '../common/props';
import type { Row } from '../common/types';

const key = 'veritly-univer-seen-rows';

function newest(list: Row[]) {
  return list.slice().sort((a: Row, b: Row) => b.index - a.index);
}

export const newRowAdded = createTrigger({
  name: 'new_row_added',
  displayName: 'New Row Added',
  description: 'Triggers when a new row is added to a Veritly Univer sheet.',
  props: sheet,
  type: TriggerStrategy.POLLING,
  sampleData: {
    index: 12,
    hash: 'row-hash',
    values: ['Dennis', 'new'],
  },
  async test(context) {
    return newest((await rows(server(context), await scoped(context, context.propsValue))).rows).slice(0, 5);
  },
  async onEnable(context) {
    const props = await scoped(context, context.propsValue);
    const list = (await rows(server(context), props)).rows;
    console.log('[veritly-univer] new_row_added onEnable', {
      workbook: props.workbook_id,
      sheet: props.sheet_id,
      rows: list.length,
      first: list[0],
    });
    await context.store.put(
      key,
      list.map((item) => item.index)
    );
  },
  async onDisable(context) {
    await context.store.delete(key);
  },
  async run(context) {
    const seen = await context.store.get<number[]>(key);
    if (!seen) throw new Error('Seen row state is missing');
    const props = await scoped(context, context.propsValue);
    const list = newest((await rows(server(context), props)).rows);
    await context.store.put(
      key,
      list.map((item) => item.index)
    );
    const out = list.filter((item) => !seen.includes(item.index));
    console.log('[veritly-univer] new_row_added run', {
      workbook: props.workbook_id,
      sheet: props.sheet_id,
      seen: seen.length,
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
