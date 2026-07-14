import { IframeCodec } from '@veritly/iframe';
import { describe, expect, it } from 'vitest';

import { ActivepiecesWorkspaceDriver } from './veritly-workspace-driver';

const codec = new IframeCodec();
const open = codec.open('activepieces:test', 1, 'flows/test.auto', {
  flowId: 'flow',
  projectId: 'project',
  path: 'flows/test.auto',
  name: 'Test',
});

describe('ActivepiecesWorkspaceDriver', () => {
  it('publishes current state and waits for save registration', async () => {
    const driver = new ActivepiecesWorkspaceDriver();
    const states: (typeof open | undefined)[] = [];
    const stop = driver.subscribe(() => states.push(driver.current()));
    let loaded = false;
    const pending = driver.open(open).then(() => {
      loaded = true;
    });
    await Promise.resolve();
    expect(loaded).toBe(false);
    let saved = false;
    driver.register(open, async () => {
      saved = true;
    });
    await pending;
    await driver.flush(codec.flush(open.frame, 2, open.path));
    expect(saved).toBe(true);
    expect(states).toEqual([undefined, open]);
    stop();
    driver.dispose();
  });

  it('does not register a stale editor', async () => {
    const driver = new ActivepiecesWorkspaceDriver();
    const first = driver.open(open);
    const next = codec.open(open.frame, 2, 'flows/next.auto', {
      ...open.payload,
      flowId: 'next',
      path: 'flows/next.auto',
    });
    const second = driver.open(next);
    await expect(first).rejects.toThrow('was replaced');
    driver.register(open, async () => {});
    await expect(
      driver.flush(codec.flush(open.frame, 3, next.path)),
    ).rejects.toThrow('no flush handler');
    driver.register(next, async () => {});
    await second;
    driver.dispose();
  });
});
