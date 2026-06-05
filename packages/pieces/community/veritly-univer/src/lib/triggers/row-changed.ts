import { createTrigger, type ServerContext, TriggerStrategy } from '@activepieces/pieces-framework';
import { VeritlyUniverWebhookPayload } from '@veritly/univer-contract';
import { registerWebhook, rows, unregisterWebhook } from '../common/client';
import { scoped, sheet } from '../common/props';
import type { Row } from '../common/types';

const key = 'veritly-univer-row-change-webhook';

export const rowChanged = createTrigger({
  name: 'row_changed',
  displayName: 'Row Changed',
  description: 'Triggers when an existing Veritly Univer row changes.',
  props: sheet,
  type: TriggerStrategy.WEBHOOK,
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
    const props = await scoped(context, context.propsValue);
    const hook = await registerWebhook(server(context), {
      ...props,
      event: 'row_changed',
      url: context.webhookUrl,
    });
    console.log('[veritly-univer] row_changed webhook registered', {
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
    console.log('[veritly-univer] row_changed webhook payload', {
      type: typeof context.payload.body,
    });
    const body = VeritlyUniverWebhookPayload.parse(context.payload.body);
    console.log('[veritly-univer] row_changed webhook', body.row);
    return [body.row];
  },
});

function server(ctx: unknown): ServerContext {
  const raw = ctx as { server?: ServerContext };
  if (!raw.server) throw new Error('Activepieces server context is required');
  return raw.server;
}
