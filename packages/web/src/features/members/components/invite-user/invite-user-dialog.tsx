import {
  ApFlagId,
  InvitationStatus,
  InvitationType,
  Permission,
  PlatformRole,
  ProjectType,
  UserInvitationWithLink,
  isNil,
} from '@activepieces/shared';
import { useLocation } from '@solidjs/router';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { t } from 'i18next';
import { CopyIcon, DownloadIcon } from 'lucide-solid';
import {
  createEffect,
  createMemo,
  createSignal,
  JSX,
  Show,
} from 'solid-js';
import { toast } from 'solid-sonner';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { userInvitationApi } from '@/features/members/api/user-invitation';
import { RoleSelector } from '@/features/members/components/role-selector';
import { projectMembersHooks } from '@/features/members/hooks/project-members-hooks';
import { projectRoleApi } from '@/features/platform-admin/api/project-role-api';
import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { HttpError } from '@/lib/api';
import { formatUtils } from '@/lib/format-utils';

import { userInvitationsHooks } from '../../hooks/user-invitations-hooks';

import { UserSuggestionsPopover } from './user-suggestions-popover';

const buildInvalidEmailsMessage = (emails: string[]): string => {
  const maxShown = 3;
  const shown = emails.slice(0, maxShown);
  const remaining = emails.length - maxShown;
  if (remaining > 0) {
    return t('Fix invalid emails {list} and {count} more', {
      list: shown.join(', '),
      count: remaining,
    });
  }
  if (shown.length === 1) {
    return t('Fix invalid email {email}', { email: shown[0] });
  }
  const last = shown.pop();
  return t('Fix invalid emails {list} and {last}', {
    list: shown.join(', '),
    last,
  });
};

