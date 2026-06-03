import {
  DiffReleaseRequest,
  ProjectReleaseType,
  ProjectSyncPlan,
} from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createEffect, createSignal, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { projectReleaseApi } from '@/features/project-releases';
import { projectCollectionUtils } from '@/features/projects';

import { CreateReleaseDialog } from '../create-release-dialog';

type ProjectSelectionDialogProps = {
  projectId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
};

export function ProjectSelectionDialog(props: ProjectSelectionDialogProps) {
  const { data: projects } = projectCollectionUtils.useAll();
  const [isCreateReleaseDialogOpen, setIsCreateReleaseDialogOpen] =
    createSignal(false);
  const [syncPlan, setSyncPlan] = createSignal<ProjectSyncPlan>();
  const [selectedProject, setSelectedProject] = createSignal('');
  const [error, setError] = createSignal('');

  createEffect(() => {
    if (!props.open) {
      return;
    }
    const project = projects.find((project) => project.id !== props.projectId);
    setSelectedProject(project ? project.id : '');
    setError('');
  });

  const { mutate: loadSyncPlan, isPending: isDoingDiff } = createMutation(
    () => ({
      mutationFn: (request: DiffReleaseRequest) =>
        projectReleaseApi.diff(request),
      onSuccess: (plan: ProjectSyncPlan) => {
        if (
          (!plan.flows || plan.flows.length === 0) &&
          (!plan.tables || plan.tables.length === 0)
        ) {
          toast(t('No Changes Found'), {
            description: t('There are no differences to apply'),
          });
          return;
        }
        setSyncPlan(plan);
        props.setOpen(false);
        setIsCreateReleaseDialogOpen(true);
      },
    }),
  );

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    if (!selectedProject()) {
      setError(t('Please select a project'));
      return;
    }
    loadSyncPlan({
      projectId: props.projectId,
      type: ProjectReleaseType.PROJECT,
      targetProjectId: selectedProject(),
    });
  };

  return (
    <>
      <Dialog open={props.open} onOpenChange={props.setOpen}>
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('Create Release')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} class="flex flex-col gap-4">
            <div class="grid gap-2">
              <Label>{t('Project')}</Label>
              <SearchableSelect
                onChange={(value) => {
                  setSelectedProject(value);
                  setError('');
                }}
                value={selectedProject()}
                placeholder={t('Search projects...')}
                options={(projects ?? [])
                  .filter((project) => project.id !== props.projectId)
                  .map((project) => ({
                    label: project.displayName,
                    value: project.id,
                  }))}
              />
              <Show when={error()}>
                <p class="text-sm font-medium text-destructive wrap-break-word">
                  {error()}
                </p>
              </Show>
            </div>

            <DialogFooter>
              <Button
                variant={'outline'}
                type="button"
                onClick={() => props.setOpen(false)}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit" loading={isDoingDiff}>
                {t('Review Changes')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Show when={isCreateReleaseDialogOpen() && syncPlan()}>
        {(plan) => (
          <CreateReleaseDialog
            loading={isDoingDiff}
            open={isCreateReleaseDialogOpen()}
            setOpen={setIsCreateReleaseDialogOpen}
            refetch={props.onSuccess}
            diffRequest={{
              projectId: props.projectId,
              targetProjectId: selectedProject(),
              type: ProjectReleaseType.PROJECT,
            }}
            plan={plan()}
          />
        )}
      </Show>
    </>
  );
}
