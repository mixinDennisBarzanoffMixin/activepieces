import {
  ConnectionOperationType,
  DiffReleaseRequest,
  ProjectReleaseType,
  ProjectSyncPlan,
  TableOperationType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { PencilIcon, Plus, TrashIcon } from 'lucide-solid';
import {
  Accessor,
  createEffect,
  createSignal,
  For,
  Setter,
  Show,
} from 'solid-js';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { projectReleaseMutations } from '@/features/project-releases';
import { authenticationSession } from '@/lib/authentication-session';

import { OperationChange } from './operation-change';

type CreateReleaseDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  refetch: () => void;
  loading: boolean;
  diffRequest: DiffReleaseRequest;
  plan: ProjectSyncPlan;
  defaultName?: string;
};

type CreateReleaseDialogContentProps = {
  name: Accessor<string>;
  setName: Setter<string>;
  description: Accessor<string>;
  setDescription: Setter<string>;
  loading: boolean;
  diffRequest: DiffReleaseRequest;
  plan: ProjectSyncPlan;
  setOpen: (open: boolean) => void;
  refetch: () => void;
};

const CreateReleaseDialogContent = ({
  loading,
  diffRequest,
  plan,
  name,
  setName,
  description,
  setDescription,
  setOpen,
  refetch,
}: CreateReleaseDialogContentProps) => {
  const isThereAnyChanges =
    (plan?.flows && plan?.flows.length > 0) ||
    (plan?.tables && plan?.tables.length > 0);

  const { mutate: applyChanges, isPending } =
    projectReleaseMutations.useApplyRelease({
      onSuccess: () => {
        refetch();
        setOpen(false);
      },
    });
  const [selectedChanges, setSelectedChanges] = createSignal<Set<string>>(
    new Set(plan?.flows.map((op) => op.flow.id) || []),
  );
  const [errorMessage, setErrorMessage] = createSignal('');
  const [nameError, setNameError] = createSignal('');

  const handleSelectAll = (checked: boolean) => {
    if (!plan) return;
    setSelectedChanges(
      new Set(checked ? plan.flows.map((op) => op.flow.id) : []),
    );
  };

  return (
    <>
      <Show when={loading}>
        <div className="flex items-center justify-center h-24">
          <LoadingSpinner />
        </div>
      </Show>

      <Show when={!loading && isThereAnyChanges}>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label class="text-sm" for="name">
              {t('Name')}
            </Label>
            <Input
              id="name"
              value={name()}
              onInput={(event) => {
                setName(event.currentTarget.value);
                setNameError('');
              }}
              placeholder={t('Meeting Summary Flow')}
            />
            <Show when={nameError()}>
              <p className="text-sm text-destructive">
                {nameError()}
              </p>
            </Show>
          </div>
          <div className="flex flex-col gap-2">
            <Label class="text-sm" for="description">
              {t('Description')}
            </Label>
            <Textarea
              id="description"
              value={description()}
              onInput={(event) => setDescription(event.currentTarget.value)}
              placeholder={t('Added new features and fixed bugs')}
            />
          </div>
          <Show when={plan?.flows && plan.flows.length > 0}>
            <div className="space-y-2 ">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 py-2 border-b">
                  <Checkbox
                    checked={selectedChanges().size === plan?.flows.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label class="text-sm font-medium">
                    {t('Flows Changes')} ({selectedChanges().size}/
                    {plan?.flows.length || 0})
                  </Label>
                </div>
              </div>
              <ScrollArea viewPortClassName="max-h-[15vh]">
                <For each={plan?.flows}>
                  {(operation) => (
                    <OperationChange
                      key={operation.flow.id}
                      change={operation}
                      selected={selectedChanges().has(operation.flow.id)}
                      onSelect={(checked) => {
                        const next = new Set(selectedChanges());
                        if (checked) {
                          next.add(operation.flow.id);
                        }
                        if (!checked) {
                          next.delete(operation.flow.id);
                        }
                        setErrorMessage('');
                        setSelectedChanges(next);
                      }}
                    />
                  )}
                </For>
              </ScrollArea>
            </div>
          </Show>
          <Show when={plan?.connections && plan.connections.length > 0}>
            <div className="space-y-2">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col justify -center gap-1 py-2 border-b">
                  <Label class="text-sm font-medium">
                    {t('Connections Changes')} ({plan?.connections?.length || 0}
                    )
                  </Label>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      {t(
                        'New connections are placeholders and need to be reconnected again',
                      )}
                    </span>
                  </div>
                </div>
                <ScrollArea viewPortClassName="max-h-[10vh]">
                  <For each={plan?.connections}>
                    {(connection) => (
                      <div
                        key={connection.connectionState.externalId}
                        className="flex items-center gap-2 text-sm py-1"
                      >
                        <Show
                          when={
                            connection.type ===
                            ConnectionOperationType.UPDATE_CONNECTION
                          }
                        >
                          <div className="flex items-center gap-2">
                            <PencilIcon class="w-4 h-4 shrink-0" />
                            <div className="flex items-center gap-1">
                              <span>
                                {connection.connectionState.displayName}
                              </span>
                              <span> {t('renamed to')} </span>
                              <span>
                                {connection.newConnectionState.displayName}
                              </span>
                            </div>
                          </div>
                        </Show>
                        <Show
                          when={
                            connection.type ===
                            ConnectionOperationType.CREATE_CONNECTION
                          }
                        >
                          <div className="flex items-center gap-2">
                            <Plus class="w-4 h-4 shrink-0 text-success" />
                            <span className="text-success">
                              {connection.connectionState.displayName}
                            </span>
                          </div>
                        </Show>
                      </div>
                    )}
                  </For>
                </ScrollArea>
              </div>
            </div>
          </Show>

          <Show when={plan?.tables && plan.tables.length > 0}>
            <div className="space-y-2">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col justify -center gap-1 py-2 border-b">
                  <Label class="text-sm font-medium">
                    {t('Tables Changes')} ({plan?.tables?.length || 0})
                  </Label>
                </div>
                <ScrollArea viewPortClassName="max-h-[10vh]">
                  <For each={plan?.tables}>
                    {(table) => (
                      <div
                        key={table.tableState.externalId}
                        className="flex items-center gap-2 text-sm py-1"
                      >
                        <Show
                          when={table.type === TableOperationType.UPDATE_TABLE}
                        >
                          <div className="flex items-center gap-2">
                            <PencilIcon class="w-4 h-4 shrink-0" />
                            <div className="flex items-center gap-1">
                              <span>{table.tableState.name}</span>
                            </div>
                          </div>
                        </Show>
                        <Show
                          when={table.type === TableOperationType.CREATE_TABLE}
                        >
                          <div className="flex items-center gap-2">
                            <Plus class="w-4 h-4 shrink-0 text-success" />
                            <span className="text-success">
                              {table.tableState.name}
                            </span>
                          </div>
                        </Show>
                        <Show
                          when={table.type === TableOperationType.DELETE_TABLE}
                        >
                          <div className="flex items-center gap-2">
                            <TrashIcon class="w-4 h-4 shrink-0 text-destructive" />
                            <span className="text-destructive">
                              {table.tableState.name}
                            </span>
                          </div>
                        </Show>
                      </div>
                    )}
                  </For>
                </ScrollArea>
              </div>
            </div>
          </Show>
          <Show when={errorMessage}>
            <p className="text-sm text-destructive">{errorMessage}</p>
          </Show>
        </div>
      </Show>

      {loading ||
        (!loading && !isThereAnyChanges && (
          <div className="text-sm py-2">{t('No changes to apply')}</div>
        ))}

      <Show when={!loading && isThereAnyChanges}>
        <DialogFooter class=" items-end gap-1 ">
          <Button
            size={'sm'}
            variant={'outline'}
            onClick={() => setOpen(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            size={'sm'}
            loading={isPending}
            disabled={isPending}
            onClick={() => {
              const invalid = name().trim() === '';
              if (invalid) {
                setNameError(t('Release name is required'));
              }
              if (selectedChanges().size === 0 && plan.tables.length === 0) {
                setErrorMessage(
                  t('Please select at least one change to include in the release'),
                );
              }
              if (invalid || (selectedChanges().size === 0 && plan.tables.length === 0)) {
                return;
              }
              const request = {
                name: name(),
                description: description(),
                selectedFlowsIds: Array.from(selectedChanges()),
                projectId: authenticationSession.getProjectId()!,
              };
              switch (diffRequest.type) {
                case ProjectReleaseType.GIT:
                  applyChanges({ ...request, type: diffRequest.type });
                  break;
                case ProjectReleaseType.PROJECT:
                  applyChanges({
                    ...request,
                    targetProjectId: diffRequest.targetProjectId,
                    type: diffRequest.type,
                  });
                  break;
                case ProjectReleaseType.ROLLBACK:
                  applyChanges({
                    ...request,
                    projectReleaseId: diffRequest.projectReleaseId,
                    type: diffRequest.type,
                  });
                  break;
              }
            }}
          >
            {t('Apply Changes')}
          </Button>
        </DialogFooter>
      </Show>
    </>
  );
};

const CreateReleaseDialog = ({
  open,
  setOpen,
  refetch,
  plan,
  loading,
  defaultName = '',
  diffRequest,
}: CreateReleaseDialogProps) => {
  const [name, setName] = createSignal(defaultName);
  const [description, setDescription] = createSignal('');

  createEffect(() => {
    if (!open) {
      return;
    }
    setName(defaultName);
    setDescription('');
  });

  return (
    <Dialog
      modal={true}
      open={open}
      onOpenChange={setOpen}
    >
      <DialogContent class="min-h-[100px] max-h-[850px] flex flex-col">
        <DialogHeader class="shrink-0">
          <DialogTitle>
            {diffRequest.type === ProjectReleaseType.GIT
              ? t('Create Git Release')
              : diffRequest.type === ProjectReleaseType.PROJECT
              ? t('Create Project Release')
              : `${t('Create Rollback to')} ${name()}`}
          </DialogTitle>
        </DialogHeader>

        <CreateReleaseDialogContent
          key={`${loading}`}
          loading={loading}
          diffRequest={diffRequest}
          plan={plan}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          setOpen={setOpen}
          refetch={refetch}
        />
      </DialogContent>
    </Dialog>
  );
};

export { CreateReleaseDialog };
