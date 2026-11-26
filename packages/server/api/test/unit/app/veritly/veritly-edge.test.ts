import { afterEach, describe, expect, it } from 'vitest';
import { authority, edge, webhook } from '../../../../src/app/veritly/veritly-edge';

const saved = process.env.AP_WEBHOOK_URL;
const publicurl = process.env.PUBLIC_BASE_URL;

afterEach(() => {
  if (saved === undefined) delete process.env.AP_WEBHOOK_URL;
  if (saved !== undefined) process.env.AP_WEBHOOK_URL = saved;
  if (publicurl === undefined) delete process.env.PUBLIC_BASE_URL;
  if (publicurl !== undefined) process.env.PUBLIC_BASE_URL = publicurl;
});

describe('edge', () => {
  it('keeps the configured public authority on an internal gateway hop', () => {
    process.env.AP_WEBHOOK_URL = 'http://veritly-gateway.veritly.svc.cluster.local:8080/activepieces';
    process.env.PUBLIC_BASE_URL = 'https://app.example.test';
    expect(edge()).toBe('http://veritly-gateway.veritly.svc.cluster.local:8080');
    expect(authority()).toBe('app.example.test');
  });
  it('refuses an authority with credentials or a path', () => {
    process.env.PUBLIC_BASE_URL = 'https://user@app.example.test';
    expect(() => authority()).toThrow('canonical public origin');
    process.env.PUBLIC_BASE_URL = 'https://app.example.test/private';
    expect(() => authority()).toThrow('canonical public origin');
  });
  it('returns the trusted Edge origin', () => {
    process.env.AP_WEBHOOK_URL = 'https://app.veritly.co.uk/activepieces';
    expect(edge()).toBe('https://app.veritly.co.uk');
    expect(webhook('flow_123')).toBe(
      'https://app.veritly.co.uk/activepieces/api/v1/webhooks/flow_123',
    );
  });

  it('allows the cluster-local Edge origin in local Kubernetes', () => {
    process.env.AP_WEBHOOK_URL =
      'http://veritly-edge.veritly.svc.cluster.local:8080/activepieces';
    expect(edge()).toBe('http://veritly-edge.veritly.svc.cluster.local:8080');
  });

  it.each([
    'http://app.veritly.co.uk/activepieces',
    'https://user@app.veritly.co.uk/activepieces',
    'https://app.veritly.co.uk/activepieces?target=private',
    'https://app.veritly.co.uk/activepieces#private',
    'https://app.veritly.co.uk/not-activepieces',
  ])('rejects a noncanonical callback URL: %s', (url) => {
    process.env.AP_WEBHOOK_URL = url;
    expect(() => edge()).toThrow('canonical Edge');
  });
});
