import {
  AppConnectionWithoutSensitiveData,
  CreatePlatformProjectRequest,
  ProjectWithLimits,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createForm } from 'solid-hook-form';
import { createSignal, JSX } from 'solid-js';

import { DefaultTag } from '@/components/custom/global-connection-utils';
import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SkeletonList } from '@/components/ui/skeleton';
import { internalErrorToast } from '@/components/ui/sonner';
import { globalConnectionsQueries } from '@/features/connections';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';

type NewProjectDialogProps = {
  children: JSX.Element;
  onCreate?: (project: ProjectWithLimits) => void;
};

export const NewProjectDialog = (props: NewProjectDialogProps) => {
  const [open, setOpen] = createSignal(false);
  const { platform } = platformHooks.useCurrentPlatform();
  const globalConnectionsEnabled = platform.plan.globalConnectionsEnabled;

  const { data: globalConnectionsPage, isLoading: isLoadingConnections } =
    globalConnectionsQueries.useGlobalConnections({
      request: { limit: 9999 },
      extraKeys: [],
    });

  const globalConnections = globalConnectionsPage?.data ?? [];

  return (
    <Dialog key={open ? 'open' : 'closed'} open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create Project')}</DialogTitle>
          <DialogDescription>
            {t(
              'Set up a new project to organize your automations and connections.',
            )}
          </DialogDescription>
        </DialogHeader>
        {(!isLoadingConnections || !globalConnectionsEnabled) && (
          <NewProjectForm
            setOpen={setOpen}
            globalConnections={globalConnections}
            globalConnectionsEnabled={globalConnectionsEnabled}
            onCreate={props.onCreate}
          />
        )}
        {isLoadingConnections && globalConnectionsEnabled && (
          <SkeletonList numberOfItems={3} class="h-10" />
        )}
      </DialogContent>
    </Dialog>
  );
};

const NewProjectForm = ({
  onCreate,
  setOpen,
  globalConnections,
  globalConnectionsEnabled,
}: Omit<NewProjectDialogProps, 'children'> & {
  setOpen: (open: boolean) => void;
  globalConnections: AppConnectionWithoutSensitiveData[];
  globalConnectionsEnabled: boolean;
}) => {
  const queryClient = useQueryClient();
  const preselectedConnectionExternalIds = globalConnections
    .filter((connection) => connection.preSelectForNewProjects)
    .map((connection) => connection.externalId);

  const form = createForm<CreatePlatformProjectRequest>({
    defaultValues: {
      globalConnectionExternalIds: preselectedConnectionExternalIds,
      alertReceiverEmail: '',
      displayName: '',
    },
  });

  const handleCreate = (values: CreatePlatformProjectRequest) => {
    const alertReceiverEmail = values.alertReceiverEmail?.trim();
    mutate({
      ...values,
      alertReceiverEmail:
        alertReceiverEmail && alertReceiverEmail.length > 0
          ? alertReceiverEmail
          : null,
    });
  };

  const { mutate, isPending } = projectCollectionUtils.useCreateProject(
    (data) => {
      onCreate?.(data);
      setOpen(false);
      queryClient.invalidateQueries({
        queryKey: globalConnectionsQueries.getGlobalConnectionsQueryKey([]),
      });
    },
    (error) => {
      console.error(error);
      internalErrorToast();
    },
  );

  return (
    <>
        <form className="grid space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
          <div class="grid space-y-2">
            <Label for="displayName" showRequiredIndicator>
              {t('Project Name')}
            </Label>
            <Input
              {...form.register('displayName', { required: t('Name is required') })}
              id="displayName"
              placeholder={t('Project Name')}
              class="rounded-sm"
            />
            {form.formState.errors.displayName?.message && (
              <p class="text-sm font-medium text-destructive">
                {form.formState.errors.displayName.message}
              </p>
            )}
          </div>
          <div class="grid space-y-2">
            <Label for="alertReceiverEmail">{t('Alert Receiver Email')}</Label>
            <Input
              {...form.register('alertReceiverEmail', {
                validate: (value) =>
                  !value || /.+@.+\..+/.test(value) || t('Invalid email'),
              })}
              id="alertReceiverEmail"
              type="email"
              placeholder="alerts@example.com"
              class="rounded-sm"
            />
            <span className="text-xs text-muted-foreground">
              {t('Receives flow failure emails for this project.')}
            </span>
            {form.formState.errors.alertReceiverEmail?.message && (
              <p class="text-sm font-medium text-destructive">
                {form.formState.errors.alertReceiverEmail.message}
              </p>
            )}
          </div>
          {globalConnectionsEnabled && (
            <div class="grid space-y-2">
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
                itemExtraContent={(index) => {
                  if (globalConnections[index].preSelectForNewProjects) {
                    return <DefaultTag />;
                  }
                  return null;
                }}
                initialValues={form.values().globalConnectionExternalIds ?? []}
                showDeselect={(form.values().globalConnectionExternalIds ?? []).length > 0}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant={'outline'}
              type="button"
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
                form.handleSubmit(handleCreate)(e);
              }}
            >
              {t('Create Project')}
            </Button>
          </DialogFooter>
        </form>
    </>
  );
};
