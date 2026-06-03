import {
  PlatformRole,
  UpdateUserRequestBody,
  User,
} from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createSignal, Show } from 'solid-js';

import { platformUserApi } from '@/api/platform-user-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RoleSelector } from '@/features/members';

const roles: string[] = Object.values(PlatformRole);

function isPlatformRole(value: string): value is PlatformRole {
  return roles.some((role) => role === value);
}

export const UpdateUserDialog = (props: {
  children: JSX.Element;
  onUpdate: (role: PlatformRole) => void;
  userId: string;
  role: PlatformRole;
  externalId?: string;
}) => {
  const [open, setOpen] = createSignal(false);
  const [selected, setSelected] = createSignal(props.role);
  const [external, setExternal] = createSignal(props.externalId || '');
  const [error, setError] = createSignal('');
  const { mutate, isPending } = createMutation(() => ({
    mutationKey: ['update-user'],
    mutationFn: (request: UpdateUserRequestBody) =>
      platformUserApi.update(props.userId, request),
    onSuccess: (user: User) => {
      props.onUpdate(user.platformRole);
      setOpen(false);
    },
  }));

  const reset = () => {
    setSelected(props.role);
    setExternal(props.externalId || '');
    setError('');
  };

  const submit = () => {
    const parsed = UpdateUserRequestBody.safeParse({
      platformRole: selected(),
      externalId: external(),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || t('Invalid form data'));
      return;
    }
    setError('');
    mutate(parsed.data);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        reset();
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Update User Role')}</DialogTitle>
        </DialogHeader>
        <form class="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div class="grid space-y-2">
            <Label for="role">{t('Role')}</Label>
            <RoleSelector
              type="platform"
              value={selected()}
              onValueChange={(value) => {
                if (isPlatformRole(value)) {
                  setSelected(value);
                }
              }}
            />
          </div>
          <div class="grid space-y-2">
            <Label for="externalId">{t('External ID')}</Label>
            <Input
              id="externalId"
              value={external()}
              onInput={(event) => setExternal(event.currentTarget.value)}
            />
          </div>
          <Show when={error()}>
            <p class="text-sm font-medium text-destructive wrap-break-word">
              {error()}
            </p>
          </Show>
        </form>
        <DialogFooter>
          <Button
            variant={'outline'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(false);
            }}
          >
            {t('Cancel')}
          </Button>
          <Button
            disabled={isPending}
            loading={isPending}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              submit();
            }}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
