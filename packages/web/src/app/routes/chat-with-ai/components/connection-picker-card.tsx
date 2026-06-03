import { PieceMetadataModel } from '@activepieces/pieces-framework';
import {
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Check, Plus, RefreshCw } from 'lucide-solid';
import { motion } from 'motion/react';
import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  For,
  mergeProps,
  Show,
} from 'solid-js';

import { Button } from '@/components/ui/button';
import { CreateOrEditConnectionDialog } from '@/features/connections';
import { appConnectionsApi } from '@/features/connections/api/app-connections';
import { piecesApi } from '@/features/pieces/api/pieces-api';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { authenticationSession } from '@/lib/authentication-session';

import {
  ConnectionPickerData,
  normalizePieceName,
} from '../lib/message-parsers';

function isConnectionHealthy(status: AppConnectionStatus): boolean {
  return status === AppConnectionStatus.ACTIVE;
}

function connectionStatusLabel(status: AppConnectionStatus): string | null {
  if (status === AppConnectionStatus.ERROR) return t('Expired');
  if (status === AppConnectionStatus.MISSING) return t('Missing');
  return null;
}

function SelectedState(props: {
  pieceName: string;
  connection: ConnectionPickerData['connections'][number];
  displayName: string;
}) {
  return (
    <motion.div
      class="rounded-xl border bg-background overflow-hidden my-2"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div class="p-4 flex items-center gap-3">
        <div class="relative">
          <PieceIconWithPieceName
            pieceName={props.pieceName}
            size="sm"
            border={false}
            showTooltip={false}
          />
          <div class="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5">
            <Check class="h-2 w-2 text-white" />
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold">{props.connection.label}</div>
          <div class="text-xs text-muted-foreground">
            {t('Using this {name} account', { name: props.displayName })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function useLiveConnections({
  connections,
  pieceName,
  enabled,
}: {
  connections: Accessor<ConnectionPickerData['connections']>;
  pieceName: Accessor<string>;
  enabled: Accessor<boolean>;
}): {
  statuses: Accessor<Record<string, AppConnectionStatus>>;
  fullConnections: Accessor<Record<string, AppConnectionWithoutSensitiveData>>;
  isLoading: Accessor<boolean>;
} {
  const [statuses, setStatuses] = createSignal<
    Record<string, AppConnectionStatus>
  >({});
  const [isLoading, setIsLoading] = createSignal(false);
  const [fullConnections, setFullConnections] = createSignal<
    Record<string, AppConnectionWithoutSensitiveData>
  >({});

  const projectIdsKey = createMemo(() =>
    [...new Set(connections().map((c) => c.projectId))].sort().join(','),
  );

  createEffect(() => {
    if (!enabled() || !projectIdsKey()) return;
    let cancelled = false;
    setIsLoading(true);

    const projectIds = projectIdsKey().split(',');

    void Promise.all(
      projectIds.map(async (projectId) => {
        const effectiveProjectId =
          projectId || authenticationSession.getProjectId();
        if (!effectiveProjectId) return [];
        const result = await appConnectionsApi.list({
          projectId: effectiveProjectId,
          pieceName: pieceName(),
          limit: 100,
        });
        return result.data;
      }),
    )
      .then((results) => {
        if (cancelled) return;
        const statusMap: Record<string, AppConnectionStatus> = {};
        const connMap: Record<string, AppConnectionWithoutSensitiveData> = {};
        for (const conns of results) {
          for (const conn of conns) {
            statusMap[conn.externalId] = conn.status;
            connMap[conn.externalId] = conn;
          }
        }
        setFullConnections(connMap);
        setStatuses(statusMap);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  });

  return { statuses, fullConnections, isLoading };
}

export function ConnectionPickerCard(_props: ConnectionPickerCardProps) {
  const props = mergeProps({ isInteractive: true }, _props);
  const queryClient = useQueryClient();
  const pieceName = createMemo(() => normalizePieceName(props.picker.piece));
  const filteredPicker = createMemo(() => {
    if (!props.selectedProjectId) return props.picker;
    const filtered = props.picker.connections.filter(
      (c) => c.projectId === props.selectedProjectId,
    );
    return { ...props.picker, connections: filtered };
  });
  const [pieceModel, setPieceModel] = createSignal<PieceMetadataModel>();
  const [isPieceLoading, setIsPieceLoading] = createSignal(false);
  const [connectDialogOpen, setConnectDialogOpen] = createSignal(false);
  const [reconnectConnection, setReconnectConnection] =
    createSignal<AppConnectionWithoutSensitiveData | null>(null);
  const [selectedConnection, setSelectedConnection] = createSignal<
    ConnectionPickerData['connections'][number] | null
  >(null);

  const {
    statuses: liveStatuses,
    fullConnections,
    isLoading: isLoadingStatuses,
  } = useLiveConnections({
    connections: () => filteredPicker().connections,
    pieceName,
    enabled: () => props.isInteractive && !selectedConnection(),
  });

  createEffect(() => {
    setIsPieceLoading(true);
    void piecesApi
      .get({ name: pieceName() })
      .then((piece) => {
        setPieceModel(piece);
        setIsPieceLoading(false);
      })
      .catch(() => setIsPieceLoading(false));
  });

  const handleReconnect = (externalId: string) => {
    const fullConnection = fullConnections()[externalId];
    if (!fullConnection) return;
    setReconnectConnection(fullConnection);
    setConnectDialogOpen(true);
  };

  const handleNewConnection = () => {
    setReconnectConnection(null);
    setConnectDialogOpen(true);
  };

  return (
    <Show
      when={selectedConnection()}
      fallback={
        <Show
          when={!props.isInteractive}
          fallback={
            <>
              <motion.div
                class="rounded-xl border bg-background overflow-hidden my-2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
              >
                <div class="p-4 pb-3">
                  <h3 class="font-semibold text-base">
                    {t('Which {name} account should I use?', {
                      name: filteredPicker().displayName,
                    })}
                  </h3>
                </div>

                <div class="max-h-64 overflow-auto">
                  <For each={filteredPicker().connections}>
                    {(conn) => {
                      const status =
                        liveStatuses()[conn.externalId] ?? conn.status;
                      const healthy = isConnectionHealthy(status);
                      return (
                        <div class="flex items-center gap-3 px-4 py-3 border-t">
                          <PieceIconWithPieceName
                            pieceName={pieceName()}
                            size="sm"
                            border={false}
                            showTooltip={false}
                          />
                          <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium truncate">
                              {conn.label}
                            </div>
                            <div class="text-xs text-muted-foreground">
                              <Show
                                when={healthy}
                                fallback={`${
                                  conn.project
                                } · ${connectionStatusLabel(status)}`}
                              >
                                {conn.project}
                              </Show>
                            </div>
                          </div>
                          <Show
                            when={healthy}
                            fallback={
                              <Show
                                when={status === AppConnectionStatus.MISSING}
                                fallback={
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    class="shrink-0 gap-1.5"
                                    disabled={
                                      isPieceLoading() || isLoadingStatuses()
                                    }
                                    onClick={() =>
                                      handleReconnect(conn.externalId)
                                    }
                                  >
                                    <RefreshCw class="h-3 w-3" />
                                    {t('Reconnect & Use')}
                                  </Button>
                                }
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  class="shrink-0 gap-1.5"
                                  disabled={isPieceLoading()}
                                  onClick={handleNewConnection}
                                >
                                  <Plus class="h-3 w-3" />
                                  {t('Connect')}
                                </Button>
                              </Show>
                            }
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              class="shrink-0"
                              onClick={() => {
                                setSelectedConnection(conn);
                                props.onSelect(
                                  `Use "${conn.label}" from ${conn.project} (${conn.externalId}).`,
                                );
                              }}
                            >
                              {t('Use')}
                            </Button>
                          </Show>
                        </div>
                      );
                    }}
                  </For>
                </div>

                <div class="flex items-center gap-3 px-4 py-3 border-t bg-muted/30">
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium">
                      {t('Use a different account')}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {t('Connect a new {name} account', {
                        name: filteredPicker().displayName,
                      })}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    class="shrink-0 gap-1.5"
                    disabled={isPieceLoading()}
                    onClick={handleNewConnection}
                  >
                    <Plus class="h-3.5 w-3.5" />
                    {t('Connect')}
                  </Button>
                </div>
              </motion.div>

              <Show when={pieceModel()}>
                {(piece) => (
                  <CreateOrEditConnectionDialog
                    piece={piece()}
                    open={connectDialogOpen()}
                    projectId={props.selectedProjectId}
                    setOpen={(open, createdConnection) => {
                      setConnectDialogOpen(open);
                      if (createdConnection) {
                        void queryClient.invalidateQueries({
                          queryKey: ['app-connections'],
                        });
                        setSelectedConnection({
                          label: createdConnection.displayName,
                          project: '',
                          externalId: createdConnection.externalId,
                          projectId: '',
                          status: AppConnectionStatus.ACTIVE,
                        });
                        props.onSelect(
                          `Connected ${createdConnection.displayName}`,
                        );
                      }
                    }}
                    reconnectConnection={reconnectConnection()}
                    isGlobalConnection={false}
                  />
                )}
              </Show>
            </>
          }
        >
          <motion.div
            class="rounded-xl border bg-background overflow-hidden my-2"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div class="p-4 flex items-center gap-3">
              <div class="relative">
                <PieceIconWithPieceName
                  pieceName={pieceName()}
                  size="sm"
                  border={false}
                  showTooltip={false}
                />
                <div class="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5">
                  <Check class="h-2 w-2 text-white" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold">
                  {t('Which {name} account should I use?', {
                    name: filteredPicker().displayName,
                  })}
                </div>
                <div class="text-xs text-muted-foreground">
                  {t('Connected')}
                </div>
              </div>
            </div>
          </motion.div>
        </Show>
      }
    >
      {(conn) => (
        <SelectedState
          pieceName={pieceName()}
          connection={conn()}
          displayName={filteredPicker().displayName}
        />
      )}
    </Show>
  );
}

type ConnectionPickerCardProps = {
  picker: ConnectionPickerData;
  onSelect: (text: string) => void;
  isInteractive?: boolean;
  selectedProjectId?: string | null;
};
