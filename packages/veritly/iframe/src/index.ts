const types = {
  open: 'veritly.iframe.open',
  flush: 'veritly.iframe.flush',
  invoke: 'veritly.iframe.invoke',
  ready: 'veritly.iframe.ready',
  loaded: 'veritly.iframe.loaded',
  flushed: 'veritly.iframe.flushed',
  result: 'veritly.iframe.result',
  error: 'veritly.iframe.error',
} as const;

export type IframeOpen<T = unknown> = {
  type: typeof types.open;
  frame: string;
  request: number;
  path: string;
  payload: T;
};

export type IframeFlush = {
  type: typeof types.flush;
  frame: string;
  request: number;
  path: string;
};

export type IframeInvoke<T = unknown> = {
  type: typeof types.invoke;
  frame: string;
  request: number;
  path: string;
  method: string;
  payload: T;
};

export type IframeReady = {
  type: typeof types.ready;
  frame: string;
  methods: ('open' | 'flush' | 'invoke')[];
  events: ['loaded'];
};

export type IframeLoaded = {
  type: typeof types.loaded;
  frame: string;
  request: number;
  path: string;
};

export type IframeFlushed = {
  type: typeof types.flushed;
  frame: string;
  request: number;
  path: string;
};

export type IframeResult<T = unknown> = {
  type: typeof types.result;
  frame: string;
  request: number;
  path: string;
  value: T;
};

export type IframeFailure = {
  type: typeof types.error;
  frame: string;
  request: number;
  error: string;
};

export type IframeParentMessage<T = unknown> =
  | IframeOpen<T>
  | IframeFlush
  | IframeInvoke;
export type IframeChildMessage<T = unknown> =
  | IframeReady
  | IframeLoaded
  | IframeFlushed
  | IframeResult<T>
  | IframeFailure;
export type IframeMessage = IframeParentMessage | IframeChildMessage;
export type IframeKind = keyof typeof types;

export class IframeProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IframeProtocolError';
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function base(value: Record<string, unknown>) {
  if (typeof value.frame !== 'string' || !value.frame) {
    throw new IframeProtocolError('Iframe message has no frame');
  }
  if (
    typeof value.request !== 'number' ||
    !Number.isSafeInteger(value.request)
  ) {
    throw new IframeProtocolError('Iframe message has no numeric request');
  }
}

function path(value: Record<string, unknown>) {
  if (typeof value.path !== 'string' || !value.path) {
    throw new IframeProtocolError('Iframe message has no path');
  }
}

export class IframeCodec {
  protocol(value: unknown) {
    return (
      record(value) &&
      typeof value.type === 'string' &&
      value.type.startsWith('veritly.iframe.')
    );
  }

  kind(value: IframeMessage): IframeKind {
    const match = Object.entries(types).find(([, type]) => type === value.type);
    if (!match)
      throw new IframeProtocolError(`Unknown iframe message ${value.type}`);
    return match[0] as IframeKind;
  }

  isOpen<T>(value: IframeParentMessage<T>): value is IframeOpen<T> {
    return value.type === types.open;
  }

  isInvoke(value: IframeParentMessage): value is IframeInvoke {
    return value.type === types.invoke;
  }

  isReady(value: IframeChildMessage): value is IframeReady {
    return value.type === types.ready;
  }

  isLoaded(value: IframeChildMessage): value is IframeLoaded {
    return value.type === types.loaded;
  }

  isFlushed(value: IframeChildMessage): value is IframeFlushed {
    return value.type === types.flushed;
  }

  isResult<T>(value: IframeChildMessage<T>): value is IframeResult<T> {
    return value.type === types.result;
  }

  open<T>(
    frame: string,
    request: number,
    path: string,
    payload: T,
  ): IframeOpen<T> {
    return { type: types.open, frame, request, path, payload };
  }

  flush(frame: string, request: number, path: string): IframeFlush {
    return { type: types.flush, frame, request, path };
  }

  invoke<T>(
    frame: string,
    request: number,
    path: string,
    method: string,
    payload: T,
  ): IframeInvoke<T> {
    return { type: types.invoke, frame, request, path, method, payload };
  }

  ready(frame: string, invoke = false): IframeReady {
    return {
      type: types.ready,
      frame,
      methods: invoke ? ['open', 'flush', 'invoke'] : ['open', 'flush'],
      events: ['loaded'],
    };
  }

  loaded(frame: string, request: number, path: string): IframeLoaded {
    return { type: types.loaded, frame, request, path };
  }

