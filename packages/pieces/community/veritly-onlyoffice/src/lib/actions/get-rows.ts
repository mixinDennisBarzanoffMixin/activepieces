import { createAction } from '@activepieces/pieces-framework';
import { rows } from '../common/client';
import { scoped, sheet } from '../common/props';

export const getRows = createAction({
  name: 'get_rows',
  displayName: 'Get Rows',
  description: 'Return rows from a Veritly spreadsheet.',
  props: sheet,
  async run(context) {
    return await rows(context.server, await scoped(context, context.propsValue));
  },
});
