import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { accept, register, registration, unregister } from '../common/client';
import { sheet } from '../common/props';
import { envelope } from '../common/webhook';

const key = 'veritly-office-new-row-webhook';
const sample = {
  index: 12,
  hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  values: ['Dennis', 'new'],
};

export const newRowAdded = createTrigger({
  name: 'new_row_added',
  displayName: 'New Row Added',
  description: 'Triggers when a new row is added to a Veritly spreadsheet.',
  props: sheet,
  type: TriggerStrategy.WEBHOOK,
  sampleData: sample,
  async test() {
    return [sample];
  },
  async onEnable(context) {
    const file = context.propsValue.workbook_id;
    const sheet = context.propsValue.sheet_id;
    if (!file) throw new Error('Workbook ID is required');
    if (!sheet) throw new Error('Sheet ID is required');
    const value = await register({
      server: context.server,
      value: {
        endpoint: context.webhookUrl,
        event: 'new_row_added',
        fileId: file,
        sheetId: sheet,
        flowId: context.flows.current.id,
        flowVersionId: context.flows.current.version.id,
        trigger: context.step.name,
      },
    });
    await context.store.put(key, value);
  },
  async onDisable(context) {
    const input = await context.store.get<unknown>(key);
    if (input !== null) {
      const value = registration(input);
      await unregister({
        server: context.server,
        value,
      });
    }
    await context.store.delete(key);
  },
  async run(context) {
    const input = await context.store.get<unknown>(key);
    if (input === null) throw new Error('Office webhook registration is missing');
    await accept({
      server: context.server,
      registration: registration(input),
      delivery: envelope(context.payload),
    });
    return [];
  },
});
