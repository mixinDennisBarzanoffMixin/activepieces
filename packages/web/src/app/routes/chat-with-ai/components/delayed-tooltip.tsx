import { splitProps, type ComponentProps } from 'solid-js';

import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';

export function DelayedTooltip(
  props: ComponentProps<typeof Tooltip> & {
    delayDuration?: number;
  },
) {
  const [local, tooltip] = splitProps(props, ['delayDuration', 'children']);

  return (
    <TooltipProvider delayDuration={local.delayDuration ?? 400}>
      <Tooltip data-slot="tooltip" {...tooltip}>
        {local.children}
      </Tooltip>
    </TooltipProvider>
  );
}
