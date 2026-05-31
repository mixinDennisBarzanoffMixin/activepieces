import { AppConnectionScope, PopulatedFlow } from '@activepieces/shared';
import { useNavigate } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { GlobeIcon, WorkflowIcon } from 'lucide-solid';
import { createSignal, createMemo, JSX } from 'solid-js';
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

const ReplaceConnectionsDialog = ({
  onConnectionMerged,
  children,
  projectId,
}: ReplaceConnectionsDialogProps) => {
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [step, setStep] = createSignal<STEP>(STEP.SELECT);
  const [affectedFlows, setAffectedFlows] = createSignal<Array<PopulatedFlow>>(
    [],
  );
  const { pieces, isLoading: piecesLoading } = piecesHooks.usePieces({});

  const { data: connections, isLoading: connectionsLoading } =
    appConnectionsQueries.useAppConnections({
      request: {
        projectId,
        limit: 1000,
      },
      extraKeys: [projectId, dialogOpen],
      enabled: dialogOpen,
    });

  const { mutate: replaceConnections, isPending: isReplacing } =
    appConnectionsMutations.useReplaceConnections({
      setDialogOpen,
      refetch: onConnectionMerged,
    });

  const { mutate: fetchAffectedFlows, isPending: isFetchingAffectedFlows } =
    createMutation({
      mutationFn: async (externalId: string) => {
        const response = await flowsApi.list({
          projectId: projectId,
          connectionExternalIds: [externalId],
          cursor: undefined,
          limit: 1000,
        });
        return response;
      },
      onSuccess: (data) => {
        setAffectedFlows(data.data);
        setStep(STEP.CONFIRM);
      },
      onError: () => {
        toast.error(t('Error'), {
          description: t('Failed to get affected flows'),
        });
      },
    });

  const empty = {
    pieceName: '',
    sourceConnections: { id: '', externalId: '' },
    replacedWithConnection: { id: '', externalId: '' },
  };
  const [form, setForm] = createSignal<FormData>(empty);
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const selectedPiece = () => form().pieceName;

  const connectionPieceNames = new Set(
    connections?.data.map((conn) => conn.pieceName),
  );

  const piecesOptions =
    pieces
      ?.filter(
        (piece) =>
          piece.name !== '@activepieces/piece-mcp' &&
          piece.name !== '@activepieces/piece-webhook' &&
          connectionPieceNames.has(piece.name),
      )
      .map((piece) => ({
        label: piece.displayName,
        value: piece.name,
      })) ?? [];

  const filteredConnections =
    connections?.data.filter((conn) => conn.pieceName === selectedPiece()) ?? [];

  const sourceConnectionId = () => form().sourceConnections.id;

  const replacedWithOptions = createMemo(() => {
    return filteredConnections
      .filter((conn) => conn.id !== sourceConnectionId())
      .map((conn) => ({
        label: conn.displayName,
        value: conn.id,
      }));
  });

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
      next.replacedWithConnection = t('Please select a connection to replace with');
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
      projectId: projectId,
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
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent class="flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === STEP.SELECT
              ? t('Replace Connections')
              : t('Confirm Replacement')}
          </DialogTitle>
          <DialogDescription>
            {step === STEP.SELECT ? (
              t(
                'This will replace one connection with another connection, existing flows will be changed to use the new connection, and the old connection will be deleted.',
              )
            ) : (
              <>
                {t(
                  'Existing MCP servers will not be changed automatically, you have to reconnect them manually.',
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === STEP.SELECT ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (validate()) {
                  fetchAffectedFlows(form().sourceConnections.externalId);
                }
              }}
              className="flex flex-col gap-4"
            >
                  <div className="flex flex-col gap-2">
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
                      options={piecesOptions}
                      placeholder={t('Select a piece')}
                      loading={piecesLoading}
                      valuesRendering={(value) => {
                        const piece = pieces?.find((p) => p.name === value);
                        return (
                          <div className="flex gap-2 items-center">
                            <img
                              src={piece!.logoUrl}
                              alt={piece!.displayName}
                              className="w-4 h-4 object-contain"
                            />
                            <span>{piece!.displayName}</span>
                          </div>
                        );
                      }}
                    />
                    {errors().pieceName && (
                      <p class="text-sm font-medium text-destructive wrap-break-word">
                        {errors().pieceName}
                      </p>
                    )}
                  </div>

              {selectedPiece() && (
                <>
                      <div className="flex flex-col gap-2">
                        <Label>{t('Connection to replace')}</Label>
                        <SearchableSelect
                          value={form().sourceConnections.id}
                          loading={connectionsLoading}
                          onChange={(value) => {
                            const selectedConnection = filteredConnections.find(
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
                          options={filteredConnections
                            .filter(
                              (conn) =>
                                conn.scope === AppConnectionScope.PROJECT,
                            )
                            .map((conn) => ({
                              label: conn.displayName,
                              value: conn.id,
                            }))}
                          placeholder={t('Choose connection to replace')}
                          valuesRendering={(value) => {
                            const conn = filteredConnections.find(
                              (c) => c.id === value,
                            );
                            return (
                              <div className="flex gap-2 items-center">
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
                        {errors().sourceConnections && (
                          <p class="text-sm font-medium text-destructive wrap-break-word">
                            {errors().sourceConnections}
                          </p>
                        )}
                      </div>

                  {selectedPiece() && (
                        <div className="flex flex-col gap-2">
                          <Label>{t('Replaced With')}</Label>
                          <SearchableSelect
                            value={form().replacedWithConnection.id}
                            loading={connectionsLoading}
                            onChange={(value) => {
                              const selectedConnection =
                                filteredConnections.find((c) => c.id === value);
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
                              const conn = filteredConnections.find(
                                (c) => c.id === value,
                              );
                              return (
                                <div className="flex gap-2 items-center">
                                  <PieceIconWithPieceName
                                    pieceName={conn!.pieceName}
                                    size="xs"
                                    border={false}
                                  />
                                  {conn?.scope ===
                                    AppConnectionScope.PLATFORM && (
                                    <GlobeIcon class="w-4 h-4" />
                                  )}
                                  <span>{conn!.displayName}</span>
                                </div>
                              );
                            }}
                          />
                          {errors().replacedWithConnection && (
                            <p class="text-sm font-medium text-destructive wrap-break-word">
                              {errors().replacedWithConnection}
                            </p>
                          )}
                        </div>
                  )}
                </>
              )}

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
        ) : (
          <div className="flex flex-col gap-4">
            <ScrollArea
              class={cn('h-[275px]', affectedFlows.length === 0 && 'h-[80px]')}
            >
              <div className="flex flex-col gap-2">
                {affectedFlows.length === 0 ? (
                  <span className="text-center text-muted-foreground p-4">
                    {t('No flows will be affected by this change')}
                  </span>
                ) : (
                  affectedFlows.map((flow) => (
                    <div
                      className="flex items-center justify-between"
                      key={flow.id}
                    >
                      <div className="flex items-center gap-2">
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
                  ))
                )}
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
        )}
      </DialogContent>
    </Dialog>
  );
};

ReplaceConnectionsDialog.displayName = 'ReplaceConnectionsDialog';
export { ReplaceConnectionsDialog };
