import {
  AppConnectionWithoutSensitiveData,
  Permission,
  UpdateProjectPlatformRequest,
  PlatformRole,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createForm } from 'solid-hook-form';
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

export function EditProjectDialog({
  open,
  onClose,
  projectId,
  initialValues,
}: EditProjectDialogProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const globalConnectionsEnabled = platform.plan.globalConnectionsEnabled;

  const { data: globalConnectionsPage, isLoading: isLoadingConnections } =
    globalConnectionsQueries.useGlobalConnections({
      request: { limit: 9999 },
      extraKeys: [],
    });

  const globalConnections = globalConnectionsPage?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent class="max-w-md w-full">
        <DialogHeader>
          {' '}
          <DialogTitle>
            {t('Edit')} {initialValues?.projectName}
          </DialogTitle>
        </DialogHeader>

        {!globalConnectionsEnabled || !isLoadingConnections ? (
          <EditProjectForm
            onClose={onClose}
            projectId={projectId}
            initialValues={initialValues}
            globalConnections={globalConnections}
            globalConnectionsEnabled={globalConnectionsEnabled}
          />
        ) : (
          <SkeletonList numberOfItems={3} class="h-10" />
        )}
      </DialogContent>
    </Dialog>
  );
}

const EditProjectForm = ({
  onClose,
  projectId,
  initialValues,
  globalConnections,
  globalConnectionsEnabled,
}: {
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

  const currentConnectionExternalIds = globalConnections
    .filter((connection) => connection.projectIds.includes(projectId))
    .map((connection) => connection.externalId);

  const { mutate, isPending } = projectCollectionUtils.useUpdateProject(
    () => {
      queryClient.invalidateQueries({
        queryKey: globalConnectionsQueries.getGlobalConnectionsQueryKey([]),
      });
      toast.success(t('Your changes have been saved.'), {
        duration: 3000,
      });
      onClose();
    },
    (error) => {
      console.error(error);
      internalErrorToast();
    },
  );

  const form = createForm<UpdateProjectPlatformRequest>({
    defaultValues: {
      displayName: initialValues?.projectName ?? '',
      externalId: initialValues?.externalId ?? '',
      globalConnectionExternalIds: currentConnectionExternalIds,
    },
  });
  const disabled = checkAccess(Permission.WRITE_PROJECT) === false;

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        if (!disabled) {
          mutate({
            projectId,
            request: {
              displayName: values.displayName,
              externalId: values.externalId,
              globalConnectionExternalIds: values.globalConnectionExternalIds,
            },
          });
        }
      })}
    >
      {globalConnectionsEnabled && <GlobalConnectionWarning />}
      <div>
        <Label for="displayName">{t('Project Name')}</Label>
        <Input
          {...form.register('displayName')}
          id="displayName"
          placeholder={t('Project Name')}
          class="rounded-sm"
          disabled={disabled}
        />
      </div>

      {platform.plan.embeddingEnabled && platformRole === PlatformRole.ADMIN && (
        <div>
          <Label for="externalId">{t('External ID')}</Label>
          <p class="text-sm text-muted-foreground">
            {t('Used to identify the project based on your SaaS ID')}
          </p>
          <Input
            {...form.register('externalId')}
            id="externalId"
            placeholder={t('org-3412321')}
            class="rounded-sm"
            disabled={disabled}
          />
        </div>
      )}

      {globalConnectionsEnabled && (
        <div>
          <Label>{t('Global Connections')}</Label>
          <MultiSelectPieceProperty
            placeholder={t('Select global connections')}
            options={globalConnections.map((connection) => ({
              value: connection.externalId,
              label: connection.displayName,
            }))}
            loading={false}
            onChange={(value) => {
              form.setValue('globalConnectionExternalIds', value ?? []);
            }}
            initialValues={form.values().globalConnectionExternalIds ?? []}
            showDeselect={
              (form.values().globalConnectionExternalIds ?? []).length > 0
            }
          />
        </div>
      )}

      <DialogFooter class="justify-end mt-6">
        <Button type="button" variant="outline" onClick={onClose}>
          {t('Cancel')}
        </Button>
        <Button type="submit" disabled={isPending || disabled} loading={isPending}>
          {t('Save')}
        </Button>
      </DialogFooter>
    </form>
  );
};