export const InviteUserDialog = ({
  open,
  setOpen,
  onInviteSuccess,
}: {
  open: boolean;
  setOpen: (_open: boolean) => void;
  onInviteSuccess?: () => void;
}) => {
  const { embedState } = useEmbedding();
  const [invitationResults, setInvitationResults] = createSignal<
    UserInvitationWithLink[]
  >([]);
  const [suggestionsOpen, setSuggestionsOpen] = createSignal(false);
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: isSmtpConfigured } = flagsHooks.useFlag<boolean>(
    ApFlagId.SMTP_CONFIGURED
  );
  const { refetch } = userInvitationsHooks.useInvitations();
  const { project } = projectCollectionUtils.useCurrentProject();
  const { checkAccess } = useAuthorization();
  const location = useLocation();
  const isPlatformPage = location.pathname.includes('/platform/');
  const userHasPermissionToInviteUser = checkAccess(
    Permission.WRITE_INVITATION
  );
  const { data: platformUsersData } = platformUserHooks.useUsers();
  const platformUserEmails = new Set(
    platformUsersData?.data.map((u) => u.email.toLowerCase()) ?? []
  );
  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const projectMemberEmails = new Set(
    projectMembers?.map((m) => m.user.email.toLowerCase()) ?? []
  );
  const { data: rolesData, isPending: rolesLoading } = createQuery({
    queryKey: ['project-roles'],
    queryFn: () => projectRoleApi.list(),
    enabled:
      !isNil(platform.plan.projectRolesEnabled) &&
      platform.plan.projectRolesEnabled,
  });

  const defaultValues = () => ({
    emails: [],
    type: isPlatformPage
      ? InvitationType.PLATFORM
      : platform.plan.projectRolesEnabled && project.type === ProjectType.TEAM
      ? InvitationType.PROJECT
      : InvitationType.PLATFORM,
    platformRole: PlatformRole.OPERATOR,
    projectRole: undefined,
  });
  const [form, setForm] = createSignal<FormSchema>(defaultValues());
  const [errors, setErrors] = createSignal<InviteErrors>({});
  const roles = createMemo(() => rolesData?.data ?? []);
  const defaultRole = createMemo(
    () =>
      roles().find((role) => role.name === 'Editor')?.name || roles()[0]?.name
  );
  const invitationType = createMemo(() => form().type);
  const isPlatformInvite = createMemo(
    () => invitationType() === InvitationType.PLATFORM
  );

  createEffect(() => {
    if (invitationType() === InvitationType.PROJECT && !form().projectRole) {
      const role = defaultRole();
      if (role) setForm((prev) => ({ ...prev, projectRole: role }));
    }
  });

  const resultsWithLinks = createMemo(() =>
    invitationResults().filter((r) => r.link)
  );
  const hasLinks = createMemo(() => resultsWithLinks().length > 0);
  const addedMembersCount = createMemo(
    () =>
      invitationResults().filter((r) => r.status === InvitationStatus.ACCEPTED)
        .length
  );

  const { mutate, isPending } = createMutation<
    UserInvitationWithLink[],
    HttpError,
    FormSchema
  >({
    mutationFn: async (data) => {
      const promises = data.emails.map((email) =>
        data.type === InvitationType.PLATFORM
          ? userInvitationApi.invite({
              email: email.trim().toLowerCase(),
              type: data.type,
              platformRole: data.platformRole,
            })
          : inviteProjectUser({ email, data, projectId: project.id })
      );

      return Promise.all(promises);
    },
    onSuccess: (results) => {
      const addedCount = results.filter(
        (r) => r.status === InvitationStatus.ACCEPTED
      ).length;
      const invitedCount = results.filter((r) => r.link).length;

      if (invitedCount > 0) {
        setInvitationResults(results);
      } else {
        setOpen(false);
        setForm(defaultValues());
        setErrors({});
      }

      const toastMessage = buildInviteToast({
        addedCount,
        invitedCount,
        sentCount: results.length - addedCount - invitedCount,
        projectName: project.displayName,
      });
      if (toastMessage) {
        toast.success(toastMessage, { duration: 3000 });
      }
      refetch();
      onInviteSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || t('Failed to send invitations'), {
        duration: 4000,
      });
    },
  });

  const handleEmailsChange = (emails: ReadonlyArray<string>) => {
    const filtered = emails.filter((e) => {
      const lower = e.toLowerCase();
      if (isPlatformInvite()) return !platformUserEmails.has(lower);
      return !projectMemberEmails.has(lower);
    });
    setForm((prev) => ({ ...prev, emails: [...filtered] }));
    setErrors((prev) => ({ ...prev, emails: validateEmails(filtered) }));
  };

  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const data = form();
    const next: InviteErrors = {
      emails: validateEmails(data.emails),
      projectRole:
        data.type === InvitationType.PROJECT && !data.projectRole
          ? t('Please select a project role')
          : undefined,
    };
    if (data.emails.length === 0) {
      next.emails = t('Please enter at least one email address');
    }
    if (next.emails || next.projectRole) {
      setErrors(next);
      return;
    }

    setErrors({});
    mutate(data);
  };

  const copyAllLinks = () => {
    const text = resultsWithLinks()
      .map((r) => `${r.email}: ${r.link}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success(t('All invitation links copied successfully'), {
      duration: 3000,
    });
  };

  const downloadCsv = () => {
    const rows = [
      'email,invitation_link',
      ...resultsWithLinks().map(
        (r) => `${escapeCsvField(r.email)},${escapeCsvField(r.link!)}`
      ),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invitations.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (embedState.isEmbedded || !userHasPermissionToInviteUser) {
    return null;
  }

  const dialogTitle = hasLinks()
    ? t('Invitation Links')
    : isPlatformInvite()
    ? t('Invite to platform')
    : t('Add Members');

  const dialogDescription = getDialogDescription({
    hasLinks: hasLinks(),
    addedMembersCount: addedMembersCount(),
    resultsWithLinksCount: resultsWithLinks().length,
    invitationType: invitationType(),
    isSmtpConfigured: Boolean(isSmtpConfigured),
    projectName: project.displayName,
  });

  return (
    <>
      {
        <Dialog
          open={open}
          modal
          onOpenChange={(open) => {
            setOpen(open);
            setForm(defaultValues());
            setErrors({});
            setInvitationResults([]);
            setSuggestionsOpen(false);
          }}
        >
          <DialogContent
            class="sm:max-w-[475px]"
            onEscapeKeyDown={(e) => {
              if (suggestionsOpen) e.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>{dialogDescription}</DialogDescription>
            </DialogHeader>

            {!hasLinks() ? (
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div class="grid gap-2">
                  <Label for="emails">{t('Emails')}</Label>
                  <UserSuggestionsPopover
                    value={form().emails}
                    onChange={handleEmailsChange}
                    placeholder={t('Invite users by email')}
                    invitationType={invitationType()}
                    onOpenChange={setSuggestionsOpen}
                  />
                  <Show when={errors().emails}>
                    <p class="text-sm font-medium text-destructive wrap-break-word">
                      {errors().emails}
                    </p>
                  </Show>
                </div>

                {invitationType() === InvitationType.PLATFORM && (
                  <div class="grid gap-3">
                    <Label>{t('Platform Role')}</Label>
                    <RoleSelector
                      type="platform"
                      value={form().platformRole}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          platformRole: toPlatformRole(value),
                        }))
                      }
                      placeholder={t('Select a platform role')}
                    />
                  </div>
                )}
                {invitationType() === InvitationType.PROJECT && (
                  <div class="grid gap-3">
                    <Label>{t('Project Role')}</Label>
                    <RoleSelector
                      type="project"
                      value={form().projectRole || defaultRole() || ''}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, projectRole: value }))
                      }
                      roles={roles()}
                      placeholder={t('Select a project role')}
                      isLoading={rolesLoading}
                    />
                    <Show when={errors().projectRole}>
                      <p class="text-sm font-medium text-destructive wrap-break-word">
                        {errors().projectRole}
                      </p>
                    </Show>
                  </div>
                )}

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant={'outline'}>
                      {t('Cancel')}
                    </Button>
                  </DialogClose>
                  <Button type="submit" loading={isPending}>
                    {isPlatformInvite() ? t('Invite') : t('Add')}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                <ScrollArea class="max-h-[300px]">
                  <div className="flex flex-col gap-3">
                    {resultsWithLinks().map((result) => (
                      <div key={result.id} className="flex flex-col gap-1">
                        <Label class="text-sm">{result.email}</Label>
                        <CopyToClipboardInput
                          useInput={true}
                          textToCopy={result.link!}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {resultsWithLinks().length > 1 && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      class="flex-1"
                      onClick={copyAllLinks}
                    >
                      <CopyIcon height={15} width={15} />
                      {t('Copy All')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      class="flex-1"
                      onClick={downloadCsv}
                    >
                      <DownloadIcon height={15} width={15} />
                      {t('Download CSV')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      }
    </>
  );
};

function getDialogDescription({
  hasLinks,
  addedMembersCount,
  resultsWithLinksCount,
  invitationType,
  isSmtpConfigured,
  projectName,
}: {
  hasLinks: boolean;
  addedMembersCount: number;
  resultsWithLinksCount: number;
  invitationType: InvitationType;
  isSmtpConfigured: boolean;
  projectName: string;
}): string {
  if (hasLinks) {
    const addedPrefix =
      addedMembersCount > 0
        ? t('membersAddedImmediately', {
            count: addedMembersCount,
            projectName,
          }) + ' '
        : '';
    const linkText =
      resultsWithLinksCount === 1
        ? t(
            'Please copy the link below and share it with the user you want to invite. The invitation expires in 7 days.'
          )
        : t(
            'Please copy the links below and share them with the users you want to invite. The invitations expire in 7 days.'
          );
    return addedPrefix + linkText;
  }

  if (invitationType === InvitationType.PLATFORM) {
    const base = t(
      'Invite team members to collaborate and build amazing flows together.'
    );
    return isSmtpConfigured
      ? base
      : base +
          ' ' +
          t(
            'Invitations will be shared via link since email is not configured.'
          );
  }

  return isSmtpConfigured
    ? t(
        'Platform members get instant access. New users will receive an invitation email.'
      )
    : t(
        'Platform members get instant access. New users will need to visit the invitation link.'
      );
}

function buildInviteToast({
  addedCount,
  invitedCount,
  sentCount,
  projectName,
}: {
  addedCount: number;
  invitedCount: number;
  sentCount: number;
  projectName: string;
}): JSX.Element | null {
  const lines: string[] = [];
  if (addedCount > 0) {
    lines.push(t('membersAddedCount', { count: addedCount, projectName }));
  }
  if (invitedCount > 0) {
    lines.push(t('invitationsLinkCount', { count: invitedCount }));
  }
  if (sentCount > 0) {
    lines.push(t('invitationsSentCount', { count: sentCount }));
  }
  if (lines.length === 0) {
    return null;
  }
  return (
    <span>
      {lines.map((line, i) => (
        <span>
          {i > 0 && <br />}
          {line}
        </span>
      ))}
    </span>
  );
}
const escapeCsvField = (value: string) => `"${value.replace(/"/g, '""')}"`;

function validateEmails(emails: ReadonlyArray<string>): string | undefined {
  if (emails.length === 0) return undefined;
  const invalid = emails.filter(
    (email) => !formatUtils.emailRegex.test(email.trim())
  );
  if (invalid.length === 0) return undefined;
  return buildInvalidEmailsMessage(invalid);
}

function toPlatformRole(value: string): PlatformRole {
  if (value === PlatformRole.ADMIN) return value;
  if (value === PlatformRole.OPERATOR) return value;
  if (value === PlatformRole.MEMBER) return value;
  throw new Error('Invalid platform role');
}

function inviteProjectUser({
  email,
  data,
  projectId,
}: {
  email: string;
  data: FormSchema;
  projectId: string;
}) {
  if (!data.projectRole) {
    throw new Error('Project role is required');
  }
  return userInvitationApi.invite({
    email: email.trim().toLowerCase(),
    type: InvitationType.PROJECT,
    projectRole: data.projectRole,
    projectId,
  });
}

type FormSchema = {
  emails: string[];
  type: InvitationType;
  platformRole: PlatformRole;
  projectRole?: string;
};

type InviteErrors = Partial<{
  emails: string;
  projectRole: string;
}>;
