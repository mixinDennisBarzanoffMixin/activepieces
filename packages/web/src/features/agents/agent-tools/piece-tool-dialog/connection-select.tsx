import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { createSignal, mergeProps, Show, untrack } from 'solid-js';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { CreateOrEditConnectionDialog } from '@/features/connections';
import { appConnectionsQueries } from '@/features/connections/hooks/app-connections-hooks';
import { authenticationSession } from '@/lib/authentication-session';

type ConnectionDropdownProps = {
  piece: PieceMetadataModelSummary;
  value: string | null;
  onInput: (connectionExternalId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  showError?: boolean;
};

function unwrapConnection(input?: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;

  const match = input.match(/^\{\{connections\['([^']+)'\]\}\}$/);
  return match?.[1];
}

export const ConnectionDropdown = (_props: ConnectionDropdownProps) => {
  const pieceName = untrack(() => _props.piece.name);
  const props = mergeProps(
    {
      disabled: false,
      showError: false,
      placeholder: t('Select a connection'),
    },
    _props,
  );
  const [connectionDialogOpen, setConnectionDialogOpen] = createSignal(false);

  const {
    data: connections,
    isLoading: connectionsLoading,
    refetch: refetchConnections,
    isRefetching: isRefetchingConnections,
  } = appConnectionsQueries.useAppConnections({
    request: {
      pieceName,
      projectId: authenticationSession.getProjectId()!,
      limit: 1000,
    },
    extraKeys: [pieceName, authenticationSession.getProjectId()!],
    staleTime: 0,
  });

  const connectionOptions =
    connections?.data.map((connection) => ({
      label: connection.displayName,
      value: connection.externalId,
    })) ?? [];

  const connectionOptionsWithNewConnectionOption = [
    { label: t('+ New Connection'), value: '' },
    ...connectionOptions,
  ];

  const handleChange = (selectedValue: string | null) => {
    if (selectedValue) {
      props.onInput(`{{connections['${selectedValue}']}}`);
    } else {
      setConnectionDialogOpen(true);
    }
  };

  return (
    <Show when={props.piece}>
      {(piece) => (
        <>
          <CreateOrEditConnectionDialog
            piece={piece()}
            open={connectionDialogOpen}
            setOpen={(open, connection) => {
              setConnectionDialogOpen(open);
              if (connection) {
                props.onInput(`{{connections['${connection.externalId}']}}`);
                void refetchConnections();
              }
            }}
            reconnectConnection={null}
            isGlobalConnection={false}
          />

          <div class="space-y-2">
            <SearchableSelect
              value={unwrapConnection(props.value)}
              onInput={handleChange}
              options={connectionOptionsWithNewConnectionOption}
              placeholder={props.placeholder}
              loading={connectionsLoading || isRefetchingConnections}
              disabled={props.disabled}
              showDeselect={!props.disabled && props.value !== null}
              triggerClassName={
                props.showError ? 'border-destructive' : undefined
              }
            />
            <Show when={props.showError}>
              <p class="text-sm font-medium text-destructive break-words">
                {t('Connection is required')}
              </p>
            </Show>
          </div>
        </>
      )}
    </Show>
  );
};
