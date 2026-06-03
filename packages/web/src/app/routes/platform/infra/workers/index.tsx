import {
  ApEdition,
  ApFlagId,
  WorkerMachineStatus,
  WorkerMachineType,
  WorkerMachineWithStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Server, Clock, Cpu, MemoryStick, HardDrive, Zap } from 'lucide-solid';
import prettyBytes from 'pretty-bytes';
import { For, Show } from 'solid-js';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { RequestTrial } from '@/app/components/request-trial';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { workersQueries } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { useTimeAgo } from '@/hooks/use-time-ago';
import { cn } from '@/lib/utils';

import { WorkerConfigsPopover } from './worker-configs-popover';

export default function WorkersPage() {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCloud = edition === ApEdition.CLOUD;
  const { data: workersData, isLoading } = workersQueries.useWorkerMachines();

  const fleetType = workersData?.[0]?.type;

  return (
    <div class="flex flex-col w-full gap-4 px-4">
      <DashboardPageHeader
        description={t('Check the health of your workers')}
        title={t('Workers')}
      />
      <Show when={isCloud && fleetType === WorkerMachineType.SHARED}>
        <Alert variant="primary">
          <Zap size={16} />
          <AlertTitle>{t('Upgrade to Dedicated Workers')}</AlertTitle>
          <AlertDescription class="text-xs">
            {t(
              'Your automations run on shared workers where strict sandboxing adds overhead to every execution. Dedicated workers give you your own execution pool that stays warm and ready, so your automations start much faster.',
            )}
          </AlertDescription>
          <AlertAction>
            <RequestTrial
              featureKey="DEDICATED_WORKERS"
              buttonVariant="default"
              buttonSize="xs"
            />
          </AlertAction>
        </Alert>
      </Show>
      <Show when={isCloud && fleetType === WorkerMachineType.DEDICATED}>
        <Alert variant="success">
          <Zap size={16} />
          <AlertTitle>{t('Dedicated Workers Active')}</AlertTitle>
          <AlertDescription class="text-xs">
            {t(
              'Your workers run exclusively for your platform. The execution pool stays warm with no sandboxing overhead, so your automations start instantly.',
            )}
          </AlertDescription>
        </Alert>
      </Show>

      <Show when={isLoading}>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <For each={[0, 1, 2]}>
            {(i) => (
              <Card key={i} class="animate-pulse">
                <CardHeader class="pb-3">
                  <div class="flex items-center justify-between">
                    <div class="h-4 w-28 bg-muted rounded" />
                    <div class="h-5 w-16 bg-muted rounded-full" />
                  </div>
                </CardHeader>
                <CardContent class="space-y-3">
                  <div class="h-3 w-full bg-muted rounded" />
                  <div class="h-3 w-full bg-muted rounded" />
                  <div class="h-3 w-full bg-muted rounded" />
                </CardContent>
                <CardFooter>
                  <div class="h-4 w-full bg-muted rounded" />
                </CardFooter>
              </Card>
            )}
          </For>
        </div>
      </Show>

      <Show when={!isLoading && (workersData ?? []).length === 0}>
        <div class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Server class="size-14" />
          <p class="font-medium text-foreground">{t('No workers found')}</p>
          <p class="text-sm text-center max-w-sm">
            {t(
              "You don't have any workers yet. Spin up new workers to execute your automations",
            )}
          </p>
        </div>
      </Show>

      <Show when={!isLoading && (workersData ?? []).length > 0}>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <For each={workersData ?? []}>
            {(worker, index) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                index={index}
                isCloud={isCloud}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

function StatBar(props: StatBarProps) {
  const color = () =>
    props.value > 95
      ? 'bg-destructive'
      : props.value > 80
      ? 'bg-warning'
      : 'bg-emerald-500';

  return (
    <div class="flex items-center gap-2">
      <span class="w-16 text-xs text-muted-foreground shrink-0 flex items-center gap-1.5">
        {props.label}
      </span>
      <div class="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          class={cn('h-full rounded-full', color())}
          style={{ width: `${Math.min(props.value, 100)}%` }}
        />
      </div>
      <span class="text-xs font-medium w-10 text-right shrink-0">
        {props.value.toFixed(1)}%
      </span>
      <Show when={props.detail}>
        <span class="text-xs text-foreground shrink-0 w-28 text-right">
          {props.detail}
        </span>
      </Show>
    </div>
  );
}

function WorkerCard(props: WorkerCardProps) {
  const online = () => props.worker.status === WorkerMachineStatus.ONLINE;
  const info = () => props.worker.information;
  const ram = () =>
    info().totalAvailableRamInBytes * (info().ramUsagePercentage / 100);

  return (
    <Card>
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <Server
              size={18}
              class={cn('shrink-0', {
                'text-destructive': !online(),
              })}
            />
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-medium truncate">
                Machine #{props.index + 1}
              </span>
              <span class="text-xs text-muted-foreground font-mono">
                {info().ip}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <Show when={props.isCloud}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={
                      props.worker.type === WorkerMachineType.DEDICATED
                        ? 'success'
                        : 'secondary'
                    }
                  >
                    {props.worker.type === WorkerMachineType.DEDICATED
                      ? t('Dedicated')
                      : t('Shared')}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent class="max-w-xs">
                  {props.worker.type === WorkerMachineType.DEDICATED
                    ? t(
                        'This worker runs exclusively for your platform with no sandboxing overhead.',
                      )
                    : t(
                        'This worker is shared across platforms and uses strict sandboxing for isolation.',
                      )}
                </TooltipContent>
              </Tooltip>
            </Show>
            <Badge variant={online() ? 'success' : 'destructive'}>
              {t(props.worker.status.toLowerCase())}
            </Badge>
            <WorkerConfigsPopover workerProps={info().workerProps} />
          </div>
        </div>
      </CardHeader>

      <CardContent class="space-y-2.5">
        <StatBar
          label={
            <>
              <Cpu class="size-3" />
              <span>CPU</span>
            </>
          }
          value={info().cpuUsagePercentage}
          detail={`${info().totalCpuCores} core${
            info().totalCpuCores === 1 ? '' : 's'
          }`}
        />
        <StatBar
          label={
            <>
              <MemoryStick class="size-3" />
              <span>RAM</span>
            </>
          }
          value={info().ramUsagePercentage}
          detail={`${prettyBytes(ram(), {
            binary: true,
          })} / ${prettyBytes(info().totalAvailableRamInBytes, {
            binary: true,
          })}`}
        />
        <StatBar
          label={
            <>
              <HardDrive class="size-3" />
              <span>Disk</span>
            </>
          }
          value={info().diskInfo.percentage}
          detail={`${prettyBytes(info().diskInfo.used, {
            binary: true,
          })} / ${prettyBytes(info().diskInfo.total, { binary: true })}`}
        />
      </CardContent>

      <CardFooter class="justify-between pt-0 gap-2">
        <div class="flex items-center gap-3 text-xs text-muted-foreground min-w-0">
          <span class="flex items-center gap-1 truncate">
            <Clock size={12} class="shrink-0" />
            {t('seen')} {useTimeAgo(new Date(props.worker.updated))()}
          </span>
        </div>
        <span class="text-xs text-muted-foreground font-mono shrink-0">
          {info().workerProps.version}
        </span>
      </CardFooter>
    </Card>
  );
}

type StatBarProps = { label: JSX.Element; value: number; detail?: string };
type WorkerCardProps = {
  worker: WorkerMachineWithStatus;
  index: number;
  isCloud: boolean;
};
