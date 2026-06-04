import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
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
    id: 'row_12',
    index: 12,
    updatedAt: '2026-06-04T00:00:00.000Z',
    hash: 'row-hash',
    values: {
      name: 'Dennis',
      status: 'new',
    },
  },
  async test(context) {
    return newest((await rows(await scoped(context, context.propsValue))).rows).slice(0, 5);
  },
  async onEnable(context) {
    await context.store.put(
      key,
      (await rows(await scoped(context, context.propsValue))).rows.map((item) => item.id)
    );
  },
  async onDisable(context) {
    await context.store.delete(key);
  },
  async run(context) {
    const seen = await context.store.get<string[]>(key);
    if (!seen) throw new Error('Seen row state is missing');
    const list = newest((await rows(await scoped(context, context.propsValue))).rows);
    await context.store.put(
      key,
      list.map((item) => item.id)
    );
    return list.filter((item) => !seen.includes(item.id));
  },
});
