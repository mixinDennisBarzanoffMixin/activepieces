import { AgentToolType, AIProviderName } from '@activepieces/shared';
import type {
  AgentKnowledgeBaseTool,
  AgentPieceTool,
  AgentTool,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Plus } from 'lucide-solid';
import { For, Show } from 'solid-js';

import { BuilderField } from '@/app/builder/builder-form';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  AddToolDropdown,
  AgentFlowToolComponent,
  AgentMcpToolComponent,
  AgentPieceToolComponent,
  AgentFlowToolDialog,
  AgentMcpDialog,
  KnowledgeBaseSection,
} from '@/features/agents';

import { AgentPieceDialog } from './piece-tool-dialog';

const icons = [
  'https://cdn.activepieces.com/pieces/youtube.png',
  'https://cdn.activepieces.com/pieces/slack.png',
  'https://cdn.activepieces.com/pieces/github.png',
  'https://cdn.activepieces.com/pieces/notion.png',
];

interface AgentToolsProps {
  toolsField: BuilderField;
  disabled?: boolean;
  selectedProvider?: AIProviderName;
}

export const AgentTools = (props: AgentToolsProps) => {
  const tools = Array.isArray(props.toolsField.value)
    ? (props.toolsField.value as AgentTool[])
    : [];

  const onToolsUpdate = (tools: AgentTool[]) =>
    props.toolsField.onChange(tools);

  const removeTool = (toolName: string) => {
    onToolsUpdate(tools.filter((tool) => toolName !== tool.toolName));
  };

  const flowTools = tools.filter((tool) => tool.type === AgentToolType.FLOW);
  const mcpTools = tools.filter((tool) => tool.type === AgentToolType.MCP);
  const kbTools = tools.filter(
    (tool): tool is AgentKnowledgeBaseTool =>
      tool.type === AgentToolType.KNOWLEDGE_BASE,
  );
  const pieceToToolMap = tools
    .filter((tool) => tool.type === AgentToolType.PIECE)
    .reduce<Record<string, AgentPieceTool[]>>((acc, tool) => {
      const key = tool.pieceMetadata.pieceName;

      if (!key) return acc;

      (acc[key] ??= []).push(tool);
      return acc;
    }, {});

  return (
    <div>
      <h2 class="text-sm font-medium">{t('Agent Tools')}</h2>

      <div class="mt-2">
        <Show
          when={
            flowTools.length +
              mcpTools.length +
              Object.keys(pieceToToolMap).length >
            0
          }
          fallback={
            <div class="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card px-4 py-8 text-center">
              <div class="flex items-center">
                <For each={icons.slice(0, 4)}>
                  {(icon, index) => (
                    <div
                      class="relative flex size-9 items-center justify-center rounded-full border bg-background"
                      style={{ 'margin-left': index === 0 ? 0 : -10 }}
                    >
                      <img
                        src={icon}
                        alt={icon}
                        class="size-4 object-contain"
                      />
                    </div>
                  )}
                </For>
                <div
                  class="relative flex size-9 items-center justify-center rounded-full border text-[10px] bg-background text-foreground font-medium"
                  style={{ 'margin-left': -10 }}
                >
                  <span>+500</span>
                </div>
              </div>

              <p class="text-sm font-medium text-muted-foreground">
                {t('Connect apps, flows, MCPs and more.')}
              </p>

              <AddToolDropdown disabled={props.disabled} align="center">
                <Button variant="outline" class="gap-2">
                  <Plus class="size-4" />
                  {t('Add')}
                </Button>
              </AddToolDropdown>
            </div>
          }
        >
          <>
            <Accordion
              type="single"
              collapsible
              class="border rounded-md overflow-hidden shadow-none"
            >
              <For each={Object.entries(pieceToToolMap)}>
                {([pieceName, tools]) => (
                  <AgentPieceToolComponent
                    key={pieceName}
                    disabled={props.disabled}
                    tools={tools}
                    removeTool={removeTool}
                  />
                )}
              </For>
              <Show when={flowTools.length > 0}>
                <AgentFlowToolComponent
                  disabled={props.disabled}
                  tools={flowTools}
                  removeTool={removeTool}
                />
              </Show>
              <Show when={mcpTools.length > 0}>
                <AgentMcpToolComponent
                  disabled={props.disabled}
                  tools={mcpTools}
                  removeTool={removeTool}
                />
              </Show>
            </Accordion>
            <AddToolDropdown disabled={props.disabled} align="start">
              <Button variant="outline" class="mt-2">
                <Plus class="size-4 mr-2" />
                {t('Add')}
              </Button>
            </AddToolDropdown>
          </>
        </Show>
      </div>

      <KnowledgeBaseSection
        disabled={props.disabled}
        tools={kbTools}
        allTools={tools}
        removeTool={removeTool}
        onToolsUpdate={onToolsUpdate}
        selectedProvider={props.selectedProvider}
      />

      <AgentFlowToolDialog onToolsUpdate={onToolsUpdate} tools={tools} />
      <AgentPieceDialog tools={tools} onToolsUpdate={onToolsUpdate} />
      <AgentMcpDialog tools={tools} onToolsUpdate={onToolsUpdate} />
    </div>
  );
};
