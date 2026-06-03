import { isNil, ProjectReleaseType } from '@activepieces/shared';
import { useNavigate, useParams } from '@solidjs/router';
import { formatDistance } from 'date-fns';
import { t } from 'i18next';
import {
  ChevronRight,
  GitBranch,
  FolderOpenDot,
  RotateCcw,
} from 'lucide-solid';
import { Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { projectReleaseQueries } from '@/features/project-releases';
import { authenticationSession } from '@/lib/authentication-session';

import { ApplyButton } from './apply-plan';

const getReleaseSummaryType = (type: ProjectReleaseType) => {
  switch (type) {
    case ProjectReleaseType.GIT:
      return (
        <span class="flex items-center gap-1">
          <GitBranch class="size-4" /> {t('Git')}
        </span>
      );
    case ProjectReleaseType.PROJECT:
      return (
        <span class="flex items-center gap-1">
          <FolderOpenDot class="size-4" /> {t('Project')}
        </span>
      );
    case ProjectReleaseType.ROLLBACK:
      return (
        <span class="flex items-center gap-1">
          <RotateCcw class="size-4" /> {t('Rollback')}
        </span>
      );
  }
};

const ViewRelease = () => {
  const navigate = useNavigate();
  const { releaseId } = useParams();
  const { data: release, isLoading } = projectReleaseQueries.useProjectRelease(
    releaseId || '',
    !!releaseId,
  );

  if (!releaseId) {
    window.location.replace('/releases');
    return null;
  }

  if (!isLoading && isNil(release)) {
    window.location.replace('/404');
    return null;
  }

  const createdDate = new Date(release?.created ?? 0);
  const timeAgo = formatDistance(createdDate, new Date(), { addSuffix: true });

  return (
    <div class="space-y-6 w-full">
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="link"
            class="p-0 h-auto text-sm text-muted-foreground hover:text-primary"
            onClick={() => window.location.assign('/releases')}
          >
            {t('Releases')}
          </Button>
          <ChevronRight class="h-4 w-4" />
          <span>{release?.name}</span>
        </div>
        <div class="flex justify-between items-center w-full">
          <div class="flex flex-col items-start gap-2 w-full">
            <div class="flex items-center gap-2 text-md justify-between w-full">
              <h1 class="text-3xl font-bold">{release?.name}</h1>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ApplyButton
                    onSuccess={() => {
                      navigate('/releases');
                    }}
                    variant="ghost"
                    class=" p-0"
                    request={{
                      projectId: authenticationSession.getProjectId()!,
                      type: ProjectReleaseType.ROLLBACK,
                      projectReleaseId: release?.id || '',
                    }}
                    defaultName={release?.name}
                  >
                    <Button disabled={isLoading}>{t('Rollback')}</Button>
                  </ApplyButton>
                </TooltipTrigger>
                <TooltipContent side="bottom">{t('Rollback')}</TooltipContent>
              </Tooltip>
            </div>
            <p class="text-sm text-muted-foreground">
              {t('Created')}: {timeAgo}
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <span class="text-md font-semibold">{t('Summary')}</span>
        <Show
          when={isLoading}
          fallback={
            <div class="flex flex-col items-start gap-2">
              <Show when={release?.importedBy} fallback={null}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span class="flex items-center flex-row gap-1">
                        {t('Imported by')}
                        <span class="font-semibold text-md">
                          {release?.importedByUser?.firstName}{' '}
                          {release?.importedByUser?.lastName}
                        </span>
                        {t('from')}{' '}
                        {getReleaseSummaryType(
                          release?.type ?? ProjectReleaseType.GIT,
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{release?.importedByUser?.email}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Show>
            </div>
          }
        >
          <Skeleton class="h-24 w-full" />
        </Show>
      </div>
      <div class="space-y-2">
        <span class="text-md font-semibold">{t('Description')}</span>
        <Show
          when={isLoading}
          fallback={
            <div class="flex flex-col items-start gap-2">
              <pre class="whitespace-pre-wrap">
                {release?.description || t('No description provided')}
              </pre>
            </div>
          }
        >
          <Skeleton class="h-24 w-full" />
        </Show>
      </div>
    </div>
  );
};

export default ViewRelease;
