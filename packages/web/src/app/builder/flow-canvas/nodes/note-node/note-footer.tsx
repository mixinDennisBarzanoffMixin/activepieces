import { isNil } from '@activepieces/shared';
import { Show } from 'solid-js';

import { ApAvatar } from '@/components/custom/ap-avatar';
import { useEmbedding } from '@/components/providers/embed-provider';

export const NoteFooter = (props: NoteFooterProps) => {
  const {
    embedState: { isEmbedded },
  } = useEmbedding();
  if (isEmbedded) {
    return null;
  }
  return (
    <div class="flex items-center justify-between gap-2 cursor-grabbing overflow-hidden">
      <div class="grow">
        <Show when={!isNil(props.creatorId)}>
          <ApAvatar
            size="xsmall"
            id={props.creatorId}
            includeName={true}
            hideHover={props.isDragging}
          />
        </Show>
      </div>
    </div>
  );
};

type NoteFooterProps = {
  id: string;
  isDragging?: boolean;
  creatorId: string | null | undefined;
};
