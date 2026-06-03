import {
  GitPushOperationType,
  assertNotNullOrUndefined,
  PopulatedFlow,
  Table,
} from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createSignal, JSX } from 'solid-js';
import { toast } from 'solid-sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { gitSyncApi } from '../api/git-sync-api';
import { gitSyncHooks } from '../hooks/git-sync-hooks';

type PushToGitDialogProps =
  | {
      type: 'flow';
      flows: PopulatedFlow[];
      children?: JSX.Element;
    }
  | {
      type: 'table';
      tables: Table[];
      children?: JSX.Element;
    };

const PushToGitDialog = (props: PushToGitDialogProps) => {
  const [open, setOpen] = createSignal(false);
  const [commitMessage, setCommitMessage] = createSignal('');

  const showPushToGit = gitSyncHooks.useShowPushToGit();
  const { platform } = platformHooks.useCurrentPlatform();
  const { gitSync } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform?.plan.environmentsEnabled === true,
  );
  const { mutate, isPending } = createMutation(() => ({
    mutationFn: async (message: string) => {
      assertNotNullOrUndefined(gitSync, 'gitSync');
      switch (props.type) {
        case 'flow':
          await gitSyncApi.push(gitSync.id, {
            type: GitPushOperationType.PUSH_FLOW,
            commitMessage: message,
            externalFlowIds: props.flows.map((item) => item.externalId),
          });
          break;
        case 'table':
          await gitSyncApi.push(gitSync.id, {
            type: GitPushOperationType.PUSH_TABLE,
            commitMessage: message,
            externalTableIds: props.tables.map((item) => item.externalId),
          });
          break;
      }
    },
    onSuccess: () => {
      toast.success(t('Pushed successfully'), {
        duration: 3000,
      });
      setCommitMessage('');
      setOpen(false);
    },
  }));

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    mutate(commitMessage());
  };

  if (!showPushToGit) {
    return null;
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{t('Push to Git')}</DialogTitle>
          </DialogHeader>
          <div class="gap-2 flex flex-col">
            <label class="text-sm font-medium" for="commitMessage">
              {t('Commit Message')}
            </label>
            <Textarea
              id="commitMessage"
              value={commitMessage()}
              onInput={(event) => setCommitMessage(event.currentTarget.value)}
            />
          </div>
          <div class="text-sm text-gray-500 mt-2">
            {t(
              'Enter a commit message to describe the changes you want to push.',
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setCommitMessage('');
              }}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" loading={isPending}>
              {t('Push')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { PushToGitDialog };
