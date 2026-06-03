import { t } from 'i18next';
import { Show } from 'solid-js';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authenticationSession } from '@/lib/authentication-session';

import { McpCredentials } from './mcp-credentials';
import { McpFlows } from './mcp-flows';
import { McpTools } from './mcp-tools';
import { mcpHooks } from './utils/mcp-hooks';

export const McpServerSettings = () => {
  const currentProjectId = authenticationSession.getProjectId();
  const { data: mcpServer, isLoading } = mcpHooks.useMcpServer(
    currentProjectId!,
  );
  const { mutate: updateMcpServer, isPending: isUpdating } =
    mcpHooks.useUpdateMcpServer(currentProjectId!);

  if (isLoading) {
    return (
      <div class="w-full flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div class="w-full mt-4">
      {
        <Show when={mcpServer} keyed>
          {(server) => {
            const tools = getDisabledTools(server);

            return (
              <Tabs defaultValue="connection">
                <TabsList>
                  <TabsTrigger value="connection">
                    {t('Connection')}
                  </TabsTrigger>
                  <TabsTrigger value="tools">{t('Tools')}</TabsTrigger>
                </TabsList>

                <TabsContent value="connection" class="mt-4 pb-6" tabIndex={-1}>
                  <McpCredentials />
                </TabsContent>

                <TabsContent
                  value="tools"
                  class="mt-4 space-y-6 pb-6"
                  tabIndex={-1}
                >
                  <div>
                    <h3 class="font-semibold text-base mb-1">
                      {t('Internal Tools')}
                    </h3>
                    <p class="text-sm text-muted-foreground mb-3">
                      {t(
                        'Control which built-in Activepieces tools are available to agents via this MCP server.',
                      )}
                    </p>
                    <McpTools
                      disabledTools={tools}
                      isPending={isUpdating}
                      onUpdateDisabledTools={(tools) =>
                        updateMcpServer({ disabledTools: tools })
                      }
                    />
                  </div>

                  <div>
                    <h3 class="font-semibold text-base mb-1">
                      {t('Your Flows')}
                    </h3>
                    <p class="text-sm text-muted-foreground mb-3">
                      {t(
                        'Flows with the MCP Trigger are exposed as tools on this server.',
                      )}
                    </p>
                    <McpFlows mcpServer={server} />
                  </div>
                </TabsContent>
              </Tabs>
            );
          }}
        </Show>
      }
    </div>
  );
};

function getDisabledTools(server: unknown) {
  if (!server || typeof server !== 'object' || !('disabledTools' in server)) {
    return null;
  }
  const value = server.disabledTools;
  return Array.isArray(value)
    ? value.filter((tool) => typeof tool === 'string')
    : null;
}
