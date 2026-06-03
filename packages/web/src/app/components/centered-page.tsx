import { Show, type JSXElement } from 'solid-js';

import { Separator } from '@/components/ui/separator';

export const CenteredPage = (props: {
  title: string;
  description: JSXElement;
  actions?: JSXElement;
  children: JSXElement;
}) => {
  return (
    <div class="w-full max-w-[40rem] mx-auto py-6">
      <div class="flex items-start justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h1 class="text-xl font-medium">{props.title}</h1>
          <div class="text-sm text-muted-foreground">{props.description}</div>
        </div>
        {
          <Show when={props.actions}>
            <div class="shrink-0">{props.actions}</div>
          </Show>
        }
      </div>
      <Separator class="my-4" />
      {props.children}
    </div>
  );
};
