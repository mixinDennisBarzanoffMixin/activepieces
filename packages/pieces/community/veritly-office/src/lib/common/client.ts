import type {
  OfficeAutomationEvent,
  OfficeFilePage,
  OfficeFileRow,
} from '@veritly/contracts';
import { decodeOfficeApiError } from '@veritly/contracts/zod';
import { responses } from '@veritly/contracts/zod';
import type { ServerContext } from '@activepieces/pieces-framework';

export async function files(input: { server: ServerContext }) {
  return await send({
    ...input,
    parse: (value) => responses.OfficeFilePage.parse(value),
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
    method: 'GET',
    path: `documents/${encodeURIComponent(input.id)}/content`,
  });
  if (!res.ok) fail({ status: res.status, body: await res.text() });
  return { data: new Uint8Array(await res.arrayBuffer()), name: file.path };
}

export async function register(input: { server: ServerContext; value: Register }) {
  return await send({
    server: input.server,
    parse: registration,
    method: 'POST',
    path: 'webhook-registrations',
    data: input.value,
  });
}

export async function unregister(input: { server: ServerContext; value: Registration }) {
  const res = await request({
    server: input.server,
    method: 'DELETE',
    path: 'webhook-registrations',
    data: input.value,
  });
  if (!res.ok) fail({ status: res.status, body: await res.text() });
  if (res.status !== 204) throw new Error(`Office unregister returned status ${res.status}`);
}

export async function accept(input: { server: ServerContext; registration: Registration; delivery: Delivery }) {
  const res = await request({
    server: input.server,
    method: 'POST',
    path: 'webhook-events',
    data: { ...input.registration, ...input.delivery },
  });
  if (!res.ok) fail({ status: res.status, body: await res.text() });
  if (res.status !== 202) throw new Error(`Office event acceptance returned status ${res.status}`);
  return accepted(await res.json());
}

export function registration(input: unknown) {
  if (!record(input)) throw new TypeError('Office registration must be an object');
  exact(input, ['destinationId', 'flowId', 'flowVersionId', 'registrationId', 'trigger', 'webhookId']);
  return {
    flowId: field(input, 'flowId'),
    flowVersionId: field(input, 'flowVersionId'),
    trigger: field(input, 'trigger'),
    destinationId: field(input, 'destinationId'),
    registrationId: field(input, 'registrationId'),
    webhookId: field(input, 'webhookId'),
  };
}

function accepted(input: unknown) {
  if (!record(input)) throw new TypeError('Office accepted event must be an object');
  exact(input, ['runId']);
  return { runId: field(input, 'runId') };
}

function exact(input: Record<string, unknown>, keys: string[]) {
  const actual = Object.keys(input).sort();
  if (actual.length !== keys.length || actual.some((key, index) => key !== keys[index])) {
    throw new TypeError('Office response has unknown or missing fields');
  }
}

function field(input: Record<string, unknown>, name: string) {
  const value = input[name];
  if (typeof value !== 'string' || value.length < 1 || value.length > 128) {
    throw new TypeError(`Office registration ${name} is invalid`);
  }
  return value;
}

async function send<T>(input: Call<T>) {
  const res = await request(input);
  if (!res.ok) fail({ status: res.status, body: await res.text() });
  return input.parse(await res.json());
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

function fail(input: { status: number; body: string }): never {
  const local = localError(input.body);
  if (local) throw new OfficeClientError(input.status, local);
  const parsed = decodeOfficeApiError(input.body);
  if (!parsed.known) throw new OfficeClientError(input.status, parsed.code);
  throw new OfficeClientError(input.status, parsed.error.code, parsed.error.request);
}

function localError(body: string) {
  const parsed: unknown = JSON.parse(body);
  if (!record(parsed) || Object.keys(parsed).length !== 1 || typeof parsed.code !== 'string') return;
  const codes = new Set([
    'binding_conflict',
    'binding_invalid',
    'effect_rejected',
    'event_conflict',
    'payload_too_large',
    'request_invalid',
  ]);
  return codes.has(parsed.code) ? parsed.code : undefined;
}

function slash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}

function record(input: unknown): input is Record<string, unknown> {
  return input !== null && typeof input === 'object' && !Array.isArray(input);
}

export class OfficeClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly request?: string,
  ) {
    super(`Office request failed with ${code}/${status}`);
  }
}

type Register = {
  endpoint: string;
  event: OfficeAutomationEvent;
  fileId: string;
  sheetId: string;
  flowId: string;
  flowVersionId: string;
  trigger: string;
};

export type Registration = {
  flowId: string;
  flowVersionId: string;
  trigger: string;
  destinationId: string;
  registrationId: string;
  webhookId: string;
};

type Delivery = {
  eventId: string;
  timestamp: string;
  signature: string;
  bodyBase64: string;
};

export type File = OfficeFileRow;

export type Page = OfficeFilePage;

type Wire = {
  server: ServerContext;
  method: string;
  path: string;
  data?: unknown;
};

type Call<T> = Wire & { parse: (input: unknown) => T };
