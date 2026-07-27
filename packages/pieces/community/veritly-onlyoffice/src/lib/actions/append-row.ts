import { createAction, Property } from '@activepieces/pieces-framework';
import { append } from '../common/client';
import { scoped, sheet } from '../common/props';

export const appendRow = createAction({
  name: 'append_row',
  displayName: 'Append Row',
  description: 'Append a row to a Veritly ONLYOFFICE sheet.',
  props: {
    ...sheet,
    values: Property.Json({
      displayName: 'Values',
      description: 'Row values as a JSON array.',
      required: true,
      defaultValue: ['processed'],
    }),
  },
  async run(context) {
    console.log('[veritly-onlyoffice] append_row input', {
      workbook: context.propsValue.workbook_id,
      sheet: context.propsValue.sheet_id,
      values: context.propsValue.values,
    });
    const out = await append(context.server, { ...(await scoped(context, context.propsValue)), values: context.propsValue.values });
    console.log('[veritly-onlyoffice] append_row output', out);
    return out;
  },
});
