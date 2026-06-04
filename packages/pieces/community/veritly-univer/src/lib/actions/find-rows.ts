import { createAction, Property } from '@activepieces/pieces-framework';
import { find } from '../common/client';
import { scoped, sheet } from '../common/props';

export const findRows = createAction({
  name: 'find_rows',
  displayName: 'Find Rows',
  description: 'Find rows whose values contain the query text.',
  props: {
    ...sheet,
    query: Property.ShortText({
      displayName: 'Query',
      required: true,
    }),
  },
  async run(context) {
    return await find({ ...(await scoped(context, context.propsValue)), query: context.propsValue.query });
  },
});
