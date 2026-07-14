type Store = {
  getState(): { saving: boolean };
  subscribe(watch: (state: { saving: boolean }) => void): VoidFunction;
};

export class ActivepiecesSave {
  constructor(private store: Store) {}

  async flush() {
    if (document.querySelector('[role="dialog"][data-state="open"] form')) {
      throw new Error(
        'Activepieces cannot flush while an unfinished dialog is open',
      );
    }
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    await new Promise<void>((done) => setTimeout(done, 0));
    if (!this.store.getState().saving) return;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        stop();
        reject(new Error('Activepieces could not persist the current flow'));
      }, 4_500);
      const stop = this.store.subscribe((state) => {
        if (state.saving) return;
        clearTimeout(timer);
        stop();
        resolve();
      });
    });
  }
}
