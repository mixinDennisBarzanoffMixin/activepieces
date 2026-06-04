import { Property, type PropertyContext } from '@activepieces/pieces-framework';
import type { Project } from '@activepieces/shared';
import { sheets, workbooks } from './client';
import type { Identity, Props, Scoped } from './types';

type Ctx = Pick<PropertyContext, 'project'> & {
  server?: PropertyContext['server'];
};

export const sheet = {
  workbook_id: Property.Dropdown<string>({
    auth: undefined,
    displayName: 'Workbook',
    description: 'The Veritly workbook to read or update.',
    required: true,
    refreshers: [],
    async options(_props, ctx) {
      const list = (await workbooks(await identity(ctx))).workbooks;
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
      const list = (await sheets({ ...(await identity(ctx)), workbook_id: book })).sheets;
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

export async function scoped(ctx: Ctx, props: Props): Promise<Scoped> {
  return {
    ...(await identity(ctx)),
    ...props,
  };
}

async function identity(ctx: Ctx): Promise<Identity> {
  const ext = await ctx.project.externalId();
  if (!ext) throw new Error('Activepieces project is missing Veritly external id');
  const prefix = 'veritly:project:';
  if (!ext.startsWith(prefix)) throw new Error(`Unexpected Activepieces project external id: ${ext}`);
  const projectId = ext.slice(prefix.length);
  if (!projectId) throw new Error('Veritly project id is empty');
  const project = await worker(ctx);
  const meta = project.metadata;
  if (!record(meta)) throw new Error('Activepieces project metadata is missing');
  const veritly = meta['veritly'];
  if (!record(veritly)) throw new Error('Activepieces project Veritly metadata is missing');
  const userId = veritly['creatorUserId'];
  if (typeof userId !== 'string' || !userId) throw new Error('Activepieces project Veritly user id is missing');
  return { userId, projectId };
}

async function worker(ctx: Ctx): Promise<Project> {
  if (!ctx.server) throw new Error('Activepieces server context is required');
  const root = ctx.server.apiUrl.endsWith('/') ? ctx.server.apiUrl : `${ctx.server.apiUrl}/`;
  const res = await fetch(new URL('v1/worker/project', root), {
    headers: {
      Authorization: `Bearer ${ctx.server.token}`,
    },
  });
  if (!res.ok) throw new Error(`Failed to load Activepieces project: ${res.status}`);
  return await res.json() as Project;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
