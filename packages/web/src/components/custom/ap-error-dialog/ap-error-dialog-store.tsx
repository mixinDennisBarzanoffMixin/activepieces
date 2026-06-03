import { createSignal, type JSXElement } from 'solid-js';

type ApErrorDialogParams = {
  title: string;
  description: JSXElement;
  error: unknown;
};
const [params, setParams] = createSignal<ApErrorDialogParams | null>(null);

export const useApErrorDialogStore = () => ({
  params,
  openDialog: setParams,
  closeDialog: () => setParams(null),
});
