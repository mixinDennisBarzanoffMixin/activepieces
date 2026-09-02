import { afterEach, describe, expect, it, vi } from 'vitest';
import { envelope } from './webhook';

const event = 'office_event_12345678-1234-1234-1234-123456789abc';
const now = 1_800_000_000_000;

afterEach(() => vi.useRealTimers());

describe('Office managed webhook envelope', () => {
  it('preserves the exact raw bytes and singleton signed headers', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(envelope(payload('{"event":"row_changed"}'))).toEqual({
      eventId: event,
      timestamp: String(now),
      signature: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb=',
      bodyBase64: 'eyJldmVudCI6InJvd19jaGFuZ2VkIn0=',
    });
  });

  it.each([
    'x-veritly-event-id',
    'idempotency-key',
    'x-veritly-webhook-timestamp',
    'x-veritly-webhook-signature',
  ])('rejects a duplicate %s header', (name) => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const input = payload('{}');
    input.rawHeaders.push(name, input.headers[name]);
    expect(() => envelope(input)).toThrow(`exactly one ${name}`);
  });

  it('rejects a stale delivery before forwarding it', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now + 24 * 60 * 60 * 1_000 + 1);
    expect(() => envelope(payload('{}'))).toThrow('timestamp');
  });

  it('rejects an oversized raw body before base64 expansion', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(() => envelope(payload('x'.repeat(65_537)))).toThrow('65536');
  });
});

function payload(raw: string) {
  const headers = {
    'idempotency-key': event,
    'x-veritly-event-id': event,
    'x-veritly-webhook-signature': 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb=',
    'x-veritly-webhook-timestamp': String(now),
  };
  return {
    body: { ignored: true },
    rawBody: raw,
    rawHeaders: Object.entries(headers).flat(),
    headers,
    queryParams: {},
  };
}
