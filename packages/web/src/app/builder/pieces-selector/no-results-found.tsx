import { ApFlagId, feedbackUrl } from '@activepieces/shared';
import { t } from 'i18next';
import { SearchX } from 'lucide-solid';
import { Show } from 'solid-js';

import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';

const NoResultsFound = () => {
  const { data: showCommunityLinks } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  const isEmbedding = useEmbedding().embedState.isEmbedded;
  const showRequestPieceButton = showCommunityLinks && !isEmbedding;

  return (
    <div className="flex flex-col gap-2 items-center justify-center h-full ">
      <SearchX class="w-14 h-14" />
      <div className="text-sm ">{t('No pieces found')}</div>
      <div className="text-sm ">{t('Try adjusting your search')}</div>
      <Show when={showRequestPieceButton()}>
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            window.open(`${feedbackUrl}`, '_blank', 'noopener noreferrer');
          }}
        >
          {t('Request Piece')}
        </Button>
      </Show>
    </div>
  );
};

export { NoResultsFound };
