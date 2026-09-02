import { Property } from '@activepieces/pieces-framework';
import { files } from './client';

export const workbook = {
  workbook_id: Property.Dropdown<string>({
    auth: undefined,
    displayName: 'Workbook',
    description: 'The Veritly workbook to read or update.',
    required: true,
    refreshers: [],
    async options(_props, ctx) {
      const list = (await files({ server: ctx.server })).items.filter((item) => item.kind === 'cell');
      return {
        disabled: list.length === 0,
        placeholder: list.length === 0 ? 'No Veritly workbooks found' : 'Select a workbook',
        options: list.map((item) => ({
          label: item.path,
          value: item.id,
        })),
      };
    },
  }),
};

export const sheet = {
  ...workbook,
  sheet_id: Property.ShortText({
    displayName: 'Sheet',
    description: 'The exact worksheet identifier used by the workbook.',
    required: true,
  }),
};

export const document = {
  document_id: Property.Dropdown<string>({
    auth: undefined,
    displayName: 'Document',
    description: 'The live Veritly document or presentation to export.',
    required: true,
    refreshers: [],
    async options(_props, ctx) {
      const list = (await files({ server: ctx.server })).items.filter((item) => item.kind !== 'cell');
      return {
        disabled: list.length === 0,
        placeholder: list.length === 0 ? 'No Veritly documents or presentations found' : 'Select a file',
        options: list.map((item) => ({
          label: item.path,
          value: item.id,
        })),
      };
    },
  }),
};
