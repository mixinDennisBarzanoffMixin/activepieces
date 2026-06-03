import {
  ProjectType,
  TeamProjectsLimit,
  ProjectWithLimits,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Plus } from 'lucide-solid';
import { createMemo, JSX, Match, Show, Switch } from 'solid-js';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import { SidebarMenuButton } from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';

import { NewProjectDialog } from './new-project-dialog';

function useIsCreateProjectDisabled({
  projects,
}: {
  projects: Pick<ProjectWithLimits, 'type'>[];
}) {
  const { platform } = platformHooks.useCurrentPlatform();
  if (platform.plan.teamProjectsLimit === TeamProjectsLimit.ONE) {
    const teamProjects = projects.filter(
      (project) => project.type === ProjectType.TEAM,
    );
    return teamProjects.length >= 1;
  }
  return false;
}

function UpgradeTooltip(props: { children: JSX.Element }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{props.children}</TooltipTrigger>
      <TooltipContent class="max-w-[250px]">
        <p class="text-xs mb-1">
          {t('Upgrade your plan to create additional team projects.')}{' '}
          <button
            class="text-xs text-primary underline hover:no-underline"
            onClick={() =>
              window.open('https://www.activepieces.com/pricing', '_blank')
            }
          >
            {t('View Plans')}
          </button>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function IconVariant(props: {
  disabled: boolean;
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  return (
    <Show
      when={props.disabled}
      fallback={
        <NewProjectDialog onCreate={props.onCreate}>
          <Button variant="ghost" size="icon" class="h-6 w-6 hover:bg-accent">
            <Plus />
          </Button>
        </NewProjectDialog>
      }
    >
      <UpgradeTooltip>
        <div>
          <Button variant="ghost" size="icon" disabled class="h-6 w-6">
            <Plus />
          </Button>
        </div>
      </UpgradeTooltip>
    </Show>
  );
}

function FullVariant(props: { disabled: boolean }) {
  return (
    <Show
      when={props.disabled}
      fallback={
        <NewProjectDialog>
          <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm">
            {t('New Project')}
          </AnimatedIconButton>
        </NewProjectDialog>
      }
    >
      <UpgradeTooltip>
        <div>
          <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm" disabled>
            {t('New Project')}
          </AnimatedIconButton>
        </div>
      </UpgradeTooltip>
    </Show>
  );
}

function SidebarMenuVariant(props: {
  disabled: boolean;
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  return (
    <Show
      when={props.disabled}
      fallback={
        <NewProjectDialog onCreate={props.onCreate}>
          <SidebarMenuButton class="text-muted-foreground gap-2">
            <Plus class="size-4" />
            <span>{t('Add team project')}</span>
          </SidebarMenuButton>
        </NewProjectDialog>
      }
    >
      <UpgradeTooltip>
        <SidebarMenuButton disabled class="text-muted-foreground gap-2">
          <Plus class="size-4" />
          <span>{t('Add team project')}</span>
        </SidebarMenuButton>
      </UpgradeTooltip>
    </Show>
  );
}

export function CreateProjectButton(props: {
  variant: 'icon' | 'full' | 'sidebar-menu';
  projects: Pick<ProjectWithLimits, 'type'>[];
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  const disabled = createMemo(() =>
    useIsCreateProjectDisabled({ projects: props.projects }),
  );
  return (
    <Switch>
      <Match when={props.variant === 'icon'}>
        <IconVariant disabled={disabled()} onCreate={props.onCreate} />
      </Match>
      <Match when={props.variant === 'sidebar-menu'}>
        <SidebarMenuVariant disabled={disabled()} onCreate={props.onCreate} />
      </Match>
      <Match when={props.variant === 'full'}>
        <FullVariant disabled={disabled()} />
      </Match>
    </Switch>
  );
}
