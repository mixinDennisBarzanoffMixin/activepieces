import {
  FlowProjectOperationType,
  FlowProjectOperation,
} from '@activepieces/shared';
import { PencilIcon, Plus, TrashIcon } from 'lucide-solid';
import { Show } from 'solid-js';

import { Checkbox } from '@/components/ui/checkbox';

const renderDiffInfo = (flowName: string, icon: JSX.Element) => (
  <div class="flex items-center justify-between text-sm hover:bg-accent/20 rounded-md py-1">
    <div class="flex items-center gap-2">
      {icon}
      {flowName}
    </div>
  </div>
);

type OperationChangeProps = {
  change: FlowProjectOperation;
  selected: boolean;
  onSelect: (selected: boolean) => void;
};

export const OperationChange = (props: OperationChangeProps) => {
  const content = () => {
    switch (props.change.type) {
      case FlowProjectOperationType.CREATE_FLOW:
        return renderDiffInfo(
          props.change.flow.displayName,
          <Plus class="w-4 h-4 shrink-0" />,
        );
      case FlowProjectOperationType.UPDATE_FLOW:
        return renderDiffInfo(
          props.change.targetFlow.displayName,
          <PencilIcon class="w-4 h-4 shrink-0" />,
        );
      case FlowProjectOperationType.DELETE_FLOW:
        return renderDiffInfo(
          props.change.flow.displayName,
          <TrashIcon class="w-4 h-4 shrink-0" />,
        );
    }
  };

  return (
    <>
      <Show when={props.change.type === FlowProjectOperationType.CREATE_FLOW}>
        <div class="flex gap-2 text-success items-center">
          <Checkbox checked={props.selected} onCheckedChange={props.onSelect} />
          {content()}
        </div>
      </Show>
      <Show when={props.change.type === FlowProjectOperationType.UPDATE_FLOW}>
        <div class="flex gap-2 items-center">
          <Checkbox checked={props.selected} onCheckedChange={props.onSelect} />
          {content()}
        </div>
      </Show>
      <Show when={props.change.type === FlowProjectOperationType.DELETE_FLOW}>
        <div class="flex gap-2 text-destructive items-center">
          <Checkbox checked={props.selected} onCheckedChange={props.onSelect} />
          {content()}
        </div>
      </Show>
    </>
  );
};
