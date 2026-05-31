import { createSignal } from 'solid-js';

type ApErrorDialogParams = {
  title: string;
  description: any;
  error: unknown;
};
const [params, setParams] = createSignal<ApErrorDialogParams | null>(null);

export const useApErrorDialogStore = () => ({
  params: params(),
  openDialog: setParams,
  closeDialog: () => setParams(null),
});
