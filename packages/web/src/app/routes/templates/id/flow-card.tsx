import { FlowVersionTemplate } from '@activepieces/shared';
import { Workflow } from 'lucide-solid';
import { Show } from 'solid-js';

import { Card, CardContent } from '@/components/ui/card';
import { PieceIconList } from '@/features/pieces';

type FlowCardProps = {
  flow: FlowVersionTemplate;
  isSelected: boolean;
  singleFlow: boolean;
  onClick: () => void;
};

export const FlowCard = (props: FlowCardProps) => {
  return (
    <Card
      onClick={props.onClick}
      variant={props.singleFlow ? 'default' : 'interactive'}
      isSelected={!props.singleFlow && props.isSelected}
    >
      <CardContent class="p-4 flex items-center gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <Workflow class="w-4 h-4 shrink-0" />
            <span class="font-medium text-sm leading-tight truncate">
              {props.flow.displayName}
            </span>
          </div>
          <Show when={props.flow.description}>
            <p class="text-xs text-muted-foreground line-clamp-2">
              {props.flow.description}
            </p>
          </Show>
        </div>

        <Show when={props.flow.trigger}>
          <div class="h-6 px-3 flex items-center rounded-md shrink-0">
            <PieceIconList
              trigger={props.flow.trigger}
              maxNumberOfIconsToShow={3}
              size="md"
              class="flex gap-1.5"
              background="white"
              excludeCore={true}
            />
          </div>
        </Show>
      </CardContent>
    </Card>
  );
};
