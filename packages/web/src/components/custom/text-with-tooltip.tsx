import { createSignal, createEffect } from 'solid-js';

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
export const TextWithTooltip = ({
  tooltipMessage,
  children,
}: TextWithTooltipProps) => {
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

  const childWithRef = () => {
    const child = children as any;
    return {
      ...child,
      props: {
        ...child.props,
        ref: (el: HTMLDivElement) => {
          textRef = el;
        },
        class: cn('truncate', child.props?.class),
      },
    };
  };

  if (!isTruncated()) {
    return childWithRef();
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{childWithRef()}</TooltipTrigger>
        <TooltipContent class="max-w-md wrap-break-word whitespace-normal">
          <p>{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
