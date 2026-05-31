import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Check, Copy } from 'lucide-solid';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';

import { Button, ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface CopyButtonProps extends ButtonProps {
  textToCopy: string;
  tooltipSide?: any;
  withoutTooltip?: boolean;
  children?: any;
  variant?: 'ghost' | 'outline';
}

export const CopyButton = (
  props: CopyButtonProps & { ref?: HTMLButtonElement },
) => {
  let ref: HTMLButtonElement | undefined;
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

  if (props.withoutTooltip) {
    return (
      <Button
        ref={(el) => (ref = el)}
        variant={props.variant}
        size={'icon'}
        type="button"
        class={props.className}
        onClick={() => copyToClipboard()}
        {...props}
      >
        {isCopied() ? <Check class="h-4 w-4" /> : <Copy class="h-4 w-4" />}
      </Button>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={(el) => (ref = el)}
          variant={props.variant}
          size={'icon'}
          type="button"
          class={props.className}
          onClick={() => copyToClipboard()}
          {...props}
        >
          {isCopied() ? <Check class="h-4 w-4" /> : <Copy class="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={props.tooltipSide}>{t('Copy')}</TooltipContent>
    </Tooltip>
  );
};

CopyButton.displayName = 'CopyButton';
