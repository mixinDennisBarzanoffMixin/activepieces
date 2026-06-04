import { Property } from '@activepieces/pieces-framework';

export const sheet = {
  veritly_user_id: Property.ShortText({
    displayName: 'Veritly User ID',
    description: 'The Veritly user that owns the workbook.',
    required: true,
  }),
  project_id: Property.ShortText({
    displayName: 'Veritly Project ID',
    description: 'The Veritly project that owns the workbook.',
    required: true,
  }),
  workbook_id: Property.ShortText({
    displayName: 'Workbook ID',
    description: 'The Univer workbook/unit ID.',
    required: true,
  }),
  sheet_id: Property.ShortText({
    displayName: 'Sheet ID',
    description: 'The Univer sheet/sub-unit ID.',
    required: true,
  }),
};
