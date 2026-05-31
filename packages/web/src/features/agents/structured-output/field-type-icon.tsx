import { AgentOutputFieldType } from '@activepieces/shared';
import {
  Type as TextIcon,
  Hash as NumberIcon,
  CheckSquare as BooleanIcon,
} from 'lucide-solid';

interface FieldTypeIconProps {
  type: AgentOutputFieldType;
  className?: string;
}

export const FieldTypeIcon = ({
  type,
  className = 'h-4 w-4',
}: FieldTypeIconProps) => {
  switch (type) {
    case AgentOutputFieldType.TEXT:
      return <TextIcon class={className} />;
    case AgentOutputFieldType.NUMBER:
      return <NumberIcon class={className} />;
    case AgentOutputFieldType.BOOLEAN:
      return <BooleanIcon class={className} />;
    default:
      return null;
  }
};
