import { useNavigate, useSearchParams } from '@solidjs/router';
import { t } from 'i18next';
import { Info } from 'lucide-solid';

import { LIMIT_QUERY_PARAM } from '@/components/custom/data-table';
import { Button } from '@/components/ui/button';
import { authenticationSession } from '@/lib/authentication-session';

export const RUN_IDS_QUERY_PARAM = 'flowRunIds';

export const RetriedRunsSnackbar = (props: {
  retriedRunsIds: string[];
  clearRetriedRuns: () => void;
}) => {
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  if (props.retriedRunsIds.length === 0) {
    return null;
  }
  return (
    <div class="fixed bottom-5 p-4 left-1/2 transform -translate-x-1/2  w-[480px]  animate-slide-in-from-bottom  bg-background shadow-lg border rounded-lg z-9999">
      <div class="flex items-center justify-between animate-fade">
        <div class="flex items-center gap-2">
          <Info class="size-5" />
          {t('runsRetriedNote', {
            runsCount: props.retriedRunsIds.length,
          })}
        </div>

        <Button
          variant={'outline'}
          size="sm"
          onClick={() => {
            navigate(authenticationSession.appendProjectRoutePrefix(`/runs`));
            setSearchParams({
              [RUN_IDS_QUERY_PARAM]: props.retriedRunsIds,
              [LIMIT_QUERY_PARAM]: props.retriedRunsIds.length.toString(),
            });
            props.clearRetriedRuns();
          }}
        >
          {t('View')}
        </Button>
      </div>
    </div>
  );
};
