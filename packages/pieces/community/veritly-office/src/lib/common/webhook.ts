import type { TriggerPayload } from '@activepieces/shared';

const CAP = 65_536;
const AGE = 24 * 60 * 60 * 1_000;
const FUTURE = 5 * 60 * 1_000;

export function envelope(payload: TriggerPayload) {
  const body = bytes(payload.rawBody);
  if (body.length > CAP) throw new Error('Office webhook body exceeds 65536 bytes');
  const event = header(payload, 'x-veritly-event-id');
  const key = header(payload, 'idempotency-key');
  if (key !== event) throw new Error('Office webhook idempotency key does not match event identifier');
  const timestamp = header(payload, 'x-veritly-webhook-timestamp');
  if (!/^(0|[1-9][0-9]{0,15})$/.test(timestamp)) throw new Error('Invalid Office webhook timestamp');
  const time = Number(timestamp);
  if (!Number.isSafeInteger(time)) throw new Error('Invalid Office webhook timestamp');
  const age = Date.now() - time;
  if (age > AGE || age < -FUTURE) throw new Error('Office webhook timestamp is outside the accepted window');
  return {
    eventId: event,
    timestamp,
    signature: header(payload, 'x-veritly-webhook-signature'),
    bodyBase64: body.toString('base64'),
  };
}

function bytes(input: unknown) {
  if (typeof input === 'string') return Buffer.from(input, 'utf8');
  if (Buffer.isBuffer(input)) return input;
  throw new Error('Office webhook requires the exact raw request body');
}

function header(payload: TriggerPayload, name: string) {
  const raw = payload.rawHeaders;
  if (!raw || raw.length % 2 !== 0) throw new Error('Office webhook raw headers are missing');
  const values = raw.flatMap((value, index) => (
    index % 2 === 0 && value.toLowerCase() === name ? [raw[index + 1]] : []
  ));
  if (values.length !== 1) throw new Error(`Office webhook requires exactly one ${name}`);
  return values[0];
}
