import {
  ApErrorParams,
  ConfigureRepoRequest,
  ErrorCode,
  GitBranchType,
  GitRepo,
} from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createSignal, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { INTERNAL_ERROR_MESSAGE } from '@/components/ui/sonner';
import { Textarea } from '@/components/ui/textarea';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { gitSyncApi } from '../api/git-sync-api';
import { gitSyncHooks } from '../hooks/git-sync-hooks';

type ConnectGitProps = {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  showButton?: boolean;
};

const ConnectGitDialog = ({ open, setOpen, showButton }: ConnectGitProps) => {
  const projectId = authenticationSession.getProjectId()!;
  const { platform } = platformHooks.useCurrentPlatform();
  const [remoteUrl, setRemoteUrl] = createSignal('');
  const [branch, setBranch] = createSignal('');
  const [slug, setSlug] = createSignal('');
  const [sshPrivateKey, setSshPrivateKey] = createSignal('');
  const [error, setError] = createSignal('');

  const { refetch } = gitSyncHooks.useGitSync(
    projectId,
    platform.plan.environmentsEnabled,
  );

  const { mutate, isPending } = createMutation(() => ({
    mutationFn: (request: ConfigureRepoRequest): Promise<GitRepo> => {
      return gitSyncApi.configure(request);
    },
    onSuccess: () => {
      refetch();
      toast.success(t('Connected successfully'), {
        duration: 3000,
      });
    },
    onError: (error) => {
      let message = INTERNAL_ERROR_MESSAGE;

      if (api.isError(error)) {
        const responseData = error.response?.data as ApErrorParams;
        if (responseData.code === ErrorCode.INVALID_GIT_CREDENTIALS) {
          message = `Invalid git credentials, please check the credentials, \n ${responseData.params.message}`;
        }
      }
      setError(message);
    },
  }));

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    setError('');
    const result = ConfigureRepoRequest.safeParse({
      remoteUrl: remoteUrl(),
      projectId,
      branchType: GitBranchType.DEVELOPMENT,
      sshPrivateKey: sshPrivateKey(),
      slug: slug(),
      branch: branch(),
    });
    if (!result.success) {
      const issue = result.error.issues[0];
      if (!issue) {
        setError(INTERNAL_ERROR_MESSAGE);
        return;
      }
      setError(issue.message);
      return;
    }
    mutate(result.data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={true}>
      {showButton && (
        <DialogTrigger asChild>
          <Button size={'sm'} class="w-32">
            {t('Connect Git')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent class="sm:max-w-[500px]">
        <form className="flex flex-col" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{t('Connect Git')}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium" for="remoteUrl">
                {t('Remote URL')}
              </label>
              <Input
                id="remoteUrl"
                placeholder="git@github.com:activepieces/activepieces.git"
                value={remoteUrl()}
                onInput={(event) => setRemoteUrl(event.currentTarget.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" for="branch">
                {t('Branch')}
              </label>
              <Input
                id="branch"
                placeholder="main"
                value={branch()}
                onInput={(event) => setBranch(event.currentTarget.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" for="slug">
                {t('Folder')}
              </label>
              <Input
                id="slug"
                placeholder="activepieces"
                value={slug()}
                onInput={(event) => setSlug(event.currentTarget.value)}
              />
              <p className="text-sm text-muted-foreground">
                {t(
                  'Folder name is the name of the folder where the project will be stored or fetched.',
                )}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" for="sshPrivateKey">
                {t('SSH Private Key')}
              </label>
              <Textarea
                id="sshPrivateKey"
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                value={sshPrivateKey()}
                onInput={(event) => setSshPrivateKey(event.currentTarget.value)}
              />
              <p className="text-sm text-muted-foreground">
                {t('The SSH private key to use for authentication.')}
              </p>
            </div>
            <Show when={error()}>
              <p className="text-sm font-medium text-destructive wrap-break-word">
                {error()}
              </p>
            </Show>
          </div>

          <DialogFooter>
            <DialogClose>
              <Button type="button" variant={'outline'} loading={isPending}>
                {t('Cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" loading={isPending}>
              {t('Connect')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

ConnectGitDialog.displayName = 'ConnectGitDialog';
export { ConnectGitDialog };
