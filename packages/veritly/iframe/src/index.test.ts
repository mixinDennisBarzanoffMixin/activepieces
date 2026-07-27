import { describe, expect, mock, test } from 'bun:test';

import {
  IframeChildBridge,
  IframeCodec,
  IframeProtocolError,
  type IframeChildDriver,
  type IframeFlush,
  type IframeInvoke,
  type IframeOpen,
} from './index';

class Parent {
  readonly messages: unknown[] = [];

  postMessage(data: unknown) {
    this.messages.push(data);
  }
}

class Browser {
  readonly parent = new Parent();
  readonly listeners = new Set<(event: MessageEvent) => void>();

  addEventListener(
    _type: string,
    listener: EventListenerOrEventListenerObject,
  ) {
    this.listeners.add(listener as (event: MessageEvent) => void);
  }

  removeEventListener(
    _type: string,
    listener: EventListenerOrEventListenerObject,
  ) {
    this.listeners.delete(listener as (event: MessageEvent) => void);
  }

  send(
    data: unknown,
    origin = 'https://parent.test',
    source: object = this.parent,
  ) {
    const event = {
      data,
      origin,
      source,
    } as unknown as MessageEvent;
    for (const listener of this.listeners) listener(event);
  }
}

class Driver implements IframeChildDriver<{ id: string }> {
  readonly opened: IframeOpen<{ id: string }>[] = [];
  readonly flushed: IframeFlush[] = [];
  readonly invoked: IframeInvoke[] = [];
  readonly ready = Promise.withResolvers<void>();

  async open(message: IframeOpen<{ id: string }>) {
    this.opened.push(message);
    await this.ready.promise;
  }

  async flush(message: IframeFlush) {
    this.flushed.push(message);
  }

  async invoke(message: IframeInvoke) {
    this.invoked.push(message);
    return new Blob(['snapshot'], { type: 'application/pdf' });
  }
}

class Failing implements IframeChildDriver<{ id: string }> {
  async open() {
    throw new Error('open failed');
  }

  async flush() {
    throw new Error('flush failed');
  }
}

describe('IframeCodec', () => {
  test('rejects incomplete protocol messages', () => {
    const codec = new IframeCodec();
    expect(() => codec.parent(null)).toThrow(IframeProtocolError);
    expect(() =>
      codec.child({
        type: 'veritly.iframe.ready',
        frame: 'test',
        methods: ['open'],
      }),
    ).toThrow('open and flush');
  });
});

describe('IframeChildBridge', () => {
  test('owns ready, loaded, flush, stale requests, and disposal', async () => {
    const browser = new Browser();
    const driver = new Driver();
    const bridge = new IframeChildBridge({
      frame: 'test',
      origin: 'https://parent.test',
      driver,
      window: browser as unknown as Window,
    });
    bridge.start();
    expect(browser.parent.messages[0]).toMatchObject({
      type: 'veritly.iframe.ready',
      frame: 'test',
      methods: ['open', 'flush', 'invoke'],
    });

    browser.send({
      type: 'veritly.iframe.open',
      frame: 'test',
      request: 1,
      path: 'old',
      payload: { id: 'old' },
    });
    browser.send({
      type: 'veritly.iframe.open',
      frame: 'test',
      request: 2,
      path: 'new',
      payload: { id: 'new' },
    });
    driver.ready.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(
      browser.parent.messages.filter(
        (item) =>
          Reflect.get(item as object, 'type') === 'veritly.iframe.loaded',
      ),
    ).toEqual([
      { type: 'veritly.iframe.loaded', frame: 'test', request: 2, path: 'new' },
    ]);

    browser.send({
      type: 'veritly.iframe.flush',
      frame: 'test',
      request: 3,
      path: 'new',
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(driver.flushed).toHaveLength(1);
    expect(browser.parent.messages.at(-1)).toEqual({
      type: 'veritly.iframe.flushed',
      frame: 'test',
      request: 3,
      path: 'new',
    });

    browser.send({
      type: 'veritly.iframe.invoke',
      frame: 'test',
      request: 4,
      path: 'new',
      method: 'download',
      payload: null,
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(driver.invoked).toHaveLength(1);
    expect(browser.parent.messages.at(-1)).toMatchObject({
      type: 'veritly.iframe.result',
      frame: 'test',
      request: 4,
      path: 'new',
      value: expect.any(Blob),
    });

    bridge.dispose();
    expect(browser.listeners.size).toBe(0);
  });

  test('rejects the wrong origin without invoking the driver', () => {
    const browser = new Browser();
    const driver = new Driver();
    const error = console.error;
    console.error = mock(() => {});
    const bridge = new IframeChildBridge({
      frame: 'test',
      origin: 'https://parent.test',
      driver,
      window: browser as unknown as Window,
    });
    bridge.start();
    browser.send({ type: 'veritly.iframe.open' }, 'https://parent.test', {});
    browser.send({ type: 'veritly.iframe.open' }, 'https://wrong.test');
    expect(driver.opened).toHaveLength(0);
    bridge.dispose();
    console.error = error;
  });

  test('reports driver failures and rejects duplicate starts', async () => {
    const browser = new Browser();
    const bridge = new IframeChildBridge({
      frame: 'test',
      origin: 'https://parent.test',
      driver: new Failing(),
      window: browser as unknown as Window,
    });
    bridge.start();
    expect(() => bridge.start()).toThrow('already started');
    browser.send({
      type: 'veritly.iframe.open',
      frame: 'test',
      request: 1,
      path: 'test',
      payload: { id: 'test' },
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(browser.parent.messages.at(-1)).toMatchObject({
      type: 'veritly.iframe.error',
      request: 1,
      error: 'open failed',
    });
    browser.send({
      type: 'veritly.iframe.flush',
      frame: 'test',
      request: 2,
      path: 'test',
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(browser.parent.messages.at(-1)).toMatchObject({
      type: 'veritly.iframe.error',
      request: 2,
      error: 'flush failed',
    });
    bridge.dispose();
  });
});
