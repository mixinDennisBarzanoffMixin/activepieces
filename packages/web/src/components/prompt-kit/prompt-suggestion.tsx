import { VariantProps } from 'class-variance-authority';
import { createMemo, JSX, Match, Show, splitProps, Switch } from 'solid-js';

import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PromptSuggestionProps = {
  children: JSX.Element;
  variant?: VariantProps<typeof buttonVariants>['variant'];
  size?: VariantProps<typeof buttonVariants>['size'];
  className?: string;
  highlight?: string;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

function PromptSuggestion(_props: PromptSuggestionProps) {
  const [local, props] = splitProps(_props, [
    'children',
    'variant',
    'size',
    'className',
    'highlight',
  ]);
  const highlight = createMemo(() => {
    if (local.highlight === undefined) return '';
    return local.highlight.trim();
  });
  const mode = createMemo(() => highlight() !== '');
  const content = createMemo(() =>
    typeof local.children === 'string' ? local.children : '',
  );
  const parts = createMemo(() => {
    const text = content();
    const lower = highlight().toLowerCase();
    const index = text.toLowerCase().indexOf(lower);
    if (index === -1) return;
    const match = text.substring(index, index + lower.length);
    return {
      before: text.substring(0, index),
      match,
      after: text.substring(index + match.length),
    };
  });

  return (
    <Switch>
      <Match when={!mode()}>
        <Button
          variant={local.variant || 'outline'}
          size={local.size || 'lg'}
          class={cn('rounded-full', local.className)}
          {...props}
        >
          {local.children}
        </Button>
      </Match>
      <Match when={!content()}>
        <Button
          variant={local.variant || 'ghost'}
          size={local.size || 'sm'}
          class={cn(
            'w-full cursor-pointer justify-start rounded-xl py-2',
            'hover:bg-accent',
            local.className,
          )}
          {...props}
        >
          {local.children}
        </Button>
      </Match>
      <Match when={true}>
        <Button
          variant={local.variant || 'ghost'}
          size={local.size || 'sm'}
          class={cn(
            'w-full cursor-pointer justify-start gap-0 rounded-xl py-2',
            'hover:bg-accent',
            local.className,
          )}
          {...props}
        >
          <Show
            when={parts()}
            keyed
            fallback={
              <span class="text-muted-foreground whitespace-pre-wrap">
                {content()}
              </span>
            }
          >
            {(part) => (
              <>
                <Show when={part.before}>
                  <span class="text-muted-foreground whitespace-pre-wrap">
                    {part.before}
                  </span>
                </Show>
                <span class="text-primary font-medium whitespace-pre-wrap">
                  {part.match}
                </span>
                <Show when={part.after}>
                  <span class="text-muted-foreground whitespace-pre-wrap">
                    {part.after}
                  </span>
                </Show>
              </>
            )}
          </Show>
        </Button>
      </Match>
    </Switch>
  );
}

export { PromptSuggestion };
