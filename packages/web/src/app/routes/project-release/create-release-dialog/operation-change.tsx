import {
  FlowProjectOperationType,
  FlowProjectOperation,
} from '@activepieces/shared';
import { PencilIcon, Plus, TrashIcon } from 'lucide-solid';
import { Show } from 'solid-js';

import { Checkbox } from '@/components/ui/checkbox';

const renderDiffInfo = (flowName: string, icon: JSX.Element) => (
  <div className="flex items-center justify-between text-sm hover:bg-accent/20 rounded-md py-1">
    <div className="flex items-center gap-2">
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

export const OperationChange = ({
  change,
  selected,
  onSelect,
}: OperationChangeProps) => {
  return (
    <>
      <Show when={change.type === FlowProjectOperationType.CREATE_FLOW}>
        <div className="flex gap-2 text-success items-center">
          <Checkbox checked={selected} onCheckedChange={onSelect} />
          {renderDiffInfo(
            change.flow.displayName,
            <Plus class="w-4 h-4 shrink-0" />,
          )}
        </div>
      </Show>
      <Show when={change.type === FlowProjectOperationType.UPDATE_FLOW}>
        <div className="flex gap-2 items-center">
          <Checkbox checked={selected} onCheckedChange={onSelect} />
          {renderDiffInfo(
            change.targetFlow.displayName,
            <PencilIcon class="w-4 h-4 shrink-0" />,
          )}
        </div>
      </Show>
      <Show when={change.type === FlowProjectOperationType.DELETE_FLOW}>
        <div className="flex gap-2 text-destructive items-center">
          <Checkbox checked={selected} onCheckedChange={onSelect} />
          {renderDiffInfo(
            change.flow.displayName,
            <TrashIcon class="w-4 h-4 shrink-0" />,
          )}
        </div>
      </Show>
    </>
  );
};
OperationChange.displayName = 'OperationChange';
