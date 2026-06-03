import { FlowOperationType, PopulatedFlow } from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createEffect, createSignal, For, JSX, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { projectMembersHooks } from '@/features/members/hooks/project-members-hooks';

import { flowsApi } from '../api/flows-api';

type ChangeOwnerDialogProps = {
  children: JSX.Element;
  flow: PopulatedFlow;
  onOwnerChange: () => void;
};

const ChangeOwnerDialog = (props: ChangeOwnerDialogProps) => {
  const { projectMembers, isLoading } = projectMembersHooks.useProjectMembers();
  const [isDialogOpened, setIsDialogOpened] = createSignal(false);
  const [ownerId, setOwnerId] = createSignal('');
  const [error, setError] = createSignal('');
  const members = () => projectMembers ?? [];

  createEffect(() => {
    if (isDialogOpened()) {
      setOwnerId(props.flow.ownerId ?? '');
      setError('');
    }
  });
  const { mutate, isPending } = createMutation<
    PopulatedFlow,
    Error,
    ChangeOwnerFormSchema
  >(() => ({
    mutationFn: async (data: ChangeOwnerFormSchema) => {
      return await flowsApi.update(props.flow.id, {
        type: FlowOperationType.UPDATE_OWNER,
        request: {
          ownerId: data.ownerId,
        },
      });
    },
    onSuccess: () => {
      props.onOwnerChange();
      setIsDialogOpened(false);
      toast.success(t('Flow owner has been updated'));
    },
  }));

  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    if (!ownerId()) {
      setError(t('Please select an owner'));
      return;
    }
    setError('');
    mutate({ ownerId: ownerId() });
  };

  return (
    <Dialog onOpenChange={setIsDialogOpened} open={isDialogOpened}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Change Flow Owner')}</DialogTitle>
          <DialogDescription>
            {t('Select a team member to take ownership of this flow.')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div class="space-y-1">
            <Select
              onValueChange={setOwnerId}
              value={ownerId() || undefined}
              disabled={
                isLoading || !projectMembers || projectMembers.length === 0
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={String(t('Select Owner'))} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <For each={members()}>
                    {(member) => (
                      <SelectItem value={member.userId}>
                        {member.user.firstName} {member.user.lastName} (
                        {member.user.email})
                      </SelectItem>
                    )}
                  </For>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Show when={error()}>
              <p class="text-sm font-medium text-destructive wrap-break-word">
                {error()}
              </p>
            </Show>
          </div>
          <DialogFooter>
            <Button type="submit" loading={isPending}>
              {t('Transfer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

type ChangeOwnerFormSchema = {
  ownerId: string;
};

export { ChangeOwnerDialog };
