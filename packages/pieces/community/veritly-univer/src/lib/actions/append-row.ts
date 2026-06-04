import { createAction, Property } from '@activepieces/pieces-framework';
import { append } from '../common/client';
import { scoped, sheet } from '../common/props';

export const appendRow = createAction({
  name: 'append_row',
  displayName: 'Append Row',
  description: 'Append a row to a Veritly Univer sheet.',
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
    return await append({ ...(await scoped(context, context.propsValue)), values: context.propsValue.values });
  },
});
