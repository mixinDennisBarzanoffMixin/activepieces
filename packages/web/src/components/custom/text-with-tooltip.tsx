import { createSignal, createEffect, Show, type JSX } from 'solid-js';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TextWithTooltipProps {
  tooltipMessage: string;
  children: JSX.Element;
}
export const TextWithTooltip = (props: TextWithTooltipProps) => {
  let textRef: HTMLDivElement | undefined;
  const [isTruncated, setIsTruncated] = createSignal(false);

  const checkTruncation = () => {
    if (textRef) {
      setIsTruncated(textRef.scrollWidth > textRef.clientWidth);
    }
  };

  createEffect(() => {
    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  });

  const child = () => (
    <div
      ref={(el) => {
        textRef = el;
      }}
      class={cn('truncate')}
    >
      {props.children}
    </div>
  );

  return (
    <Show when={isTruncated()} fallback={child()}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{child()}</TooltipTrigger>
          <TooltipContent class="max-w-md wrap-break-word whitespace-normal">
            <p>{props.tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Show>
  );
};