  flushed(frame: string, request: number, path: string): IframeFlushed {
    return { type: types.flushed, frame, request, path };
  }

  result<T>(
    frame: string,
    request: number,
    path: string,
    value: T,
  ): IframeResult<T> {
    return { type: types.result, frame, request, path, value };
  }

  failure(frame: string, request: number, error: string): IframeFailure {
    return { type: types.error, frame, request, error };
  }

  parent<T = unknown>(value: unknown): IframeParentMessage<T> {
    if (!record(value))
      throw new IframeProtocolError('Iframe parent message is not an object');
    if (
      value.type !== types.open &&
      value.type !== types.flush &&
      value.type !== types.invoke
    ) {
      throw new IframeProtocolError(
        `Unknown iframe parent message ${String(value.type)}`,
      );
    }
    base(value);
    path(value);
    if (value.type === types.open && !('payload' in value)) {
      throw new IframeProtocolError('Iframe open message has no payload');
    }
    if (value.type === types.invoke) {
      if (typeof value.method !== 'string' || !value.method) {
        throw new IframeProtocolError('Iframe invoke message has no method');
      }
      if (!('payload' in value)) {
        throw new IframeProtocolError('Iframe invoke message has no payload');
      }
    }
    return value as IframeParentMessage<T>;
  }

  child<T = unknown>(value: unknown): IframeChildMessage<T> {
    if (!record(value))
      throw new IframeProtocolError('Iframe child message is not an object');
    if (typeof value.frame !== 'string' || !value.frame) {
      throw new IframeProtocolError('Iframe message has no frame');
    }
    if (value.type === types.ready) {
      if (
        !Array.isArray(value.methods) ||
        !value.methods.includes('open') ||
        !value.methods.includes('flush')
      ) {
        throw new IframeProtocolError(
          'Iframe child does not implement open and flush',
        );
      }
      if (!Array.isArray(value.events) || !value.events.includes('loaded')) {
        throw new IframeProtocolError('Iframe child does not implement loaded');
      }
      return value as IframeReady;
    }
    if (
      value.type !== types.loaded &&
      value.type !== types.flushed &&
      value.type !== types.result &&
      value.type !== types.error
    ) {
      throw new IframeProtocolError(
        `Unknown iframe child message ${String(value.type)}`,
      );
    }
    base(value);
    if (value.type === types.error) {
      if (typeof value.error !== 'string' || !value.error) {
        throw new IframeProtocolError('Iframe error message has no error');
      }
      return value as IframeFailure;
    }
    path(value);
    if (value.type === types.result && !('value' in value)) {
      throw new IframeProtocolError('Iframe result message has no value');
    }
    return value as IframeLoaded | IframeFlushed | IframeResult<T>;
  }
}

export interface IframeChildDriver<T> {
  open(message: IframeOpen<T>): Promise<void>;
  flush(message: IframeFlush): Promise<void>;
  invoke?(message: IframeInvoke): Promise<unknown>;
}

