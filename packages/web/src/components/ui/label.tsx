import { Show, splitProps, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

type LabelProps = JSX.IntrinsicElements['label'] & {
  className?: string;
  showRequiredIndicator?: boolean;
};

function RequiredFieldAsterisk() {
  return <span class="text-destructive">*</span>;
}

function Label(props: LabelProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'showRequiredIndicator',
    'children',
  ]);

  return (
    <label
      data-slot="label"
      class={cn(
        'flex items-center gap-1 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        local.class,
        local.className,
      )}
      {...rest}
    >
      {local.children}
      <Show when={local.showRequiredIndicator}>
        <RequiredFieldAsterisk />
      </Show>
    </label>
  );
}

export { Label, RequiredFieldAsterisk };
export type { LabelProps };
