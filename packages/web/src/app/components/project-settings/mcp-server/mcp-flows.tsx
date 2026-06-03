import { FlowStatus, PopulatedMcpServer } from '@activepieces/shared';
import { t } from 'i18next';
import { For } from 'solid-js';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function McpFlows(props: McpFlowsProps) {
  const flows = props.mcpServer.flows ?? [];

  if (flows.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          {t(
            'No MCP flows yet. Create a flow with an MCP Trigger to expose it as a tool on this server.',
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div class="border rounded-lg overflow-hidden divide-y">
      {
        <For each={flows}>
          {(flow) => {
            const isEnabled = flow.status === FlowStatus.ENABLED;
            return (
              <div class="flex items-center justify-between px-4 py-3">
                <span class="text-sm font-medium">
                  {flow.version.displayName}
                </span>
                <Badge
                  variant={isEnabled ? 'success' : 'outline'}
                  class="flex items-center gap-1.5"
                >
                  <div
                    class={cn(
                      'w-2 h-2 rounded-full',
                      isEnabled ? 'bg-success' : 'bg-gray-400',
                    )}
                  />
                  <span>{isEnabled ? t('On') : t('Off')}</span>
                </Badge>
              </div>
            );
          }}
        </For>
      }
    </div>
  );
}

type McpFlowsProps = {
  mcpServer: PopulatedMcpServer;
};
