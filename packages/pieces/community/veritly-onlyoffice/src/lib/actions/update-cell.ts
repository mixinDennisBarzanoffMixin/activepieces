import { createAction, Property } from '@activepieces/pieces-framework';
import { update } from '../common/client';
import { scoped, sheet } from '../common/props';

export const updateCell = createAction({
  name: 'update_cell',
  displayName: 'Update Cell',
  description: 'Update one cell in a Veritly spreadsheet.',
  props: {
    ...sheet,
    row_index: Property.Number({
      displayName: 'Row Index',
      description: 'Zero-based spreadsheet row index.',
      required: true,
    }),
    column_index: Property.Number({
      displayName: 'Column Index',
      description: 'Zero-based spreadsheet column index.',
      required: true,
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'Value to write into the cell.',
      required: true,
    }),
  },
  async run(context) {
    return await update(context.server, {
      ...(await scoped(context, context.propsValue)),
      row_index: context.propsValue.row_index,
      column_index: context.propsValue.column_index,
      value: context.propsValue.value,
    });
  },
});
