import {
  AgentFlowTool,
  AgentToolType,
  mcpToolNameUtils,
  PopulatedFlow,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Workflow } from 'lucide-solid';
import { Accessor, For, createMemo, Show } from 'solid-js';

import { Checkbox } from '@/components/ui/checkbox';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { useDebounce } from '@/lib/debounce';

import { CreateMcpFlowButton } from './create-mcp-flow-button';
import { flowDialogUtils } from './flow-dialog-utils';

interface FlowDialogContentProps {
  flows: Accessor<PopulatedFlow[]>;
  selectedFlows: Accessor<AgentFlowTool[]>;
  setSelectedFlows: (
    value: AgentFlowTool[] | ((prev: AgentFlowTool[]) => AgentFlowTool[]),
  ) => void;
  searchQuery: Accessor<string>;
}

export const FlowDialogContent = (props: FlowDialogContentProps) => {
  const [debouncedQuery] = useDebounce(() => props.searchQuery(), 300);

  const filteredFlows = createMemo(() => {
    if (!debouncedQuery()) return props.flows();

    const query = debouncedQuery().toLowerCase();
    return props
      .flows()
      .filter((flow) => flow.version.displayName.toLowerCase().includes(query));
  });

  const isSelected = (flow: PopulatedFlow) =>
    props
      .selectedFlows()
      .some((tool) => tool.externalFlowId === flow.externalId);

  const toggleFlow = (flow: PopulatedFlow) => {
    props.setSelectedFlows((prev) => {
      const exists = prev.some(
        (tool) => tool.externalFlowId === flow.externalId,
      );

      if (exists) {
        return prev.filter((tool) => tool.externalFlowId !== flow.externalId);
      }

      return [
        ...prev,
        {
          externalFlowId: flow.externalId,
          toolName: mcpToolNameUtils.createToolName(
            `${flow.version.displayName}_${flow.id}`,
          ),
          flowDisplayName: flow.version.displayName,
          type: AgentToolType.FLOW,
        },
      ];
    });
  };

  return (
    <>
      <div class="flex flex-col px-4 py-2">
        <For each={filteredFlows()}>
          {(flow, index) => {
            const helperText = flowDialogUtils.getFlowTooltip(flow);
            const isSelectable = flowDialogUtils.isFlowSelectable(flow);
            const selected = isSelected(flow);

            return (
              <div>
                <div
                  class={`
                  flex items-center gap-4 px-4 py-2 h-14 rounded-md cursor-pointer
                  hover:bg-accent hover:text-accent-foreground
                  ${selected ? 'bg-accent' : ''}
                  ${!isSelectable ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                  onClick={() => isSelectable && toggleFlow(flow)}
                >
                  <Checkbox
                    checked={selected}
                    disabled={!isSelectable}
                    onCheckedChange={() => isSelectable && toggleFlow(flow)}
                    onClick={(e: MouseEvent) => e.stopPropagation()}
                  />

                  <div class="flex-1 min-w-0">
                    <div class="truncate text-sm font-medium">
                      {flow.version.displayName}
                    </div>

                    <Show when={helperText}>
                      <div class="text-xs text-muted-foreground truncate">
                        {helperText}
                      </div>
                    </Show>
                  </div>

                  <PieceIconList
                    trigger={flow.version.trigger}
                    maxNumberOfIconsToShow={3}
                  />
                </div>

                <Show when={index() < filteredFlows().length - 1}>
                  <div class="h-px bg-border my-1" />
                </Show>
              </div>
            );
          }}
        </For>
      </div>

      <Show when={filteredFlows().length === 0}>
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <div class="mb-5 flex size-14 items-center justify-center rounded-xl border bg-muted/40">
            <Workflow class="size-7 text-muted-foreground" />
          </div>

          <div class="text-base font-semibold text-foreground">
            {t('No flows found')}
          </div>

          <div class="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {props.searchQuery()
              ? t('Try adjusting your search or create a new flow.')
              : t('Create a flow to use it as a tool in your agent.')}
          </div>

          <Show when={!props.searchQuery()}>
            <div class="mt-6">
              <CreateMcpFlowButton />
            </div>
          </Show>
        </div>
      </Show>
    </>
  );
};
