export const embedded = (): HTMLElement | undefined => {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const host = document.querySelector<HTMLElement>(
    '[data-veritly-activepieces-editor]',
  );
  const shadow = host?.shadowRoot?.querySelector<HTMLElement>(
    '.veritly-automation-editor',
  );
  if (shadow) return shadow;
  const root = document.querySelector<HTMLElement>('.veritly-automation-editor');
  if (root) return root;
  return undefined;
};
