import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';

import { CopyButton } from './copy-button';

const CopyTextTooltip = (props: {
  text: string;
  title: string;
  children: any;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{props.children}</TooltipTrigger>
      <TooltipContent>
        <div class="flex text-xs gap-2 items-center">
          {props.title}: {props.text || '-'}{' '}
          <CopyButton
            withoutTooltip={true}
            variant="ghost"
            class="hover:text-background"
            textToCopy={props.text || ''}
          />
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export { CopyTextTooltip };
