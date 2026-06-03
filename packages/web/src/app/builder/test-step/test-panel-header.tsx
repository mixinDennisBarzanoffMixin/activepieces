import { StepOutputStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { Loader2 } from 'lucide-solid';
import { Match, Show, Switch, mergeProps } from 'solid-js';

import { StepStatusIcon } from '@/features/flow-runs';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

type TestPanelHeaderStatus = 'success' | 'failed' | 'testing' | 'idle';
type TestPanelHeaderViewMode = 'edit' | 'run';

type TestPanelHeaderProps = {
  status: TestPanelHeaderStatus;
  lastTestDate?: string | null;
  viewMode?: TestPanelHeaderViewMode;
};

const TestPanelHeader = (_props: TestPanelHeaderProps) => {
  const props = mergeProps({ viewMode: 'edit' }, _props);

  return (
    <Show when={props.status !== 'idle'}>
      <div
        class={cn(
          'flex items-center justify-between px-3 py-2 shrink-0 gap-2',
          props.status === 'success' && 'bg-success-100',
          props.status === 'failed' && 'bg-destructive/10',
          props.status === 'testing' && 'bg-primary/10',
        )}
      >
        <TestPanelStatusBadge status={props.status} viewMode={props.viewMode} />
        <Show when={props.lastTestDate && props.status !== 'testing'}>
          <span
            class={cn(
              'text-xs truncate',
              props.status === 'success' && 'text-success-700/80',
              props.status === 'failed' && 'text-destructive/80',
            )}
          >
            {formatUtils.formatDateWithTime(
              new Date(props.lastTestDate),
              false,
            )}
          </span>
        </Show>
      </div>
    </Show>
  );
};

type TestPanelStatusBadgeProps = {
  status: TestPanelHeaderStatus;
  viewMode: TestPanelHeaderViewMode;
};

const TestPanelStatusBadge = (props: TestPanelStatusBadgeProps) => {
  return (
    <Switch>
      <Match when={props.status === 'failed'}>
        <div class="flex items-center gap-1.5 text-sm">
          <StepStatusIcon status={StepOutputStatus.FAILED} size="4.5" />
          <span class="text-destructive-700 dark:text-destructive-200 font-medium">
            <Show when={props.viewMode === 'run'} fallback={t('Test Failed')}>
              {t('Failed')}
            </Show>
          </span>
        </div>
      </Match>
      <Match when={props.status === 'testing'}>
        <div class="flex items-center gap-1.5 text-sm text-primary">
          <Loader2 class="size-4 animate-spin" />
          <span class="font-medium">{t('Testing...')}</span>
        </div>
      </Match>
      <Match when={props.status === 'success'}>
        <div class="flex items-center gap-1.5 text-sm">
          <StepStatusIcon status={StepOutputStatus.SUCCEEDED} size="4.5" />
          <span class="text-success-700 font-medium">
            <Show
              when={props.viewMode === 'run'}
              fallback={t('Tested Successfully')}
            >
              {t('Success')}
            </Show>
          </span>
        </div>
      </Match>
    </Switch>
  );
};

export { TestPanelHeader };
