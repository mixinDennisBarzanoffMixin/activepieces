import { PlatformAnalyticsReport } from '@activepieces/shared';
import { t } from 'i18next';
import { Lightbulb, Pencil } from 'lucide-solid';
import { createMemo, Show } from 'solid-js';

type TimeSavedEncouragementBannerProps = {
  report?: PlatformAnalyticsReport;
};

export function TimeSavedEncouragementBanner(
  props: TimeSavedEncouragementBannerProps,
) {
  const flows = createMemo(() => props.report?.flows ?? []);
  const flowsWithoutTimeSaved = createMemo(() =>
    flows().filter(
      (flow) =>
        flow.timeSavedPerRun === null || flow.timeSavedPerRun === undefined,
    ),
  );

  return (
    <Show when={props.report && flowsWithoutTimeSaved().length > 0}>
      <div class="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 p-2 rounded-full bg-primary/10">
            <Lightbulb class="h-4 w-4 text-primary" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-foreground">
              {t(
                'You have {count} {count, plural, one {flow} other {flows}} without time saved per run. Add it to see your complete automation impact!',
                {
                  count: flowsWithoutTimeSaved().length,
                },
              )}
            </p>
            <p class="mt-1.5 text-xs text-muted-foreground">
              {t('Click the')}{' '}
              <Pencil class="h-3 w-3 inline-block align-middle mx-0.5" />{' '}
              {t('pencil icon in the table below to set time saved per run')}
            </p>
          </div>
        </div>
      </div>
    </Show>
  );
}
