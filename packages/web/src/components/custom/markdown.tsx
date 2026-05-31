import { MarkdownVariant } from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Check, Copy, Info, AlertTriangle, Lightbulb } from 'lucide-solid';
import { marked } from 'marked';
import { createSignal, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { cn } from '@/lib/utils';

import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';

function applyVariables(markdown: string, variables: Record<string, string>) {
  if (typeof markdown !== 'string') {
    return '';
  }
  let result = markdown.split('<br>').join('\n');
  result = result.replace(/\{\{(.*?)\}\}/g, (_, variableName) => {
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

const Container = ({
  variant,
  children,
}: {
  variant?: MarkdownVariant;
  children: any;
}) => {
  return (
    <Alert
      class={cn('rounded-md border', {
        'dark:bg-amber-950 bg-amber-50  border-none dark:text-amber-600 text-amber-700':
          variant === MarkdownVariant.WARNING,
        'bg-success-100 text-success-300 border-none':
          variant === MarkdownVariant.TIP,
        'p-0 bg-transparent border-none':
          variant === MarkdownVariant.BORDERLESS,
      })}
    >
      <Show when={variant !== MarkdownVariant.BORDERLESS}>
        <>
          <Show
            when={variant === MarkdownVariant.INFO || variant === undefined}
          >
            <Info class="w-4 h-4 mt-1" />
          </Show>
          <Show when={variant === MarkdownVariant.WARNING}>
            <AlertTriangle class="w-4 h-4 mt-1 stroke-amber-700" />
          </Show>
          <Show when={variant === MarkdownVariant.TIP}>
            <Lightbulb class="w-4 h-4 mt-1" />
          </Show>
        </>
      </Show>
      <AlertDescription class="grow w-full">{children}</AlertDescription>
    </Alert>
  );
};

const ApMarkdown = ({
  markdown,
  variables,
  variant,
  className,
  loading,
}: MarkdownProps) => {
  const [copiedText, setCopiedText] = createSignal<string | null>(null);

  const { mutate: copyToClipboard } = createMutation(() => ({
    mutationFn: async (text: string) => {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCopiedText(null);
    },
    onError: () => {
      toast.error(t('Failed to copy to clipboard'), {
        duration: 3000,
      });
    },
  }));

  if (loading && loading.length > 0) {
    return (
      <Container variant={variant}>
        <div className="flex items-center gap-2">{loading}</div>
      </Container>
    );
  }

  if (!markdown) {
    return null;
  }

  const markdownProcessed = applyVariables(markdown, variables ?? {});

  return (
    <Container variant={variant}>
      <div
        class={cn('grow w-full', className)}
        innerHTML={marked.parse(markdownProcessed.trim(), { async: false })}
      />
    </Container>
  );
};

ApMarkdown.displayName = 'ApMarkdown';
export { ApMarkdown };
