// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { ActivepiecesSave } from './veritly-save';

class Store {
  #saving = true;
  #watch: ((state: { saving: boolean }) => void) | undefined;

  getState() {
    return { saving: this.#saving };
  }

  subscribe(watch: (state: { saving: boolean }) => void) {
    this.#watch = watch;
    return () => {
      this.#watch = undefined;
    };
  }

  finish() {
    this.#saving = false;
    this.#watch?.(this.getState());
  }
}

describe('ActivepiecesSave', () => {
  it('finishes from the builder save event without polling', async () => {
    const store = new Store();
    const pending = new ActivepiecesSave(store).flush();
    await new Promise<void>((done) => setTimeout(done, 0));
    store.finish();
    await expect(pending).resolves.toBeUndefined();
  });
});
