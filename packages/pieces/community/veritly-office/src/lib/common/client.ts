import type {
  OfficeFilePage,
  OfficeFileRow,
  OfficeWorkerDelivery,
  OfficeWorkerRegister,
  OfficeWorkerRegistration,
} from '@veritly/contracts';
import type { OfficeRouteName, RouteErrorFor } from '@veritly/contracts/client';
import { assertRouteResponse, decodeOfficeRouteError, decodeRouteResponse } from '@veritly/contracts/client';
import { strict } from '@veritly/contracts/zod';
import type { ServerContext } from '@activepieces/pieces-framework';

export async function files(input: { server: ServerContext }) {
  return await send({
    ...input,
    route: 'office_worker_files',
    method: 'GET',
    path: 'files?limit=100',
  });
}

export async function document(input: { server: ServerContext; id: string }) {
  if (!input.id) throw new Error('Document ID is required');
  const file = (await files(input)).items.find((item) => item.id === input.id);
  if (!file) throw new Error('Document not found');
  const res = await request({
    server: input.server,
    route: 'office_worker_document',
    method: 'GET',
    path: `documents/${encodeURIComponent(input.id)}/content`,
  });
  if (!res.ok) fail({ route: 'office_worker_document', status: res.status, body: await res.text() });
  assertRouteResponse('office', 'office_worker_document', res.status);
  return { data: new Uint8Array(await res.arrayBuffer()), name: file.path };
}

export async function register(input: { server: ServerContext; value: Register }) {
  return await send({
    server: input.server,
    route: 'office_worker_register',
    method: 'POST',
    path: 'webhook-registrations',
    data: input.value,
  });
}

export async function unregister(input: { server: ServerContext; value: Registration }) {
  const res = await request({
    server: input.server,
    route: 'office_worker_unregister',
    method: 'DELETE',
    path: 'webhook-registrations',
    data: input.value,
  });
  if (!res.ok) fail({ route: 'office_worker_unregister', status: res.status, body: await res.text() });
  return decodeRouteResponse('office', 'office_worker_unregister', res.status, await res.text());
}

export async function accept(input: { server: ServerContext; registration: Registration; delivery: Delivery }) {
  const res = await request({
    server: input.server,
    route: 'office_worker_event',
    method: 'POST',
    path: 'webhook-events',
    data: { ...input.registration, ...input.delivery },
  });
  if (!res.ok) fail({ route: 'office_worker_event', status: res.status, body: await res.text() });
  return decodeRouteResponse('office', 'office_worker_event', res.status, await res.text());
}

async function send<Name extends OfficeRouteName>(input: Wire & { route: Name }) {
  const res = await request(input);
  if (!res.ok) fail({ route: input.route, status: res.status, body: await res.text() });
  return decodeRouteResponse('office', input.route, res.status, await res.text());
}

async function request(input: Wire) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5_000);
  const headers: Record<string, string> = { authorization: `Bearer ${input.server.token}` };
  if (input.data !== undefined) headers['content-type'] = 'application/json';
  return await fetch(new URL(`v1/veritly/worker/office/${input.path}`, slash(input.server.apiUrl)), {
    method: input.method,
    redirect: 'error',
    headers,
    body: input.data === undefined ? undefined : JSON.stringify(input.data),
    signal: ctrl.signal,
  }).finally(() => clearTimeout(timer));
}

function fail<Name extends OfficeRouteName>(input: Failure<Name>): never {
  throw new OfficeClientError(input.status, decodeOfficeRouteError(input.route, input.status, input.body));
}

function slash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}

export class OfficeClientError<Name extends OfficeRouteName = OfficeRouteName> extends Error {
  constructor(
    readonly status: number,
    readonly detail: RouteErrorFor<'office', Name>,
  ) {
    super(`Office request failed with ${detail.code}/${status}`);
  }
}

type Register = OfficeWorkerRegister;

export type Registration = OfficeWorkerRegistration;

export function registration(input: unknown): Registration {
  return strict.OfficeWorkerRegistration.parse(input);
}

type Delivery = Omit<OfficeWorkerDelivery, keyof OfficeWorkerRegistration>;

export type File = OfficeFileRow;

export type Page = OfficeFilePage;

type Wire = {
  server: ServerContext;
  route: OfficeRouteName;
  method: string;
  path: string;
  data?: unknown;
};

type Failure<Name extends OfficeRouteName> = {
  route: Name;
  status: number;
  body: string;
};
