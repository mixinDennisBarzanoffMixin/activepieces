import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { data } from './client';
import { props } from './props';

export const listPreps = createAction({
  name: 'list_preps',
  displayName: 'List Preparations',
  description: 'List the project data preparations visible to this Veritly project.',
  props: {},
  async run(context) {
    return await data.create(context.server).preps();
  },
});

export const listDatasets = createAction({
  name: 'list_datasets',
  displayName: 'List Datasets',
  description: 'List published and native row-level datasets visible to this Veritly project.',
  props: {},
  async run(context) {
    return await data.create(context.server).datasets();
  },
});

export const listRows = createAction({
  name: 'list_rows',
  displayName: 'List Rows',
  description: 'Read one cursor page of rows. A workflow can never request more than 1,000 rows at once.',
  props: {
    dataset_id: props.dataset,
    cursor: Property.ShortText({ displayName: 'Cursor', required: false }),
    limit: Property.Number({ displayName: 'Limit', required: true, defaultValue: 100 }),
  },
  async run(context) {
    return await data
      .create(context.server)
      .rows(id(context.propsValue.dataset_id), context.propsValue.cursor, data.limit(context.propsValue.limit));
  },
});

export const insertRow = createAction({
  name: 'insert_row',
  displayName: 'Insert Row',
  description: 'Insert one database row through the authenticated project data service.',
  props: {
    dataset_id: props.dataset,
    values: Property.Json({ displayName: 'Values', description: 'Column values as a JSON object.', required: true }),
  },
  async run(context) {
    return await data.create(context.server).insert(id(context.propsValue.dataset_id), {
      values: data.Cells.parse(context.propsValue.values),
    });
  },
});

export const updateRow = createAction({
  name: 'update_row',
  displayName: 'Update Row',
  description: 'Update selected columns when the row still has the expected version.',
  props: {
    dataset_id: props.dataset,
    row_id: Property.ShortText({ displayName: 'Veritly Row ID', required: true }),
    expected_version: props.version,
    values: Property.Json({ displayName: 'Values', description: 'Changed column values as a JSON object.', required: true }),
  },
  async run(context) {
    return await data.create(context.server).edit(id(context.propsValue.dataset_id), id(context.propsValue.row_id), {
      expectedVersion: count(context.propsValue.expected_version),
      values: nonempty(context.propsValue.values),
    });
  },
});

export const deleteRow = createAction({
  name: 'delete_row',
  displayName: 'Delete Row',
  description: 'Delete one database row when it still has the expected version.',
  props: {
    dataset_id: props.dataset,
    row_id: Property.ShortText({ displayName: 'Veritly Row ID', required: true }),
    expected_version: props.version,
  },
  async run(context) {
    return await data.create(context.server).remove(id(context.propsValue.dataset_id), id(context.propsValue.row_id), {
      expectedVersion: count(context.propsValue.expected_version),
    });
  },
});

export const upsertRow = createAction({
  name: 'upsert_row',
  displayName: 'Upsert Row',
  description: 'Insert or update one row using explicit key columns; no SQL is accepted.',
  props: {
    dataset_id: props.dataset,
    keys: Property.Json({ displayName: 'Keys', description: 'Key column values as a JSON object.', required: true }),
    values: Property.Json({ displayName: 'Values', description: 'Row values as a JSON object.', required: true }),
    expected_version: Property.Number({ displayName: 'Expected Version', required: false }),
  },
  async run(context) {
    const version = context.propsValue.expected_version;
    return await data.create(context.server).upsert(id(context.propsValue.dataset_id), {
      keys: nonempty(context.propsValue.keys),
      values: data.Cells.parse(context.propsValue.values),
      ...(version === undefined ? {} : { expectedVersion: count(version) }),
    });
  },
});

export const publish = createAction({
  name: 'publish',
  displayName: 'Publish Preparation',
  description: 'Explicitly publish workbook rows to PostgreSQL and wait for completion.',
  props: {
    prep_id: props.prep,
    expected_version: props.version,
    mode: Property.StaticDropdown<'replace' | 'append' | 'upsert'>({
      displayName: 'Mode',
      required: true,
      defaultValue: 'replace',
      options: {
        options: [
          { label: 'Replace', value: 'replace' },
          { label: 'Append', value: 'append' },
          { label: 'Upsert', value: 'upsert' },
        ],
      },
    }),
    dataset_id: Property.ShortText({ displayName: 'Dataset ID', required: false }),
    keys: Property.Json({ displayName: 'Merge Keys', description: 'Column names as a JSON array.', required: false }),
    overwrite: Property.Checkbox({ displayName: 'Overwrite', required: true, defaultValue: false }),
    timeout_seconds: props.timeout,
  },
  async run(context) {
    const keys = names(context.propsValue.keys);
    const dataset = context.propsValue.dataset_id;
    const job = await data.create(context.server).publish(id(context.propsValue.prep_id), {
      expectedVersion: revision(context.propsValue.expected_version),
      mode: mode(context.propsValue.mode),
      overwrite: context.propsValue.overwrite,
      ...(dataset ? { dataset } : {}),
      ...(keys ? { keys } : {}),
    });
    return await data.wait({ server: context.server, job, timeout: data.timeout(context.propsValue.timeout_seconds) });
  },
});

export const writeback = createAction({
  name: 'writeback',
  displayName: 'Write Back Preparation',
  description: 'Explicitly write database-owned row changes to a new immutable workbook revision and wait.',
  props: { prep_id: props.prep, expected_version: props.version, timeout_seconds: props.timeout },
  async run(context) {
    const job = await data.create(context.server).writeback(id(context.propsValue.prep_id), {
      expectedVersion: revision(context.propsValue.expected_version),
    });
    return await data.wait({ server: context.server, job, timeout: data.timeout(context.propsValue.timeout_seconds) });
  },
});

export const reconcile = createAction({
  name: 'reconcile',
  displayName: 'Reconcile Preparation',
  description: 'Explicitly run three-way row reconciliation and wait for completion or a conflict failure.',
  props: { prep_id: props.prep, expected_version: props.version, timeout_seconds: props.timeout },
  async run(context) {
    const job = await data.create(context.server).reconcile(id(context.propsValue.prep_id), {
      expectedVersion: revision(context.propsValue.expected_version),
    });
    return await data.wait({ server: context.server, job, timeout: data.timeout(context.propsValue.timeout_seconds) });
  },
});

function count(value: number) {
  return z.number().int().nonnegative().parse(value);
}

function id(value: string | undefined) {
  if (!value) throw new Error('Resource ID is required');
  return value;
}

function revision(value: number) {
  return z.number().int().positive().parse(value);
}

function nonempty(value: unknown) {
  return data.Cells.refine((item) => Object.keys(item).length > 0).parse(value);
}

function names(value: unknown) {
  if (value === undefined || value === null) return;
  return z.array(z.string().trim().min(1)).min(1).parse(value);
}

function mode(value: 'replace' | 'append' | 'upsert' | undefined) {
  if (!value) throw new Error('Publication mode is required');
  return value;
}
