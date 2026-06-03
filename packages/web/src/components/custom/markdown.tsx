import { MarkdownVariant } from '@activepieces/shared';
import { Info, AlertTriangle, Lightbulb } from 'lucide-solid';
import { marked } from 'marked';
import { createEffect, Show, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

import { Alert, AlertDescription } from '../ui/alert';

function applyVariables(markdown: string, variables: Record<string, string>) {
  if (typeof markdown !== 'string') {
    return '';
  }
  let result = markdown.split('<br>').join('\n');
  result = result.replace(/\{\{(.*?)\}\}/g, (_match, variableName: string) => {
    return variables[variableName] ?? '';
  });
  return result;
}

type MarkdownProps = {
  markdown: string | undefined;
  variables?: Record<string, string>;
  variant?: MarkdownVariant;
  className?: string;
  loading?: string;
};

const Container = (props: {
  variant?: MarkdownVariant;
  children: JSX.Element;
}) => {
  return (
    <Alert
      class={cn('rounded-md border', {
        'dark:bg-amber-950 bg-amber-50  border-none dark:text-amber-600 text-amber-700':
          props.variant === MarkdownVariant.WARNING,
        'bg-success-100 text-success-300 border-none':
          props.variant === MarkdownVariant.TIP,
        'p-0 bg-transparent border-none':
          props.variant === MarkdownVariant.BORDERLESS,
      })}
    >
      <Show when={props.variant !== MarkdownVariant.BORDERLESS}>
        <>
          <Show
            when={
              props.variant === MarkdownVariant.INFO ||
              props.variant === undefined
            }
          >
            <Info class="w-4 h-4 mt-1" />
          </Show>
          <Show when={props.variant === MarkdownVariant.WARNING}>
            <AlertTriangle class="w-4 h-4 mt-1 stroke-amber-700" />
          </Show>
          <Show when={props.variant === MarkdownVariant.TIP}>
            <Lightbulb class="w-4 h-4 mt-1" />
          </Show>
        </>
      </Show>
      <AlertDescription class="grow w-full">{props.children}</AlertDescription>
    </Alert>
  );
};

const ApMarkdown = (props: MarkdownProps) => {
  let el: HTMLDivElement | undefined;

  if (props.loading && props.loading.length > 0) {
    return (
      <Container variant={props.variant}>
        <div class="flex items-center gap-2">{props.loading}</div>
      </Container>
    );
  }

  if (!props.markdown) {
    return null;
  }

  const html = () => {
    if (!props.markdown) {
      return '';
    }
    return marked.parse(
      applyVariables(props.markdown, props.variables ?? {}).trim(),
      { async: false },
    );
  };

  createEffect(() => {
    if (el) {
      el.innerHTML = html();
    }
  });

  return (
    <Container variant={props.variant}>
      <div
        class={cn('grow w-full', props.className)}
        ref={(node) => {
          el = node;
        }}
      />
    </Container>
  );
};

export { ApMarkdown };
