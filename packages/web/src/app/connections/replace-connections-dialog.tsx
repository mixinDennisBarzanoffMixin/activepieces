import {
  AppConnectionScope,
  PopulatedFlow,
  SeekPage,
} from '@activepieces/shared';
import { useNavigate } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { GlobeIcon, WorkflowIcon } from 'lucide-solid';
import { createSignal, createMemo, type JSX, Show, For } from 'solid-js';
import { toast } from 'solid-sonner';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  appConnectionsMutations,
  appConnectionsQueries,
} from '@/features/connections';
import { flowsApi } from '@/features/flows';
import { PieceIconWithPieceName, piecesHooks } from '@/features/pieces';
import { cn } from '@/lib/utils';

type ReplaceConnectionsDialogProps = {
  onConnectionMerged: () => void;
  children: JSX.Element;
  projectId: string;
};

type FormData = {
  pieceName: string;
  sourceConnections: { id: string; externalId: string };
  replacedWithConnection: { id: string; externalId: string };
};

enum STEP {
  SELECT = 'SELECT',
  CONFIRM = 'CONFIRM',
}

const ReplaceConnectionsDialog = (props: ReplaceConnectionsDialogProps) => {
  const projectId = () => props.projectId;
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [step, setStep] = createSignal<STEP>(STEP.SELECT);
  const [affectedFlows, setAffectedFlows] = createSignal<Array<PopulatedFlow>>(
    [],
  );
  const { pieces, isLoading: piecesLoading } = piecesHooks.usePieces({});

  const { data: connections, isLoading: connectionsLoading } =
    appConnectionsQueries.useAppConnections({
      request: {
        projectId: projectId(),
        limit: 1000,
      },
      extraKeys: [projectId()],
    });

  const { mutate: replaceConnections, isPending: isReplacing } =
    appConnectionsMutations.useReplaceConnections({
      setDialogOpen,
      refetch: () => props.onConnectionMerged(),
    });

  const { mutate: fetchAffectedFlows, isPending: isFetchingAffectedFlows } =
    createMutation(() => ({
      mutationFn: async (externalId: string) => {
        const response: SeekPage<PopulatedFlow> = await flowsApi.list({
          projectId: projectId(),
          connectionExternalIds: [externalId],
          cursor: undefined,
          limit: 1000,
        });
        return response;
      },
      onSuccess: (data: SeekPage<PopulatedFlow>) => {
        setAffectedFlows(data.data);
        setStep(STEP.CONFIRM);
      },
      onError: () => {
        toast.error(t('Error'), {
          description: t('Failed to get affected flows'),
        });
      },
    }));

  const empty = {
    pieceName: '',
    sourceConnections: { id: '', externalId: '' },
    replacedWithConnection: { id: '', externalId: '' },
  };
  const [form, setForm] = createSignal<FormData>(empty);
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const selectedPiece = () => form().pieceName;

  const piecesOptions = createMemo(() => {
    const names = new Set(connections?.data.map((conn) => conn.pieceName));
    if (!pieces) return [];
    return pieces
      .filter(
        (piece) =>
          piece.name !== '@activepieces/piece-mcp' &&
          piece.name !== '@activepieces/piece-webhook' &&
          names.has(piece.name),
      )
      .map((piece) => ({
        label: piece.displayName,
        value: piece.name,
      }));
  });

  const filteredConnections = createMemo(
    () =>
      connections?.data.filter((conn) => conn.pieceName === selectedPiece()) ??
      [],
  );

  const sourceConnectionId = () => form().sourceConnections.id;

  const replacedWithOptions = createMemo(() => {
    return filteredConnections()
      .filter((conn) => conn.id !== sourceConnectionId())
      .map((conn) => ({
        label: conn.displayName,
        value: conn.id,
      }));
  });

  const sourceOptions = createMemo(() =>
    filteredConnections()
      .filter((conn) => conn.scope === AppConnectionScope.PROJECT)
      .map((conn) => ({
        label: conn.displayName,
        value: conn.id,
      })),
  );

  const handleBack = () => {
    setStep(STEP.SELECT);
    setAffectedFlows([]);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form().pieceName) next.pieceName = t('Please select a piece');
    if (!form().sourceConnections.id) {
      next.sourceConnections = t('Please select a connection to replace');
    }
    if (!form().replacedWithConnection.id) {
      next.replacedWithConnection = t(
        'Please select a connection to replace with',
      );
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleConfirmedSubmit = () => {
    if (!validate()) {
      return;
    }

    replaceConnections({
      sourceAppConnectionId: form().sourceConnections.id,
      targetAppConnectionId: form().replacedWithConnection.id,
      projectId: projectId(),
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    setForm(empty);
    setErrors({});
    setStep(STEP.SELECT);
    setAffectedFlows([]);
  };
  const navigate = useNavigate();

  return (
    <Dialog open={dialogOpen()} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent class="flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step() === STEP.SELECT
              ? t('Replace Connections')
              : t('Confirm Replacement')}
          </DialogTitle>
          <DialogDescription>
            <Show
              when={step() === STEP.SELECT}
              fallback={
                <>
                  {t(
                    'Existing MCP servers will not be changed automatically, you have to reconnect them manually.',
                  )}
                </>
              }
            >
              {t(
                'This will replace one connection with another connection, existing flows will be changed to use the new connection, and the old connection will be deleted.',
              )}
            </Show>
          </DialogDescription>
        </DialogHeader>

        <Show
          when={step() === STEP.SELECT}
          fallback={
            <div class="flex flex-col gap-4">
              <ScrollArea
                class={cn(
                  'h-[275px]',
                  affectedFlows().length === 0 && 'h-[80px]',
                )}
              >
                <div class="flex flex-col gap-2">
                  <Show
                    when={affectedFlows().length === 0}
                    fallback={
                      <For each={affectedFlows()}>
                        {(flow) => (
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                              <WorkflowIcon class="w-5 h-5" />
                              <Button
                                variant="link"
                                class="p-0 h-auto font-medium text-foreground truncate text-base"
                                onClick={() => {
                                  navigate(
                                    `/projects/${flow.projectId}/flows/${flow.id}`,
                                  );
                                }}
                              >
                                {flow.version.displayName}
                              </Button>
                            </div>
                          </div>
                        )}
                      </For>
                    }
                  >
                    <span class="text-center text-muted-foreground p-4">
                      {t('No flows will be affected by this change')}
                    </span>
                  </Show>
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button type="button" variant="accent" onClick={handleBack}>
                  {t('Back')}
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmedSubmit}
                  loading={isReplacing}
                >
                  {t('Replace')}
                </Button>
              </DialogFooter>
            </div>
          }
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (validate()) {
                fetchAffectedFlows(form().sourceConnections.externalId);
              }
            }}
            class="flex flex-col gap-4"
          >
            <div class="flex flex-col gap-2">
              <Label>{t('Piece')}</Label>
              <SearchableSelect
                value={form().pieceName}
                onChange={(value) => {
                  setForm((prev) => ({
                    ...prev,
                    pieceName: value,
                    sourceConnections: {
                      id: '',
                      externalId: '',
                    },
                    replacedWithConnection: {
                      id: '',
                      externalId: '',
                    },
                  }));
                }}
                options={piecesOptions()}
                placeholder={t('Select a piece')}
                loading={piecesLoading}
                valuesRendering={(value) => {
                  const piece = pieces?.find((p) => p.name === value);
                  return (
                    <div class="flex gap-2 items-center">
                      <img
                        src={piece!.logoUrl}
                        alt={piece!.displayName}
                        class="w-4 h-4 object-contain"
                      />
                      <span>{piece!.displayName}</span>
                    </div>
                  );
                }}
              />
              <Show when={errors().pieceName}>
                <p class="text-sm font-medium text-destructive wrap-break-word">
                  {errors().pieceName}
                </p>
              </Show>
            </div>

            <Show when={selectedPiece()}>
              <>
                <div class="flex flex-col gap-2">
                  <Label>{t('Connection to replace')}</Label>
                  <SearchableSelect
                    value={form().sourceConnections.id}
                    loading={connectionsLoading}
                    onChange={(value) => {
                      const selectedConnection = filteredConnections().find(
                        (c) => c.id === value,
                      );
                      setForm((prev) => ({
                        ...prev,
                        sourceConnections: {
                          id: selectedConnection?.id || '',
                          externalId: selectedConnection?.externalId || '',
                        },
                        replacedWithConnection: {
                          id: '',
                          externalId: '',
                        },
                      }));
                    }}
                    options={sourceOptions()}
                    placeholder={t('Choose connection to replace')}
                    valuesRendering={(value) => {
                      const conn = filteredConnections().find(
                        (c) => c.id === value,
                      );
                      return (
                        <div class="flex gap-2 items-center">
                          <PieceIconWithPieceName
                            pieceName={conn!.pieceName}
                            size="xs"
                            border={false}
                          />
                          <span>{conn!.displayName}</span>
                        </div>
                      );
                    }}
                  />
                  <Show when={errors().sourceConnections}>
                    <p class="text-sm font-medium text-destructive wrap-break-word">
                      {errors().sourceConnections}
                    </p>
                  </Show>
                </div>

                <Show when={selectedPiece()}>
                  <div class="flex flex-col gap-2">
                    <Label>{t('Replaced With')}</Label>
                    <SearchableSelect
                      value={form().replacedWithConnection.id}
                      loading={connectionsLoading}
                      onChange={(value) => {
                        const selectedConnection = filteredConnections().find(
                          (c) => c.id === value,
                        );
                        setForm((prev) => ({
                          ...prev,
                          replacedWithConnection: {
                            id: selectedConnection?.id || '',
                            externalId: selectedConnection?.externalId || '',
                          },
                        }));
                      }}
                      options={replacedWithOptions}
                      placeholder={t('Choose connection to replace with')}
                      valuesRendering={(value) => {
                        const conn = filteredConnections().find(
                          (c) => c.id === value,
                        );
                        return (
                          <div class="flex gap-2 items-center">
                            <PieceIconWithPieceName
                              pieceName={conn!.pieceName}
                              size="xs"
                              border={false}
                            />
                            <Show
                              when={conn?.scope === AppConnectionScope.PLATFORM}
                            >
                              <GlobeIcon class="w-4 h-4" />
                            </Show>
                            <span>{conn!.displayName}</span>
                          </div>
                        );
                      }}
                    />
                    <Show when={errors().replacedWithConnection}>
                      <p class="text-sm font-medium text-destructive wrap-break-word">
                        {errors().replacedWithConnection}
                      </p>
                    </Show>
                  </div>
                </Show>
              </>
            </Show>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  {t('Cancel')}
                </Button>
              </DialogClose>
              <Button type="submit" loading={isFetchingAffectedFlows}>
                {t('Next')}
              </Button>
            </DialogFooter>
          </form>
        </Show>
      </DialogContent>
    </Dialog>
  );
};

export { ReplaceConnectionsDialog };
