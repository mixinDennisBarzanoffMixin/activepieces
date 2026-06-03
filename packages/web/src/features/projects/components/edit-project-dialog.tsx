import {
  AppConnectionWithoutSensitiveData,
  Permission,
  UpdateProjectPlatformRequest,
  PlatformRole,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createForm } from 'solid-hook-form';
import { createEffect, createMemo, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { GlobalConnectionWarning } from '@/components/custom/global-connection-utils';
import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SkeletonList } from '@/components/ui/skeleton';
import { internalErrorToast } from '@/components/ui/sonner';
import { globalConnectionsQueries } from '@/features/connections/hooks/global-connections-hooks';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

interface EditProjectDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  initialValues?: {
    projectName?: string;
    externalId?: string;
  };
}

export function EditProjectDialog(props: EditProjectDialogProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const globalConnectionsEnabled = platform.plan.globalConnectionsEnabled;

  const { data: globalConnectionsPage, isLoading: isLoadingConnections } =
    globalConnectionsQueries.useGlobalConnections({
      request: { limit: 9999 },
      extraKeys: [],
    });

  const globalConnections = globalConnectionsPage?.data ?? [];

  return (
    <Dialog open={props.open} onOpenChange={props.onClose}>
      <DialogContent class="max-w-md w-full">
        <DialogHeader>
          {' '}
          <DialogTitle>
            {t('Edit')} {props.initialValues?.projectName}
          </DialogTitle>
        </DialogHeader>

        <Show
          when={!globalConnectionsEnabled || !isLoadingConnections}
          fallback={<SkeletonList numberOfItems={3} class="h-10" />}
        >
          <EditProjectForm
            onClose={props.onClose}
            projectId={props.projectId}
            initialValues={props.initialValues}
            globalConnections={globalConnections}
            globalConnectionsEnabled={globalConnectionsEnabled}
          />
        </Show>
      </DialogContent>
    </Dialog>
  );
}

const EditProjectForm = (props: {
  onClose: () => void;
  projectId: string;
  initialValues?: EditProjectDialogProps['initialValues'];
  globalConnections: AppConnectionWithoutSensitiveData[];
  globalConnectionsEnabled: boolean;
}) => {
  const { checkAccess } = useAuthorization();
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const queryClient = useQueryClient();

  const currentConnectionExternalIds = createMemo(() =>
    props.globalConnections
      .filter((connection) => connection.projectIds.includes(props.projectId))
      .map((connection) => connection.externalId),
  );

  const { mutate, isPending } = projectCollectionUtils.useUpdateProject(
    () => {
      void queryClient.invalidateQueries({
        queryKey: globalConnectionsQueries.getGlobalConnectionsQueryKey([]),
      });
      toast.success(t('Your changes have been saved.'), {
        duration: 3000,
      });
      props.onClose();
    },
    (error) => {
      console.error(error);
      internalErrorToast();
    },
  );

  const form = createForm<UpdateProjectPlatformRequest>({
    defaultValues: {
      displayName: props.initialValues?.projectName ?? '',
      externalId: props.initialValues?.externalId ?? '',
      globalConnectionExternalIds: [],
    },
  });
  createEffect(() => {
    form.setValue(
      'globalConnectionExternalIds',
      currentConnectionExternalIds(),
    );
  });
  const display = form.register('displayName');
  const external = form.register('externalId');
  const disabled = checkAccess(Permission.WRITE_PROJECT) === false;
  const options = createMemo(() =>
    props.globalConnections.map((connection) => ({
      value: connection.externalId,
      label: connection.displayName,
    })),
  );
  const selected = createMemo(() =>
    form.values().globalConnectionExternalIds
      ? form.values().globalConnectionExternalIds
      : [],
  );
  const save = (values: UpdateProjectPlatformRequest) => {
    if (disabled) return;
    mutate({
      projectId: props.projectId,
      request: {
        displayName: values.displayName,
        externalId: values.externalId,
        globalConnectionExternalIds: values.globalConnectionExternalIds,
      },
    });
  };

  return (
    <form
      class="space-y-4"
      onSubmit={(event) => form.handleSubmit(save)(event)}
    >
      <Show when={props.globalConnectionsEnabled}>
        <GlobalConnectionWarning />
      </Show>
      <div>
        <Label for="displayName">{t('Project Name')}</Label>
        <Input
          {...display}
          id="displayName"
          placeholder={t('Project Name')}
          class="rounded-sm"
          disabled={disabled}
        />
      </div>

      <Show
        when={
          platform.plan.embeddingEnabled && platformRole === PlatformRole.ADMIN
        }
      >
        <div>
          <Label for="externalId">{t('External ID')}</Label>
          <p class="text-sm text-muted-foreground">
            {t('Used to identify the project based on your SaaS ID')}
          </p>
          <Input
            {...external}
            id="externalId"
            placeholder={t('org-3412321')}
            class="rounded-sm"
            disabled={disabled}
          />
        </div>
      </Show>

      <Show when={props.globalConnectionsEnabled}>
        <div>
          <Label>{t('Global Connections')}</Label>
          <MultiSelectPieceProperty
            placeholder={t('Select global connections')}
            options={options()}
            loading={false}
            onInput={(value) => {
              if (!value) {
                form.setValue('globalConnectionExternalIds', []);
                return;
              }
              form.setValue('globalConnectionExternalIds', value);
            }}
            initialValues={selected()}
            showDeselect={selected().length > 0}
          />
        </div>
      </Show>

      <DialogFooter class="justify-end mt-6">
        <Button type="button" variant="outline" onClick={props.onClose}>
          {t('Cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isPending || disabled}
          loading={isPending}
        >
          {t('Save')}
        </Button>
      </DialogFooter>
    </form>
  );
};
