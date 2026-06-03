import { PlatformAnalyticsReport } from '@activepieces/shared';
import { t } from 'i18next';
import { Download } from 'lucide-solid';

import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/dom-utils';

type FlowDetailsHeaderProps = {
  report?: PlatformAnalyticsReport;
};

export function FlowDetailsHeader(props: FlowDetailsHeaderProps) {
  const handleDownload = () => {
    const report = props.report;
    if (!report || report.flows.length === 0) return;

    const csvHeader =
      'Flow Name,Project Name,Runs,Time Saved Per Run (min),Total Time Saved (min)\n';
    const csvContent = report.flows
      .map((flow) => {
        const runs =
          report.runs.find((run) => run.flowId === flow.flowId)?.runs ?? 0;
        const timeSavedPerRun = flow.timeSavedPerRun ?? 0;
        const minutesSaved = runs * timeSavedPerRun;
        return `"${flow.flowName}","${flow.projectId}",${runs},${timeSavedPerRun},${minutesSaved}`;
      })
      .join('\n');

    void downloadFile({
      obj: csvHeader + csvContent,
      fileName: 'flow-analytics',
      extension: 'csv',
    });
  };

  return (
    <div class="flex items-center justify-between">
      <div class="text-lg font-semibold">{t('Details')}</div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={!props.report?.flows || props.report.flows.length === 0}
      >
        <Download class="h-4 w-4 mr-2" />
        {t('Download')}
      </Button>
    </div>
  );
}
