import {
  GitBranchType,
  GitPushOperationType,
  assertNotNullOrUndefined,
} from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Info } from 'lucide-solid';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { gitSyncApi, gitSyncHooks } from '@/features/project-releases';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';

type PushEverythingDialogProps = {
  children?: JSX.Element;
};

const PushEverythingDialog = (props: PushEverythingDialogProps) => {
  const [open, setOpen] = createSignal(false);
  const [commitMessage, setCommitMessage] = createSignal('');

  const { platform } = platformHooks.useCurrentPlatform();
  const { gitSync } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform.plan.environmentsEnabled,
  );
  const { mutate, isPending } = createMutation(() => ({
    mutationFn: async (message: string) => {
      assertNotNullOrUndefined(gitSync, 'gitSync');
      await gitSyncApi.push(gitSync.id, {
        type: GitPushOperationType.PUSH_EVERYTHING,
        commitMessage: message,
      });
    },
    onSuccess: () => {
      toast.success(t('Everything is pushed successfully'), {
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

  if (!gitSync || gitSync.branchType !== GitBranchType.DEVELOPMENT) {
    return null;
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{t('Push Everything to Git')}</DialogTitle>
          </DialogHeader>
          <div class="gap-2 flex flex-col">
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium" for="commitMessage">
                {t('Commit Message')}
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info class="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent class="max-w-xs">
                  {t(
                    'Push all published flows, connections, and tables to the Git repository.',
                  )}
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              id="commitMessage"
              value={commitMessage()}
              onInput={(event) => setCommitMessage(event.currentTarget.value)}
            />
            <div class="text-sm text-gray-500">
              {t(
                'Enter a commit message to describe the changes you want to push.',
              )}
            </div>
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

export { PushEverythingDialog };
