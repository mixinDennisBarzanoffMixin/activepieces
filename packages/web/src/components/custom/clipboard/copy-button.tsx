import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Check, Copy } from 'lucide-solid';
import { createSignal, type JSX, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { Button, ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface CopyButtonProps extends ButtonProps {
  textToCopy: string;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  withoutTooltip?: boolean;
  children?: JSX.Element;
  variant?: 'ghost' | 'outline';
}

export const CopyButton = (
  props: CopyButtonProps & { ref?: HTMLButtonElement },
) => {
  const [isCopied, setIsCopied] = createSignal(false);

  const { mutate: copyToClipboard } = createMutation(() => ({
    mutationFn: async () => {
      await navigator.clipboard.writeText(props.textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    },
    onError: () => {
      toast.error(t('Failed to copy to clipboard'), {
        duration: 3000,
      });
    },
  }));

  const button = (
    <Button
      variant={props.variant}
      size={'icon'}
      type="button"
      class={props.className}
      onClick={() => copyToClipboard()}
      {...props}
    >
      <Show when={isCopied()} fallback={<Copy class="h-4 w-4" />}>
        <Check class="h-4 w-4" />
      </Show>
    </Button>
  );

  return (
    <Show when={!props.withoutTooltip} fallback={button}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side={props.tooltipSide}>{t('Copy')}</TooltipContent>
      </Tooltip>
    </Show>
  );
};
