import { ProjectMemberWithUser, ProjectRole } from '@activepieces/shared';
import { A as Link } from '@solidjs/router';
import { t } from 'i18next';
import { Loader2, Users } from 'lucide-solid';
import { Show } from 'solid-js';

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/custom/item';
import { UserAvatar } from '@/components/custom/user-avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import { projectRoleQueries } from '@/features/platform-admin';

export const ProjectRoleUsersSheet = (props: ProjectRoleUsersSheetProps) => {
  const { data, isLoading } = projectRoleQueries.useProjectRoleMembers(
    props.projectRole?.id,
    props.isOpen && props.projectRole !== null,
  );

  const users = data?.data ?? [];

  return (
    <Sheet open={props.isOpen} onOpenChange={props.onOpenChange}>
      <SheetContent class="w-[600px] sm:max-w-[600px] flex flex-col p-0">
        <SheetHeader class="px-6 py-4 border-b shrink-0">
          <SheetTitle class="text-base">
            {props.projectRole?.name} {t('Role')} {t('Users')}
          </SheetTitle>
          <SheetDescription>
            {t('View the users assigned to this role')}
          </SheetDescription>
        </SheetHeader>
        <div class="flex-1 overflow-hidden">
          <Show
            when={isLoading}
            fallback={
              <Show
                when={users.length === 0}
                fallback={
                  <VirtualizedScrollArea
                    items={users}
                    estimateSize={() => 64}
                    getItemKey={(index) => users[index].id}
                    renderItem={(member) => renderUserItem(member)}
                  />
                }
              >
                <div class="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <Users class="size-14" />
                  <p class="text-sm font-medium">{t('No users found')}</p>
                  <p class="text-xs">
                    {t('Start by assigning users to this role')}
                  </p>
                </div>
              </Show>
            }
          >
            <div class="flex items-center justify-center h-full">
              <Loader2 class="size-8 animate-spin text-muted-foreground" />
            </div>
          </Show>
        </div>
      </SheetContent>
    </Sheet>
  );
};

function renderUserItem(member: ProjectMemberWithUser) {
  const { user, project } = member;
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <Item size="sm">
      <UserAvatar
        name={fullName}
        email={user.email}
        imageUrl={user.imageUrl}
        size={36}
        disableTooltip
      />
      <ItemContent>
        <ItemTitle>{fullName}</ItemTitle>
        <ItemDescription>
          {user.email}
          {' · '}
          <Link href={`/projects/${project.id}/settings/team`}>
            {project.displayName}
          </Link>
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}

type ProjectRoleUsersSheetProps = {
  projectRole: ProjectRole | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};
