import type {
  IframeChildDriver,
  IframeFlush,
  IframeOpen,
} from '@veritly/iframe';
import { BehaviorSubject } from 'rxjs';

import type { VeritlyAutomationEditorProps } from './veritly-editor';

type Save = {
  path: string;
  run: () => Promise<void>;
};

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export class ActivepiecesWorkspaceDriver
  implements IframeChildDriver<VeritlyAutomationEditorProps>
{
  readonly #current = new BehaviorSubject<
    IframeOpen<VeritlyAutomationEditorProps> | undefined
  >(undefined);
  #save: Save | undefined;
  #ready: PromiseWithResolvers<void> | undefined;

  readonly subscribe = (watch: VoidFunction) => {
    const sub = this.#current.subscribe(watch);
    return () => sub.unsubscribe();
  };

  readonly current = () => this.#current.value;

  open(message: IframeOpen<VeritlyAutomationEditorProps>) {
    this.#validate(message.payload);
    this.#ready?.reject(
      new Error(
        `Automation ${this.#current.value?.path} was replaced before it loaded`,
      ),
    );
    this.#ready = Promise.withResolvers<void>();
    this.#save = undefined;
    this.#current.next(message);
    return this.#ready.promise;
  }

  async flush(message: IframeFlush) {
    if (!this.#save || this.#save.path !== message.path) {
      throw new Error(
        `Activepieces editor has no flush handler for ${message.path}`,
      );
    }
    await this.#save.run();
  }

  register(
    message: IframeOpen<VeritlyAutomationEditorProps>,
    run: (() => Promise<void>) | undefined,
  ) {
    if (message.request !== this.#current.value?.request) return;
    if (!run) {
      if (this.#save?.path === message.path) this.#save = undefined;
      return;
    }
    this.#save = { path: message.path, run };
    this.#ready?.resolve();
    this.#ready = undefined;
  }

  dispose() {
    this.#ready?.reject(
      new Error('Activepieces iframe workspace was disposed'),
    );
    this.#ready = undefined;
    this.#save = undefined;
    this.#current.next(undefined);
    this.#current.complete();
  }

  #validate(value: unknown): asserts value is VeritlyAutomationEditorProps {
    if (!record(value)) {
      throw new Error('Activepieces iframe payload is not an object');
    }
    if (typeof value.flowId !== 'string' || !value.flowId) {
      throw new Error('Activepieces iframe payload has no flowId');
    }
    if (typeof value.projectId !== 'string' || !value.projectId) {
      throw new Error('Activepieces iframe payload has no projectId');
    }
    if (typeof value.path !== 'string' || !value.path) {
      throw new Error('Activepieces iframe payload has no path');
    }
    if (value.name !== undefined && typeof value.name !== 'string') {
      throw new Error('Activepieces iframe payload has an invalid name');
    }
  }
}
