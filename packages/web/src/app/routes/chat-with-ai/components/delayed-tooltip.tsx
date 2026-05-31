import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';

export function DelayedTooltip({
  delayDuration = 400,
  children,
  ...props
}: ComponentProps<typeof Tooltip> & {
  delayDuration?: number;
}) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip data-slot="tooltip" {...props}>
        {children}
      </Tooltip>
    </TooltipProvider>
  );
}
