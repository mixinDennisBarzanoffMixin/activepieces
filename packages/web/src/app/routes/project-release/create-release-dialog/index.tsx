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

const CreateReleaseDialogContent = (props: CreateReleaseDialogContentProps) => {
  const isThereAnyChanges =
    props.plan.flows.length > 0 || props.plan.tables.length > 0;

  const { mutate: applyChanges, isPending } =
    projectReleaseMutations.useApplyRelease({
      onSuccess: () => {
        props.refetch();
        props.setOpen(false);
      },
    });
  const [selectedChanges, setSelectedChanges] = createSignal<Set<string>>(
    new Set(props.plan.flows.map((op) => op.flow.id)),
  );
  const [errorMessage, setErrorMessage] = createSignal('');
  const [nameError, setNameError] = createSignal('');

  const handleSelectAll = (checked: boolean) => {
    setSelectedChanges(
      new Set(checked ? props.plan.flows.map((op) => op.flow.id) : []),
    );
  };

  return (
    <>
      <Show when={props.loading}>
        <div class="flex items-center justify-center h-24">
          <LoadingSpinner />
        </div>
      </Show>

      <Show when={!props.loading && isThereAnyChanges}>
        <div class="space-y-4">
          <div class="flex flex-col gap-2">
            <Label class="text-sm" for="name">
              {t('Name')}
            </Label>
            <Input
              id="name"
              value={props.name()}
              onInput={(event) => {
                props.setName(event.currentTarget.value);
                setNameError('');
              }}
              placeholder={t('Meeting Summary Flow')}
            />
            <Show when={nameError()}>
              <p class="text-sm text-destructive">{nameError()}</p>
            </Show>
          </div>
          <div class="flex flex-col gap-2">
            <Label class="text-sm" for="description">
              {t('Description')}
            </Label>
            <Textarea
              id="description"
              value={props.description()}
              onInput={(event) =>
                props.setDescription(event.currentTarget.value)
              }
              placeholder={t('Added new features and fixed bugs')}
            />
          </div>
          <Show when={props.plan.flows.length > 0}>
            <div class="space-y-2 ">
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2 py-2 border-b">
                  <Checkbox
                    checked={selectedChanges().size === props.plan.flows.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label class="text-sm font-medium">
                    {t('Flows Changes')} ({selectedChanges().size}/
                    {props.plan.flows.length})
                  </Label>
                </div>
              </div>
              <ScrollArea viewPortClassName="max-h-[15vh]">
                <For each={props.plan.flows}>
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
          <Show when={props.plan.connections.length > 0}>
            <div class="space-y-2">
              <div class="flex flex-col gap-2">
                <div class="flex flex-col justify -center gap-1 py-2 border-b">
                  <Label class="text-sm font-medium">
                    {t('Connections Changes')} ({props.plan.connections.length})
                  </Label>
                  <div class="flex items-center text-sm text-muted-foreground">
                    <span class="flex items-center gap-2">
                      {t(
                        'New connections are placeholders and need to be reconnected again',
                      )}
                    </span>
                  </div>
                </div>
                <ScrollArea viewPortClassName="max-h-[10vh]">
                  <For each={props.plan.connections}>
                    {(connection) => (
                      <div class="flex items-center gap-2 text-sm py-1">
                        <Show
                          when={
                            connection.type ===
                            ConnectionOperationType.UPDATE_CONNECTION
                          }
                        >
                          <div class="flex items-center gap-2">
                            <PencilIcon class="w-4 h-4 shrink-0" />
                            <div class="flex items-center gap-1">
                              <span>
                                {connection.connectionState.displayName}
                              </span>
                              <span> {t('renamed to')} </span>
                              <span>
                                {'newConnectionState' in connection
                                  ? connection.newConnectionState.displayName
                                  : ''}
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
                          <div class="flex items-center gap-2">
                            <Plus class="w-4 h-4 shrink-0 text-success" />
                            <span class="text-success">
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

          <Show when={props.plan.tables.length > 0}>
            <div class="space-y-2">
              <div class="flex flex-col gap-2">
                <div class="flex flex-col justify -center gap-1 py-2 border-b">
                  <Label class="text-sm font-medium">
                    {t('Tables Changes')} ({props.plan.tables.length})
                  </Label>
                </div>
                <ScrollArea viewPortClassName="max-h-[10vh]">
                  <For each={props.plan.tables}>
                    {(table) => (
                      <div class="flex items-center gap-2 text-sm py-1">
                        <Show
                          when={table.type === TableOperationType.UPDATE_TABLE}
                        >
                          <div class="flex items-center gap-2">
                            <PencilIcon class="w-4 h-4 shrink-0" />
                            <div class="flex items-center gap-1">
                              <span>{table.tableState.name}</span>
                            </div>
                          </div>
                        </Show>
                        <Show
                          when={table.type === TableOperationType.CREATE_TABLE}
                        >
                          <div class="flex items-center gap-2">
                            <Plus class="w-4 h-4 shrink-0 text-success" />
                            <span class="text-success">
                              {table.tableState.name}
                            </span>
                          </div>
                        </Show>
                        <Show
                          when={table.type === TableOperationType.DELETE_TABLE}
                        >
                          <div class="flex items-center gap-2">
                            <TrashIcon class="w-4 h-4 shrink-0 text-destructive" />
                            <span class="text-destructive">
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
          <Show when={errorMessage()}>
            <p class="text-sm text-destructive">{errorMessage()}</p>
          </Show>
        </div>
      </Show>

      {props.loading ||
        (!props.loading && !isThereAnyChanges && (
          <div class="text-sm py-2">{t('No changes to apply')}</div>
        ))}

      <Show when={!props.loading && isThereAnyChanges}>
        <DialogFooter class=" items-end gap-1 ">
          <Button
            size={'sm'}
            variant={'outline'}
            onClick={() => props.setOpen(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            size={'sm'}
            loading={isPending}
            disabled={isPending}
            onClick={() => {
              const invalid = props.name().trim() === '';
              if (invalid) {
                setNameError(t('Release name is required'));
              }
              if (
                selectedChanges().size === 0 &&
                props.plan.tables.length === 0
              ) {
                setErrorMessage(
                  t(
                    'Please select at least one change to include in the release',
                  ),
                );
              }
              if (
                invalid ||
                (selectedChanges().size === 0 && props.plan.tables.length === 0)
              ) {
                return;
              }
              const request = {
                name: props.name(),
                description: props.description(),
                selectedFlowsIds: Array.from(selectedChanges()),
                projectId: authenticationSession.getProjectId()!,
              };
              switch (props.diffRequest.type) {
                case ProjectReleaseType.GIT:
                  applyChanges({ ...request, type: props.diffRequest.type });
                  break;
                case ProjectReleaseType.PROJECT:
                  applyChanges({
                    ...request,
                    targetProjectId: props.diffRequest.targetProjectId,
                    type: props.diffRequest.type,
                  });
                  break;
                case ProjectReleaseType.ROLLBACK:
                  applyChanges({
                    ...request,
                    projectReleaseId: props.diffRequest.projectReleaseId,
                    type: props.diffRequest.type,
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

const CreateReleaseDialog = (props: CreateReleaseDialogProps) => {
  const [name, setName] = createSignal(props.defaultName ?? '');
  const [description, setDescription] = createSignal('');

  createEffect(() => {
    if (!props.open) {
      return;
    }
    setName(props.defaultName ?? '');
    setDescription('');
  });

  return (
    <Dialog modal={true} open={props.open} onOpenChange={props.setOpen}>
      <DialogContent class="min-h-[100px] max-h-[850px] flex flex-col">
        <DialogHeader class="shrink-0">
          <DialogTitle>
            {props.diffRequest.type === ProjectReleaseType.GIT
              ? t('Create Git Release')
              : props.diffRequest.type === ProjectReleaseType.PROJECT
              ? t('Create Project Release')
              : `${t('Create Rollback to')} ${name()}`}
          </DialogTitle>
        </DialogHeader>

        <CreateReleaseDialogContent
          key={`${props.loading}`}
          loading={props.loading}
          diffRequest={props.diffRequest}
          plan={props.plan}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          setOpen={props.setOpen}
          refetch={props.refetch}
        />
      </DialogContent>
    </Dialog>
  );
};

export { CreateReleaseDialog };
