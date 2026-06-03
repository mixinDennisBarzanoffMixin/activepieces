import { Mutex } from 'async-mutex';

export class PromiseQueue {
  private queue: (() => Promise<unknown>)[] = [];
  private lock: Mutex = new Mutex();
  private halted = false;

  add(promise: () => Promise<unknown>) {
    this.queue.push(promise);
    void this.run();
  }

  halt() {
    this.halted = true;
  }
  size() {
    return this.queue.length;
  }

  private async run() {
    await this.lock.runExclusive(async () => {
      const promise = this.queue.shift()!;
      if (this.halted) {
        return;
      }
      await promise();
    });
  }
}
