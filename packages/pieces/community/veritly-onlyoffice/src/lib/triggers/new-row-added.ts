import { createTrigger, type ServerContext, TriggerStrategy } from '@activepieces/pieces-framework';
import { VeritlyOnlyOfficeWebhookPayload } from '@veritly/onlyoffice-contract';
import { registerWebhook, rows, unregisterWebhook } from '../common/client';
import { scoped, sheet } from '../common/props';
import type { Row } from '../common/types';

const key = 'veritly-onlyoffice-new-row-webhook';

function newest(list: Row[]) {
  return list.slice().sort((a: Row, b: Row) => b.index - a.index);
}

export const newRowAdded = createTrigger({
  name: 'new_row_added',
  displayName: 'New Row Added',
  description: 'Triggers when a new row is added to a Veritly ONLYOFFICE sheet.',
  props: sheet,
  type: TriggerStrategy.WEBHOOK,
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
    const hook = await registerWebhook(server(context), {
      ...props,
      event: 'new_row_added',
      url: context.webhookUrl,
    });
    console.log('[veritly-onlyoffice] new_row_added webhook registered', {
      workbook: props.workbook_id,
      sheet: props.sheet_id,
      id: hook.id,
    });
    await context.store.put(key, hook.id);
  },
  async onDisable(context) {
    const id = await context.store.get<string>(key);
    if (id) await unregisterWebhook(server(context), id);
    await context.store.delete(key);
  },
  async run(context) {
    console.log('[veritly-onlyoffice] new_row_added webhook payload', {
      type: typeof context.payload.body,
    });
    const body = VeritlyOnlyOfficeWebhookPayload.parse(context.payload.body);
    console.log('[veritly-onlyoffice] new_row_added webhook', body.row);
    return [body.row];
  },
});

function server(ctx: unknown): ServerContext {
  const raw = ctx as { server?: ServerContext };
  if (!raw.server) throw new Error('Activepieces server context is required');
  return raw.server;
}
