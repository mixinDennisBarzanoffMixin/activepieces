import { Check, Copy } from 'lucide-solid';
import { createSignal, JSX, Show } from 'solid-js';

import { cn } from '@/lib/utils';

type CopyIconButtonProps = {
  textToCopy: string;
  className?: string;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

export function CopyIconButton(props: CopyIconButtonProps) {
  const { textToCopy, className, ref, ...rest } = props;
  const [copied, setCopied] = createSignal(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard not available
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      onClick={(event) => {
        rest.onClick?.(event);
        if (!event.defaultPrevented) handleCopy();
      }}
      className={cn(
        'flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      <Show when={copied} fallback={<Copy class="h-3.5 w-3.5" />}>
        <Check class="h-3.5 w-3.5" />
      </Show>
    </button>
  );
}
