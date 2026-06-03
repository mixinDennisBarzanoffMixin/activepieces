import { Check, Copy } from 'lucide-solid';
import { createSignal, JSX, Show, splitProps } from 'solid-js';

import { cn } from '@/lib/utils';

type CopyIconButtonProps = {
  textToCopy: string;
  className?: string;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

export function CopyIconButton(props: CopyIconButtonProps) {
  const [local, rest] = splitProps(props, ['textToCopy', 'className', 'ref']);
  const [copied, setCopied] = createSignal(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(local.textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard not available
    }
  };

  return (
    <button
      ref={local.ref}
      type="button"
      {...rest}
      onClick={(event) => {
        rest.onClick?.(event);
        if (!event.defaultPrevented) void handleCopy();
      }}
      class={cn(
        'flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        local.className,
      )}
    >
      <Show when={copied} fallback={<Copy class="h-3.5 w-3.5" />}>
        <Check class="h-3.5 w-3.5" />
      </Show>
    </button>
  );
}
