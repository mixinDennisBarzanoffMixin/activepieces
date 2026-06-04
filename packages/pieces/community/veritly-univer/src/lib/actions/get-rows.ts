import { createAction } from '@activepieces/pieces-framework';
import { rows } from '../common/client';
import { sheet } from '../common/props';

export const getRows = createAction({
  name: 'get_rows',
  displayName: 'Get Rows',
  description: 'Return rows from a Veritly Univer sheet.',
  props: sheet,
  async run(context) {
    return await rows(context.propsValue);
  },
});
