import { isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown, Loader2, Pause, XCircle } from 'lucide-solid';
import { createMemo, createSignal, Match, Show, Switch } from 'solid-js';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AnyToolPart,
  ToolStatus,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { motion } from '@/lib/solid-motion-adapter';
import { cn } from '@/lib/utils';

function StatusIcon(props: { status: ToolStatus }) {
  return (
    <Switch>
      <Match when={props.status === 'running'}>
        <Loader2 class="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
      </Match>
      <Match when={props.status === 'completed'}>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          class="shrink-0 flex items-center justify-center"
        >
          <Check class="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        </motion.span>
      </Match>
      <Match when={props.status === 'failed'}>
        <XCircle class="h-3.5 w-3.5 text-red-500 shrink-0" />
      </Match>
      <Match when={props.status === 'stopped'}>
        <Pause class="h-3.5 w-3.5 text-muted-foreground shrink-0 fill-current" />
      </Match>
    </Switch>
  );
}

export function ToolCallCard(props: { toolPart: AnyToolPart }) {
  const status = createMemo(() =>
    chatPartUtils.deriveToolStatus(props.toolPart),
  );
  const output = createMemo(() =>
    chatPartUtils.extractToolOutputText(props.toolPart),
  );
  const input = createMemo(() =>
    isObject(props.toolPart.input) ? props.toolPart.input : undefined,
  );
  const display = createMemo(() =>
    chatUtils.formatToolLabel({ part: props.toolPart }),
  );
  const hasInput = createMemo(() =>
    Boolean(input() && Object.keys(input()).length),
  );
  const hasOutput = createMemo(() => Boolean(output()));
  const hasContent = createMemo(() => hasInput() || hasOutput());
  const [open, setOpen] = createSignal(false);

  return (
    <Show
      when={hasContent()}
      fallback={
        <div class="flex items-center gap-2 py-0.5 text-xs text-muted-foreground">
          <StatusIcon status={status()} />
          <span>{display()}</span>
        </div>
      }
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger class="flex w-full items-center gap-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <StatusIcon status={status()} />
          <span class="flex-1 text-left">{display()}</span>
          <ChevronDown
            class={cn('h-3 w-3 transition-transform', open() && 'rotate-180')}
          />
        </CollapsibleTrigger>
        <CollapsibleContent class="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <div class="ml-5 mt-1 mb-1 space-y-1.5 rounded-md bg-muted/40 p-2.5 text-xs">
            <Show when={input()} keyed>
              <div>
                <p class="text-muted-foreground font-medium mb-0.5">
                  {t('Input')}
                </p>
                <pre class="font-mono whitespace-pre-wrap break-words text-foreground/80">
                  {JSON.stringify(input(), null, 2)}
                </pre>
              </div>
            </Show>
            <Show when={hasOutput()}>
              <div>
                <p class="text-muted-foreground font-medium mb-0.5">
                  {t('Output')}
                </p>
                <pre class="font-mono whitespace-pre-wrap break-words text-foreground/80 max-h-48 overflow-auto">
                  {output()}
                </pre>
              </div>
            </Show>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Show>
  );
}
