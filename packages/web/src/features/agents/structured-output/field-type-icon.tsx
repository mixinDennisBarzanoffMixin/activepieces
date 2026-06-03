import { AgentOutputFieldType } from '@activepieces/shared';
import {
  Type as TextIcon,
  Hash as NumberIcon,
  CheckSquare as BooleanIcon,
} from 'lucide-solid';
import { Match, Switch, mergeProps } from 'solid-js';

interface FieldTypeIconProps {
  type: AgentOutputFieldType;
  class?: string;
  className?: string;
}

export const FieldTypeIcon = (_props: FieldTypeIconProps) => {
  const props = mergeProps({ className: 'h-4 w-4' }, _props);
  const cls = () => props.class ?? props.className;
  return (
    <Switch>
      <Match when={props.type === AgentOutputFieldType.TEXT}>
        <TextIcon class={cls()} />
      </Match>
      <Match when={props.type === AgentOutputFieldType.NUMBER}>
        <NumberIcon class={cls()} />
      </Match>
      <Match when={props.type === AgentOutputFieldType.BOOLEAN}>
        <BooleanIcon class={cls()} />
      </Match>
    </Switch>
  );
};
