import {
  isNil,
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';
import { User } from 'lucide-solid';
import { Show } from 'solid-js';

import { Avatar } from '@/components/ui/avatar';
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar-shadcn';
import { getProjectName } from '@/features/projects';
import { cn } from '@/lib/utils';

const MAX_LENGTH_TO_NOT_SHOW_TOOLTIP = 28;

type ProjectSideBarItemProps = {
  project: ProjectWithLimits;
  isCurrentProject: boolean;
  handleProjectSelect: (projectId: string) => void;
};

const ProjectSideBarItem = (props: ProjectSideBarItemProps) => {
  const { state } = useSidebar();

  const projectName = getProjectName(props.project);

  const projectAvatar = isNil(props.project.icon) ? null : props.project
      .type === ProjectType.TEAM ? (
    <Avatar
      class="size-[18px] text-sm font-bold flex items-center justify-center rounded-[4px]"
      style={{
        'background-color':
          PROJECT_COLOR_PALETTE[props.project.icon.color].color,
        color: PROJECT_COLOR_PALETTE[props.project.icon.color].textColor,
      }}
    >
      <span class="scale-75">{projectName.charAt(0).toUpperCase()}</span>
    </Avatar>
  ) : (
    <User class="size-4 " />
  );

  const shouldShowTooltip = projectName.length > MAX_LENGTH_TO_NOT_SHOW_TOOLTIP;
  const displayText = shouldShowTooltip
    ? `${projectName.substring(0, MAX_LENGTH_TO_NOT_SHOW_TOOLTIP)}...`
    : projectName;
  const isCollapsed = state === 'collapsed';
  return (
    <SidebarMenuButton
      onClick={() => props.handleProjectSelect(props.project.id)}
      class={cn('', {
        'bg-sidebar-accent! ': props.isCurrentProject,
      })}
    >
      {projectAvatar}
      {
        <Show when={!isCollapsed}>
          <span
            class={cn('truncate', {
              'font-semibold': props.isCurrentProject,
            })}
          >
            {displayText}
          </span>
        </Show>
      }
    </SidebarMenuButton>
  );
};

export default ProjectSideBarItem;
