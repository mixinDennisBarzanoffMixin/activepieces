import {
  DiffReleaseRequest,
  isNil,
  ProjectReleaseType,
  ProjectSyncPlan,
} from '@activepieces/shared';
import { createSignal, ParentProps, Show, splitProps } from 'solid-js';

import { Button, ButtonProps } from '@/components/ui/button';
import {
  ConnectGitDialog,
  gitSyncHooks,
  projectReleaseMutations,
} from '@/features/project-releases';
import { authenticationSession } from '@/lib/authentication-session';

import { CreateReleaseDialog } from './create-release-dialog';

type ApplyButtonProps = ParentProps<
  ButtonProps & {
    request: DiffReleaseRequest;
    onSuccess: () => void;
    defaultName?: string;
  }
>;

export const ApplyButton = (_props: ApplyButtonProps) => {
  const [local, props] = splitProps(_props, [
    'request',
    'children',
    'onSuccess',
    'defaultName',
  ]);
  const projectId = authenticationSession.getProjectId()!;
  const { gitSync } = gitSyncHooks.useGitSync(projectId, !isNil(projectId));
  const [isCreateReleaseDialogOpen, setIsCreateReleaseDialogOpen] =
    createSignal(false);
  const [syncPlan, setSyncPlan] = createSignal<ProjectSyncPlan | null>(null);
  const [loadingRequestId, setLoadingRequestId] = createSignal<string | null>(
    null,
  );

  const { mutate: loadSyncPlan } = projectReleaseMutations.useDiffRelease({
    onSuccess: (plan) => {
      if (
        (!plan.flows || plan.flows.length === 0) &&
        (!plan.tables || plan.tables.length === 0)
      ) {
        setSyncPlan(null);
        setLoadingRequestId(null);
        return;
      }
      setSyncPlan(plan);
      setLoadingRequestId(null);
    },
    onError: () => {
      setSyncPlan(null);
      setLoadingRequestId(null);
    },
  });

  const [isConnectGitDialogOpen, setGitDialogOpen] = createSignal(false);
  const showGitDialog =
    isNil(gitSync) && local.request.type === ProjectReleaseType.GIT;
  const requestId = JSON.stringify(local.request);
  const isLoading = loadingRequestId === requestId;

  return (
    <>
      <Button
        {...props}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (showGitDialog) {
            setGitDialogOpen(true);
          } else {
            setLoadingRequestId(requestId);
            setIsCreateReleaseDialogOpen(true);
            loadSyncPlan(local.request);
          }
        }}
      >
        {local.children}
      </Button>

      <Show
        when={isConnectGitDialogOpen}
        fallback={
          <Show when={isCreateReleaseDialogOpen}>
            <CreateReleaseDialog
              open={isCreateReleaseDialogOpen}
              loading={isLoading}
              setOpen={setIsCreateReleaseDialogOpen}
              refetch={local.onSuccess}
              plan={syncPlan()!}
              defaultName={local.defaultName}
              diffRequest={local.request}
            />
          </Show>
        }
      >
        <ConnectGitDialog
          open={isConnectGitDialogOpen}
          setOpen={setGitDialogOpen}
          showButton={false}
        />
      </Show>
    </>
  );
};
