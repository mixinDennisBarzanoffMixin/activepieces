import { Show } from 'solid-js';

import { ResourceLockWidget } from '@/components/custom/resource-lock-widget';

import { useBuilderStateContext } from '../../builder-hooks';

import { PublishFlowReminderWidget } from './publish-flow-reminder-widget';
import { RunInfoWidget } from './run-info-widget';
import { useFlowLock } from './use-flow-lock';
import { ViewingOldVersionWidget } from './viewing-old-version-widget';

const BuilderBanner = () => {
  const { lockedBy, takeOver } = useFlowLock();
  const run = useBuilderStateContext((state) => ({ value: state.run })).value;

  return (
    <Show
      when={lockedBy()}
      keyed
      fallback={
        <Show
          when={run}
          fallback={
            <>
              <ViewingOldVersionWidget />
              <PublishFlowReminderWidget />
            </>
          }
        >
          <RunInfoWidget />
        </Show>
      }
    >
      {(lock) => (
        <ResourceLockWidget
          lockedBy={lock}
          takeOver={takeOver}
          resourceLabel="flow"
        />
      )}
    </Show>
  );
};

export { BuilderBanner };
