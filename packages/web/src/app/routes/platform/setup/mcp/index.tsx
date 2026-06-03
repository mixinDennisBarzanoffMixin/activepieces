import { ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Show } from 'solid-js';

import { CenteredPage } from '@/app/components/centered-page';
import { McpTools } from '@/app/components/project-settings/mcp-server/mcp-tools';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { flagsHooks } from '@/hooks/flags-hooks';

import { platformMcpHooks } from './platform-mcp-hooks';

export default function PlatformMcpPage() {
  const { data: mcpServer, isLoading } =
    platformMcpHooks.usePlatformMcpServer();
  const { mutate: updateTools, isPending: isToolsUpdating } =
    platformMcpHooks.useUpdatePlatformMcpTools();
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);

  if (isLoading) {
    return (
      <CenteredPage
        title={t('Platform MCP Server')}
        description={t(
          'Configure the platform-wide MCP server used by the AI Chat assistant and external MCP clients.',
        )}
      >
        <div class="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </CenteredPage>
    );
  }

  const serverUrl = `${(publicUrl ?? '').replace(/\/$/, '')}/mcp/platform`;

  const jsonConfiguration = {
    mcpServers: {
      activepieces: {
        url: serverUrl,
      },
    },
  };

  return (
    <CenteredPage
      title={t('Platform MCP Server')}
      description={t(
        'Configure the platform-wide MCP server used by the AI Chat assistant and external MCP clients.',
      )}
    >
      <div class="space-y-6">
        <Show when={mcpServer}>
          {(server) => (
            <Tabs defaultValue="connection">
              <TabsList>
                <TabsTrigger value="connection">{t('Connection')}</TabsTrigger>
                <TabsTrigger value="tools">{t('Tools')}</TabsTrigger>
              </TabsList>

              <TabsContent value="connection" class="mt-4 pb-6" tabIndex={-1}>
                <div class="space-y-4">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium">{t('Server URL')}</label>
                    <p class="text-xs text-muted-foreground">
                      {t(
                        'Use this URL to connect from Cursor, Windsurf, Claude Desktop, or any MCP-compatible client. Authentication is handled via OAuth.',
                      )}
                    </p>
                    <CopyToClipboardInput
                      textToCopy={serverUrl}
                      useInput={true}
                    />
                  </div>

                  <CollapsibleJson
                    json={jsonConfiguration}
                    label={t('JSON Configuration')}
                    description={t(
                      'Copy this into your MCP client config (Cursor, Windsurf, Claude Desktop, etc.).',
                    )}
                    defaultOpen={false}
                  />
                </div>
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
                      'Control which built-in tools are available to the AI Chat and external agents via the platform MCP server.',
                    )}
                  </p>
                  <McpTools
                    disabledTools={server().disabledTools}
                    isPending={isToolsUpdating}
                    onUpdateDisabledTools={(tools) =>
                      updateTools({ disabledTools: tools })
                    }
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </Show>
      </div>
    </CenteredPage>
  );
}
