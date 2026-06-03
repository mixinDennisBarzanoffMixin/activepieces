import {
  PopulatedFlow,
  Template,
  TemplateTelemetryEventType,
  TemplateType,
  UncategorizedFolderId,
  isNil,
} from '@activepieces/shared';
import { useNavigate } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createEffect, createSignal, For, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { flowHooks } from '@/features/flows';
import { foldersApi, foldersHooks } from '@/features/folders';
import { projectCollectionUtils } from '@/features/projects';
import { ApProjectDisplay } from '@/features/projects/components/ap-project-display';
import { templatesTelemetryApi } from '@/features/templates';
import { authenticationSession } from '@/lib/authentication-session';

type UseTemplateDialogProps = {
  template: Template;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const UseTemplateDialog = (props: UseTemplateDialogProps) => {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = createSignal('');
  const [selectedFolderId, setSelectedFolderId] = createSignal('');

  const { data: projects } = projectCollectionUtils.useAll();
  const { folders } = foldersHooks.useFolders();
  const projectList = () => projects ?? [];
  const folderList = () => folders ?? [];

  createEffect(() => {
    if (props.open) {
      const currentProjectId = authenticationSession.getProjectId();
      if (currentProjectId) {
        setSelectedProjectId(currentProjectId);
      } else if (projectList().length > 0) {
        setSelectedProjectId(projectList()[0].id);
      }
      setSelectedFolderId(UncategorizedFolderId);
    }
  });

  const { mutate: createFlow, isPending } = createMutation(() => ({
    mutationFn: async (params: {
      projectId: string;
      folderId: string;
    }): Promise<PopulatedFlow[]> => {
      const { projectId, folderId } = params;
      const flows = props.template.flows || [];
      const hasMultipleFlows = flows.length > 1;

      let folderName: string | undefined;

      if (hasMultipleFlows) {
        const newFolder = await foldersApi.create({
          displayName: props.template.name,
          projectId: projectId,
        });
        folderName = newFolder.displayName;
      } else if (!isNil(folderId) && folderId !== UncategorizedFolderId) {
        const folder = await foldersApi.get(folderId);
        folderName = folder.displayName;
      }

      return flowHooks.importFlowsFromTemplates({
        templates: [props.template],
        projectId,
        folderName,
      });
    },
    onSuccess: (flows: PopulatedFlow[]) => {
      props.onOpenChange(false);
      if (flows.length === 1) {
        toast.success(t('Flow created successfully'));
        navigate(`/flows/${flows[0].id}`);
      } else {
        toast.success(
          t('{count} flows created successfully in a new folder', {
            count: flows.length,
          }),
        );
        navigate(`/flows`);
      }
    },
    onError: (error) => {
      toast.error(t('Failed to create flow from template'));
      console.error('Error creating flow:', error);
    },
  }));

  const handleConfirmUseTemplate = () => {
    if (!selectedProjectId()) {
      toast.error(t('Please select a project'));
      return;
    }
    createFlow({
      projectId: selectedProjectId(),
      folderId: selectedFolderId(),
    });

    const userId = authenticationSession.getCurrentUserId();

    if (props.template.type === TemplateType.OFFICIAL && userId) {
      void templatesTelemetryApi.sendEvent({
        eventType: TemplateTelemetryEventType.INSTALL,
        templateId: props.template.id,
        userId,
      });
    }
  };

  const flowCount = props.template.flows?.length || 0;
  const hasMultipleFlows = flowCount > 1;

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Use Template')}</DialogTitle>
          <DialogDescription>
            {hasMultipleFlows
              ? t(
                  'This template includes {count} flows with all dependencies. A new folder will be created to organize them.',
                  { count: flowCount },
                )
              : t(
                  'Select the project and folder where you want to use this template.',
                )}
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-2">
          <div class="flex flex-col gap-2">
            <Label for="project">{t('Project')}</Label>
            <Select
              value={selectedProjectId()}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder={String(t('Select a project'))} />
              </SelectTrigger>
              <SelectContent>
                {
                  <For each={projectList()}>
                    {(project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <ApProjectDisplay
                          title={project.displayName}
                          icon={project.icon}
                          projectType={project.type}
                        />
                      </SelectItem>
                    )}
                  </For>
                }
              </SelectContent>
            </Select>
          </div>
          <Show when={!hasMultipleFlows}>
            <div class="flex flex-col gap-2">
              <Label for="folder">{t('Folder')}</Label>
              <Select
                value={selectedFolderId()}
                onValueChange={setSelectedFolderId}
              >
                <SelectTrigger id="folder">
                  <SelectValue placeholder={String(t('Select a folder'))} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UncategorizedFolderId}>
                    {t('Uncategorized')}
                  </SelectItem>
                  {
                    <For each={folderList()}>
                      {(folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.displayName}
                        </SelectItem>
                      )}
                    </For>
                  }
                </SelectContent>
              </Select>
            </div>
          </Show>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => props.onOpenChange(false)}
            disabled={isPending}
          >
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleConfirmUseTemplate}
            loading={isPending}
            disabled={!selectedProjectId()}
          >
            {t('Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
