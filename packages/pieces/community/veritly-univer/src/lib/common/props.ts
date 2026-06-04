import { Property } from '@activepieces/pieces-framework';
import { sheets, workbooks } from './client';
import type { Props, Scoped } from './types';

export const sheet = {
  workbook_id: Property.Dropdown<string>({
    auth: undefined,
    displayName: 'Workbook',
    description: 'The Veritly workbook to read or update.',
    required: true,
    refreshers: [],
    async options(_props, ctx) {
      const list = (await workbooks(ctx.server)).workbooks;
      return {
        disabled: list.length === 0,
        placeholder: list.length === 0 ? 'No Veritly workbooks found' : 'Select a workbook',
        options: list.map((item: { id: string; name: string }) => ({
          label: item.name,
          value: item.id,
        })),
      };
    },
  }),
  sheet_id: Property.Dropdown<string>({
    auth: undefined,
    displayName: 'Sheet',
    description: 'The worksheet inside the selected workbook.',
    required: true,
    refreshers: ['workbook_id'],
    async options(props, ctx) {
      const book = props['workbook_id'];
      if (typeof book !== 'string' || !book) {
        return {
          disabled: true,
          placeholder: 'Select a workbook first',
          options: [],
        };
      }
      const list = (await sheets(ctx.server, { workbook_id: book })).sheets;
      return {
        disabled: list.length === 0,
        placeholder: list.length === 0 ? 'No sheets found' : 'Select a sheet',
        options: list.map((item: { id: string; name: string }) => ({
          label: item.name,
          value: item.id,
        })),
      };
    },
  }),
};

export async function scoped(_ctx: unknown, props: Props): Promise<Scoped> {
  return props;
}
