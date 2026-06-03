import {
  isNil,
  PROJECT_COLOR_PALETTE,
  ProjectIcon,
  ProjectType,
} from '@activepieces/shared';
import { User } from 'lucide-solid';
import { createMemo, mergeProps, useContext, Show } from 'solid-js';

import { Avatar } from '@/components/ui/avatar';
import { SidebarContext } from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

function useSidebarSafe(): string {
  const context = useContext(SidebarContext);
  return context?.state ?? 'expanded';
}

type ApProjectDisplayProps = {
  title: string;
  icon?: ProjectIcon;
  containerClassName?: string;
  titleClassName?: string;
  iconClassName?: string;
  maxLengthToNotShowTooltip?: number;
  projectType: ProjectType;
  inSidebar?: boolean;
};

export const ApProjectDisplay = (_props: ApProjectDisplayProps) => {
  const props = mergeProps(
    {
      containerClassName: '',
      titleClassName: '',
      maxLengthToNotShowTooltip: 30,
      inSidebar: false,
    },
    _props,
  );
  const sidebarState = useSidebarSafe();
  const projectAvatar = createMemo(() =>
    isNil(props.icon) ? null : props.projectType === ProjectType.TEAM ? (
      <Avatar
        class={cn(
          'size-6 flex items-center justify-center rounded-sm',
          props.iconClassName,
        )}
        style={{
          'background-color': PROJECT_COLOR_PALETTE[props.icon.color].color,
          color: PROJECT_COLOR_PALETTE[props.icon.color].textColor,
        }}
      >
        {props.title.charAt(0).toUpperCase()}
      </Avatar>
    ) : (
      <User
        class={cn(
          'size-5 flex items-center justify-center',
          props.iconClassName,
        )}
      />
    ),
  );

  const shouldShowTooltip = createMemo(
    () => props.title.length > props.maxLengthToNotShowTooltip,
  );
  const displayText = createMemo(() =>
    shouldShowTooltip()
      ? `${props.title.substring(0, props.maxLengthToNotShowTooltip)}...`
      : props.title,
  );

  const content = () => (
    <div class={cn('flex items-center gap-2', props.containerClassName)}>
      {projectAvatar()}
      <Show
        when={
          (props.inSidebar && sidebarState === 'expanded') || !props.inSidebar
        }
      >
        <span class={cn(props.titleClassName, 'truncate')}>
          {displayText()}
        </span>
      </Show>
    </div>
  );

  return (
    <Show when={shouldShowTooltip()} fallback={content()}>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{content()}</TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            {props.title}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Show>
  );
};