export type IframeChildOptions<T> = {
  frame: string;
  origin: string;
  driver: IframeChildDriver<T>;
  window: Window;
};

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export class IframeChildBridge<T> {
  readonly #codec = new IframeCodec();
  readonly #frame: string;
  readonly #origin: string;
  readonly #driver: IframeChildDriver<T>;
  readonly #window: Window;
  #active: IframeOpen<T> | undefined;
  #started = false;

  constructor(options: IframeChildOptions<T>) {
    this.#frame = options.frame;
    this.#origin = options.origin;
    this.#driver = options.driver;
    this.#window = options.window;
    console.info('[veritly-iframe:child]', 'created', {
      frame: this.#frame,
      origin: this.#origin,
    });
  }

  start() {
    if (this.#started)
      throw new Error(`Iframe bridge ${this.#frame} is already started`);
    this.#started = true;
    console.info('[veritly-iframe:child]', 'starting', {
      frame: this.#frame,
      origin: this.#origin,
      invoke: Boolean(this.#driver.invoke),
    });
    this.#window.addEventListener('message', this.#receive);
    this.#post(this.#codec.ready(this.#frame, Boolean(this.#driver.invoke)));
  }

  dispose() {
    if (!this.#started) return;
    console.info('[veritly-iframe:child]', 'disposing', {
      frame: this.#frame,
      active: this.#active?.path,
      request: this.#active?.request,
    });
    this.#window.removeEventListener('message', this.#receive);
    this.#active = undefined;
    this.#started = false;
  }

  #receive = (event: MessageEvent) => {
    if (event.source !== this.#window.parent) return;
    console.info('[veritly-iframe:child]', 'postMessage received', {
      frame: this.#frame,
      origin: event.origin,
      expected: this.#origin,
      data: event.data,
    });
    if (event.origin !== this.#origin) {
      console.error(
        '[veritly-iframe:child]',
        'postMessage rejected',
        new IframeProtocolError(
          `Rejected iframe parent origin ${event.origin}`,
        ),
      );
      return;
    }
    try {
      const data = this.#codec.parent<T>(event.data);
      console.info('[veritly-iframe:child]', 'postMessage decoded', {
        frame: this.#frame,
        type: data.type,
        request: data.request,
        path: data.path,
        method: this.#codec.isInvoke(data) ? data.method : undefined,
      });
      if (data.frame !== this.#frame)
        throw new IframeProtocolError('Received a request for another iframe');
      if (this.#codec.isOpen(data)) {
        void this.#open(data);
        return;
      }
      if (this.#codec.isInvoke(data)) {
        void this.#invoke(data);
        return;
      }
      void this.#flush(data);
    } catch (error) {
      console.error('[veritly-iframe:child]', 'postMessage failed', {
        frame: this.#frame,
        error,
        data: event.data,
      });
    }
  };

  async #open(data: IframeOpen<T>) {
    console.info('[veritly-iframe:child]', 'open started', {
      frame: this.#frame,
      request: data.request,
      path: data.path,
      payload: data.payload,
    });
    this.#active = data;
    try {
      await this.#driver.open(data);
      if (this.#active?.request !== data.request) {
        console.info('[veritly-iframe:child]', 'open completed but was replaced', {
          frame: this.#frame,
          request: data.request,
          path: data.path,
          active: this.#active?.request,
        });
        return;
      }
      console.info('[veritly-iframe:child]', 'open driver ready', {
        frame: this.#frame,
        request: data.request,
        path: data.path,
      });
      this.#post(this.#codec.loaded(this.#frame, data.request, data.path));
    } catch (error) {
      if (this.#active?.request !== data.request) {
        console.error('[veritly-iframe:child]', 'replaced open failed', {
          frame: this.#frame,
          request: data.request,
          path: data.path,
          error,
        });
        return;
      }
      this.#error(data.request, error);
    }
  }

  async #flush(data: IframeFlush) {
    console.info('[veritly-iframe:child]', 'flush started', {
      frame: this.#frame,
      request: data.request,
      path: data.path,
      active: this.#active?.path,
    });
    try {
      if (data.path !== this.#active?.path)
        throw new Error(`Cannot flush inactive file ${data.path}`);
      await this.#driver.flush(data);
      console.info('[veritly-iframe:child]', 'flush driver completed', {
        frame: this.#frame,
        request: data.request,
        path: data.path,
      });
      this.#post(this.#codec.flushed(this.#frame, data.request, data.path));
    } catch (error) {
      this.#error(data.request, error);
    }
  }

  async #invoke(data: IframeInvoke) {
    console.info('[veritly-iframe:child]', 'invoke started', {
      frame: this.#frame,
      request: data.request,
      path: data.path,
      method: data.method,
      payload: data.payload,
      active: this.#active?.path,
    });
    try {
      if (data.path !== this.#active?.path) {
        throw new Error(
          `Cannot invoke ${data.method} on inactive file ${data.path}`,
        );
      }
      if (!this.#driver.invoke) {
        throw new Error(`Iframe ${this.#frame} does not implement invoke`);
      }
      const value = await this.#driver.invoke(data);
      console.info('[veritly-iframe:child]', 'invoke driver completed', {
        frame: this.#frame,
        request: data.request,
        path: data.path,
        method: data.method,
        result:
          value instanceof Blob
            ? { type: value.type, size: value.size }
            : value,
      });
      this.#post(
        this.#codec.result(
          this.#frame,
          data.request,
          data.path,
          value,
        ),
      );
    } catch (error) {
      this.#error(data.request, error);
    }
  }

  #error(request: number, error: unknown) {
    console.error('[veritly-iframe:child]', 'operation failed', {
      frame: this.#frame,
      request,
      active: this.#active?.path,
      error,
    });
    this.#post(this.#codec.failure(this.#frame, request, message(error)));
  }

  #post(data: IframeChildMessage) {
    console.info('[veritly-iframe:child]', 'postMessage sending', {
      frame: this.#frame,
      origin: this.#origin,
      data,
    });
    this.#window.parent.postMessage(data, this.#origin);
  }
}
