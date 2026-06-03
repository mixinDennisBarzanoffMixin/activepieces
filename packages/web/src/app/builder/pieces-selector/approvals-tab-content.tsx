import { FlowActionType, FlowOperationType, isNil } from '@activepieces/shared';
import { For, Show, createMemo } from 'solid-js';

import { CardList, CardListItemSkeleton } from '@/components/custom/card-list';
import {
  piecesHooks,
  PieceSelectorTabType,
  usePieceSelectorTabs,
  PieceSelectorOperation,
  stepUtils,
} from '@/features/pieces';

import { useBuilderStateContext } from '../builder-hooks';

import GenericActionOrTriggerItem from './generic-piece-selector-item';

const APPROVAL_PIECES_CONFIG = [
  {
    pieceName: '@activepieces/piece-slack',
    approvalActionNames: [
      'request_approval_message',
      'request_approval_direct_message',
    ],
  },
  {
    pieceName: '@activepieces/piece-discord',
    approvalActionNames: ['request_approval_message'],
  },
  {
    pieceName: '@activepieces/piece-microsoft-teams',
    approvalActionNames: [
      'request_approval_direct_message',
      'request_approval_in_channel',
    ],
  },
  {
    pieceName: '@activepieces/piece-microsoft-outlook',
    approvalActionNames: ['request_approval_in_mail'],
  },
  {
    pieceName: '@activepieces/piece-gmail',
    approvalActionNames: ['request_approval_in_mail'],
  },
  {
    pieceName: '@activepieces/piece-telegram-bot',
    approvalActionNames: ['request_approval_message'],
  },
];

const ApprovalsTabContent = (props: { operation: PieceSelectorOperation }) => {
  const { selectedTab } = usePieceSelectorTabs();
  const [handleAddingOrUpdatingStep] = useBuilderStateContext((state) => [
    state.handleAddingOrUpdatingStep,
  ]);

  const queries = piecesHooks.useMultiplePieces({
    names: APPROVAL_PIECES_CONFIG.map((cfg) => cfg.pieceName),
  });

  const active = createMemo(
    () =>
      selectedTab === PieceSelectorTabType.APPROVALS &&
      [FlowOperationType.ADD_ACTION, FlowOperationType.UPDATE_ACTION].includes(
        props.operation.type,
      ),
  );

  const loading = createMemo(() => queries.some((query) => query.isLoading));
  const loaded = createMemo(() =>
    queries.every((query) => query.isSuccess && !isNil(query.data)),
  );

  const actions = createMemo(() =>
    queries.flatMap((query) => {
      if (!query.data) return [];

      const cfg = APPROVAL_PIECES_CONFIG.find(
        (cfg) => cfg.pieceName === query.data.name,
      );
      if (isNil(cfg)) return [];
      const metadata = stepUtils.mapPieceToMetadata({
        piece: query.data,
        type: 'action',
      });

      return cfg.approvalActionNames.flatMap((name) => {
        if (!Object.hasOwn(query.data.actions, name)) return [];

        return {
          action: query.data.actions[name],
          pieceMetadata: metadata,
        };
      });
    }),
  );

  return (
    <Show when={active()}>
      <Show
        when={!loading() && loaded()}
        fallback={
          <div class="flex flex-col gap-2 w-full p-2">
            <CardListItemSkeleton numberOfCards={3} withCircle={false} />
          </div>
        }
      >
        <CardList listClassName="gap-0">
          <For each={actions()}>
            {(item) => (
              <GenericActionOrTriggerItem
                key={`${item.pieceMetadata.pieceName}-${item.action.name}`}
                item={{
                  actionOrTrigger: item.action,
                  type: FlowActionType.PIECE,
                  pieceMetadata: item.pieceMetadata,
                }}
                hidePieceIconAndDescription={false}
                stepMetadataWithSuggestions={{
                  ...item.pieceMetadata,
                  suggestedActions: [item.action],
                  suggestedTriggers: [],
                }}
                onClick={() => {
                  handleAddingOrUpdatingStep({
                    pieceSelectorItem: {
                      actionOrTrigger: item.action,
                      type: FlowActionType.PIECE,
                      pieceMetadata: item.pieceMetadata,
                    },
                    operation: props.operation,
                    selectStepAfter: true,
                  });
                }}
              />
            )}
          </For>
        </CardList>
      </Show>
    </Show>
  );
};

export { ApprovalsTabContent };
