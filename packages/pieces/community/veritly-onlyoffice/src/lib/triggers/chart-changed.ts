import { createTrigger, type ServerContext, TriggerStrategy } from '@activepieces/pieces-framework';
import { VeritlyOnlyOfficeChartWebhookPayload } from '@veritly/onlyoffice-contract';
import { registerWebhook, unregisterWebhook } from '../common/client';
import { scoped, workbook } from '../common/props';

const key = 'veritly-onlyoffice-chart-change-webhook';

export const chartChanged = createTrigger({
  name: 'chart_changed',
  displayName: 'Chart Changed',
  description: 'Triggers when a chart in a Veritly workbook changes.',
  props: workbook,
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    event: 'chart_changed',
    workbookId: 'workbook-id',
    revision: 2,
    charts: [],
  },
  async test() {
    return [];
  },
  async onEnable(context) {
    const props = await scoped(context, context.propsValue);
    const hook = await registerWebhook(server(context), {
      ...props,
      event: 'chart_changed',
      url: context.webhookUrl,
    });
    await context.store.put(key, hook.id);
  },
  async onDisable(context) {
    const id = await context.store.get<string>(key);
    if (id) await unregisterWebhook(server(context), id);
    await context.store.delete(key);
  },
  async run(context) {
    return [VeritlyOnlyOfficeChartWebhookPayload.parse(context.payload.body)];
  },
});

function server(ctx: unknown): ServerContext {
  const raw = ctx as { server?: ServerContext };
  if (!raw.server) throw new Error('Activepieces server context is required');
  return raw.server;
}
