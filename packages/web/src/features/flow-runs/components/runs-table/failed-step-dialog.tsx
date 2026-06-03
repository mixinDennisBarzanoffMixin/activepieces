import {
  FlowAction,
  FlowRun,
  FlowTrigger,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { useNavigate } from '@solidjs/router';
import { t } from 'i18next';
import { ArrowRight } from 'lucide-solid';
import { createMemo, Show, untrack } from 'solid-js';

import { JsonViewer } from '@/components/custom/json-viewer';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { flowHooks } from '@/features/flows/hooks/flow-hooks';
import { stepsHooks } from '@/features/pieces';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';

type FailedStepDialogProps = {
  run: FlowRun | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const FailedStepDialog = (props: FailedStepDialogProps) => {
  const state = createMemo(() => {
    if (isNil(props.run) || isNil(props.run.failedStep)) {
      return undefined;
    }
    return props.run;
  });

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <Show when={state()} keyed fallback={<DialogContent class="max-w-lg" />}>
        {(run) => (
          <FailedStepContent
            run={run}
            open={props.open}
            onOpenChange={props.onOpenChange}
          />
        )}
      </Show>
    </Dialog>
  );
};

const FailedStepContent = (props: {
  run: FlowRun;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const navigate = useNavigate();
  const step = createMemo(() => {
    if (isNil(props.run.failedStep)) {
      throw new Error('Failed step is required');
    }
    return props.run.failedStep;
  });

  const flow = flowHooks.useGetFlow({
    flowId: untrack(() => props.run.flowId),
    versionId: untrack(() => props.run.flowVersionId),
    enabled: untrack(() => props.open),
  });

  const version = createMemo(() => flow.data?.version);
  const node = createMemo(() =>
    version()
      ? flowStructureUtil.getStep(step().name, version()!.trigger)
      : undefined,
  );
  const number = createMemo(() =>
    version()
      ? flowStructureUtil.getStepNumber(version()!.trigger, step().name)
      : undefined,
  );
  const name = createMemo(() => {
    if (props.run.flowVersion?.displayName) {
      return props.run.flowVersion.displayName;
    }
    if (version()?.displayName) {
      return version()!.displayName;
    }
    return t('Run Failed');
  });
  const timestamp = createMemo(() => {
    if (props.run.finishTime) {
      return props.run.finishTime;
    }
    if (props.run.startTime) {
      return props.run.startTime;
    }
    return props.run.created;
  });
  const icon = createMemo(
    () => flowRunUtils.getStatusIcon(props.run.status).Icon,
  );

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        class="max-w-lg"
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-base">
            {(() => {
              const Icon = icon();
              return (
                <Icon class="size-4 shrink-0 text-destructive-800 dark:text-destructive-200" />
              );
            })()}
            <span class="truncate">{name()}</span>
          </DialogTitle>
          <DialogDescription class="text-xs">
            {timestamp()
              ? formatUtils.formatDateWithTime(new Date(timestamp()), true)
              : null}
          </DialogDescription>
        </DialogHeader>
        <Show
          when={step().message}
          fallback={
            <div class="text-sm italic text-muted-foreground">
              {t('No error message available')}
            </div>
          }
        >
          <JsonViewer
            json={step().message}
            title={
              <span class="flex items-center gap-2 min-w-0">
                <Show
                  when={node()}
                  fallback={
                    <Skeleton class="size-[25px] rounded-md shrink-0" />
                  }
                >
                  {(item) => <StepIconBadge step={item()} />}
                </Show>
                <span class="truncate">
                  {number()
                    ? `${number()}. ${step().displayName}`
                    : step().displayName}
                </span>
              </span>
            }
            class="max-h-[400px] overflow-auto"
            hideDownload
          />
        </Show>
        <DialogFooter>
          <Button
            onClick={() =>
              navigate(
                authenticationSession.appendProjectRoutePrefix(
                  `/runs/${props.run.id}`,
                ),
              )
            }
          >
            <ArrowRight class="size-4" />
            {t('Go to run')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const StepIconBadge = (props: { step: FlowAction | FlowTrigger }) => {
  const query = stepsHooks.useStepMetadata({
    step: untrack(() => props.step),
  });
  const metadata = createMemo(() => query.stepMetadata);

  return (
    <Show
      when={!query.isLoading && metadata()}
      fallback={<Skeleton class="size-[25px] rounded-md shrink-0" />}
    >
      {(item) => (
        <PieceIcon
          logoUrl={item().logoUrl}
          displayName={item().displayName}
          size="xs"
          border={false}
          showTooltip={false}
        />
      )}
    </Show>
  );
};
