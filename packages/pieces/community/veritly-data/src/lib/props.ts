import { Property } from '@activepieces/pieces-framework';
import { data } from './client';

const prep = Property.Dropdown<string>({
  auth: undefined,
  displayName: 'Preparation',
  description: 'The project data preparation workflow.',
  required: true,
  refreshers: [],
  async options(_props, ctx) {
    const list = (await data.create(ctx.server).preps()).preps;
    return {
      disabled: list.length === 0,
      placeholder: list.length === 0 ? 'No project data preparations found' : 'Select a preparation',
      options: list.map((item) => ({ label: item.path, value: item.id })),
    };
  },
});

const dataset = Property.Dropdown<string>({
  auth: undefined,
  displayName: 'Dataset',
  description: 'The row-level project dataset.',
  required: true,
  refreshers: [],
  async options(_props, ctx) {
    const list = (await data.create(ctx.server).datasets()).datasets;
    return {
      disabled: list.length === 0,
      placeholder: list.length === 0 ? 'No published project datasets found' : 'Select a dataset',
      options: list.map((item) => ({ label: `${item.schema}.${item.table}`, value: item.id })),
    };
  },
});

const version = Property.Number({
  displayName: 'Expected Version',
  description: 'The version observed by the previous step. Stale writes fail instead of overwriting newer data.',
  required: true,
});

const timeout = Property.Number({
  displayName: 'Timeout (seconds)',
  description: 'How long to wait for the explicit data job to finish, from 1 to 900 seconds.',
  required: true,
  defaultValue: 60,
});

const resource = Property.ShortText({
  displayName: 'Resource ID',
  description: 'Optionally limit the trigger to one dataset or preparation ID.',
  required: false,
});

export const props = { prep, dataset, version, timeout, resource };
