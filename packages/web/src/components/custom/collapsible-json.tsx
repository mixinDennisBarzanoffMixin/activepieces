import { ChevronDown, ChevronRight } from 'lucide-solid';
import { createMemo, createSignal, mergeProps, Show, type JSX } from 'solid-js';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { cn } from '@/lib/utils';

export function CollapsibleJson(_props: CollapsibleJsonProps) {
  const props = mergeProps({ defaultOpen: false, className: '' }, _props);
  const [isOpen, setIsOpen] = createSignal(props.defaultOpen);
  const toggleVisibility = () => setIsOpen(!isOpen());

  const json = createMemo(() =>
    typeof props.json === 'string'
      ? props.json
      : JSON.stringify(props.json, null, 2),
  );

  return (
    <div class={cn('flex flex-col gap-2', props.className)}>
      <button
        onClick={toggleVisibility}
        class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Show when={isOpen()} fallback={<ChevronRight class="h-4 w-4" />}>
          <ChevronDown class="h-4 w-4" />
        </Show>
        {props.label}
      </button>

      <Show when={isOpen()}>
        <div class="flex flex-col gap-2 min-w-0">
          <div class="relative min-w-0">
            <pre class="bg-muted/50 whitespace-pre-wrap break-all rounded-md px-4 py-4 text-xs overflow-x-auto max-w-full">
              <code>{json()}</code>
            </pre>
            <div class="absolute top-2 right-2">
              <CopyButton textToCopy={json()} />
            </div>
          </div>
          <Show when={props.description}>
            <p class="text-xs text-muted-foreground">{props.description}</p>
          </Show>
        </div>
      </Show>
    </div>
  );
}

type CollapsibleJsonProps = {
  json: unknown;
  label: JSX.Element;
  description?: string;
  defaultOpen?: boolean;
  className?: string;
};
