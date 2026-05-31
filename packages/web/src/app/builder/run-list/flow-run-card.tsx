import {
  FlowRetryStrategy,
  FlowRun,
  FlowRunStatus,
  isFailedState,
  isFlowRunStateTerminal,
  Permission,
} from '@activepieces/shared';
import { useNavigate } from '@solidjs/router';
import { t } from 'i18next';
import { Eye, Repeat, Timer } from 'lucide-solid';
import { Show, createSignal } from 'solid-js';

import { CardListItem } from '@/components/custom/card-list';
import { FormattedDate } from '@/components/custom/formatted-date';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowRunUtils } from '@/features/flow-runs';
import { flowRunMutations } from '@/features/flow-runs/hooks/flow-run-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

type FlowRunCardProps = {
  run: FlowRun;
  viewedRunId?: string;
  refetchRuns: () => void;
};

export const FLOW_CARD_HEIGHT = 70;
const FlowRunCard = ({ run, viewedRunId, refetchRuns }: FlowRunCardProps) => {
  const { Icon, variant } = flowRunUtils.getStatusIcon(run.status);
  const userHasPermissionToRetryRun = useAuthorization().checkAccess(
    Permission.WRITE_RUN,
  );
  const projectId = authenticationSession.getProjectId();
  const navigate = useNavigate();

  const [isRetryDropdownOpen, setIsRetryDropdownOpen] =
    createSignal<boolean>(false);
  const { mutate: retryRun, isPending: isRetryingRun } =
    flowRunMutations.useRetryRun({
      onSuccess: ({ run }) => {
        refetchRuns();
        navigate(`/runs/${run.id}`);
      },
    });
  return (
    <CardListItem
      class={cn('px-3 group', {
        'bg-accent text-accent-foreground': run.id === viewedRunId,
      })}
      style={{ height: `${FLOW_CARD_HEIGHT}px` }}
      onClick={() => {
        navigate(`/runs/${run.id}`);
      }}
      key={run.id}
    >
      <div>
        <span>
          <Show
            when={run.status === FlowRunStatus.CANCELED()}
            fallback={
              <Icon
                class={cn('w-5 h-5', {
                  'text-success': variant === 'success',
                  'text-destructive': variant === 'error',
                })}
              />
            }
          >
            <Tooltip>
              <TooltipTrigger>
                <Icon
                  class={cn('w-5 h-5', {
                    'text-success': variant === 'success',
                    'text-destructive': variant === 'error',
                  })}
                />
              </TooltipTrigger>
              <TooltipContent>{t('Canceled')}</TooltipContent>
            </Tooltip>
          </Show>
        </span>
      </div>
      <div className="grid gap-2">
        <div className="text-sm font-medium leading-none flex gap-2 items-center">
          <FormattedDate
            date={new Date(run.created ?? new Date())}
            includeTime={true}
            class="text-sm font-medium leading-none select-none cursor-default"
          ></FormattedDate>
          <Show when={run.id === viewedRunId()}>
            <Eye class="w-3.5 h-3.5"></Eye>
          </Show>
        </div>
        <Show
          when={isFlowRunStateTerminal({
            status: run.status,
            ignoreInternalError: false,
          })()}
        >
          <p className="flex gap-1 text-xs text-muted-foreground">
            <Timer class="h-3.5 w-3.5" />
            {t('Took')}{' '}
            {formatUtils.formatDuration(
              run.startTime && run.finishTime
                ? new Date(run.finishTime).getTime() -
                    new Date(run.startTime).getTime()
                : undefined,
              false,
            )}
          </p>
        </Show>
        <Show when={run.status === FlowRunStatus.RUNNING()}>
          <p className="flex gap-1 text-xs text-muted-foreground">
            {t('Running')}...
          </p>
        </Show>
        <Show when={run.status === FlowRunStatus.QUEUED()}>
          <p className="flex gap-1 text-xs text-muted-foreground">
            {t('Queued')}...
          </p>
        </Show>
      </div>
      <div className="ml-auto font-medium">
        <Show when={isRetryingRun()}>
          <LoadingSpinner class="size-4"></LoadingSpinner>
        </Show>

        <Show when={!isRetryingRun()}>
          <PermissionNeededTooltip hasPermission={userHasPermissionToRetryRun}>
            <DropdownMenu
              modal={false}
              open={isRetryDropdownOpen}
              onOpenChange={setIsRetryDropdownOpen}
            >
              <Tooltip>
                <TooltipTrigger>
                  <DropdownMenuTrigger>
                    <Button
                      variant="ghost"
                      size={'icon'}
                      class={cn(
                        'group-hover:opacity-100 opacity-0 rounded-full bg-accent drop-shadow-md',
                        {
                          'opacity-100': isRetryDropdownOpen,
                        },
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Repeat class="w-4 h-4"></Repeat>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>{t('Retry run')}</TooltipContent>
              </Tooltip>
              <DropdownMenuContent>
                <DropdownMenuItem
                  disabled={!userHasPermissionToRetryRun}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    retryRun({
                      runId: run.id,
                      flowId: run.flowId,
                      projectId: projectId!,
                      retryStrategy: FlowRetryStrategy.ON_LATEST_VERSION,
                    });
                  }}
                  class="cursor-pointer"
                >
                  <div className="flex flex-row gap-2 items-center">
                    <span>{t('On latest version')}</span>
                  </div>
                </DropdownMenuItem>

                <Show when={isFailedState(run.status)()}>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isRetryingRun) {
                        retryRun({
                          runId: run.id,
                          flowId: run.flowId,
                          projectId: projectId!,
                          retryStrategy: FlowRetryStrategy.FROM_FAILED_STEP,
                        });
                      }
                    }}
                    class="cursor-pointer"
                  >
                    <div className="flex flex-row gap-2 items-center">
                      <span>{t('From failed step')}</span>
                    </div>
                  </DropdownMenuItem>
                </Show>
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionNeededTooltip>
        </Show>
      </div>
    </CardListItem>
  );
};

FlowRunCard.displayName = 'FlowRunCard';
export { FlowRunCard };
