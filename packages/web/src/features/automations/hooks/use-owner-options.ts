import { ProjectMemberWithUser } from '@activepieces/shared';
import { createMemo, type JSX } from 'solid-js';
import { createComponent } from 'solid-js/web';

import { UserAvatar } from '@/components/custom/user-avatar';
import { projectMembersHooks } from '@/features/members/hooks/project-members-hooks';
import { userHooks } from '@/hooks/user-hooks';

function avatarIcon(name: string, email: string, imageUrl?: string | null) {
  return createComponent(UserAvatar, {
    name,
    email,
    imageUrl,
    size: 20,
    disableTooltip: true,
  });
}

export function useOwnerOptions() {
  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const { data: currentUser } = userHooks.useCurrentUser();

  const options = createMemo<OwnerOption[]>(() => {
    const items: OwnerOption[] = [];
    const seenIds = new Set<string>();

    if (currentUser) {
      const name = `${currentUser.firstName} ${currentUser.lastName}`;
      items.push({
        value: currentUser.id,
        label: name,
        icon: avatarIcon(name, currentUser.email, currentUser.imageUrl),
      });
      seenIds.add(currentUser.id);
    }

    for (const member of members(projectMembers)) {
      if (!seenIds.has(member.userId)) {
        const name = `${member.user.firstName} ${member.user.lastName}`;
        items.push({
          value: member.userId,
          label: name,
          icon: avatarIcon(name, member.user.email, member.user.imageUrl),
        });
        seenIds.add(member.userId);
      }
    }

    return items;
  });

  return options;
}

function members(value: ProjectMemberWithUser[] | undefined) {
  return value ?? [];
}

type OwnerOption = {
  value: string;
  label: string;
  icon: JSX.Element;
};
