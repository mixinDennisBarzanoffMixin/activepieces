import { Show } from 'solid-js';

import { cn } from '@/lib/utils';

type LabelProps = JSX.IntrinsicElements['label'] & {
  showRequiredIndicator?: boolean;
};

function RequiredFieldAsterisk() {
  return <span className="text-destructive">*</span>;
}

function Label({
  className,
  showRequiredIndicator,
  children,
  ...props
}: LabelProps) {
  return (
    <label
      data-slot="label"
      class={cn(
        'flex items-center gap-1 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <Show when={showRequiredIndicator}>
        <RequiredFieldAsterisk />
      </Show>
    </label>
  );
}

export { Label, RequiredFieldAsterisk };
export type { LabelProps };
