import { AgentMcpTool } from '@activepieces/shared';
import { t } from 'i18next';
import { Plus, X } from 'lucide-solid';
import { For } from 'solid-js';

import { McpSvg } from '@/assets/img/custom/mcp';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useMcpToolDialogStore } from '../stores/mcp-tools';

type AgentMcpToolsAccordionProps = {
  disabled?: boolean;
  tools: AgentMcpTool[];
  removeTool: (toolName: string) => void;
};

export const AgentMcpToolComponent = (props: AgentMcpToolsAccordionProps) => {
  const { setShowAddMcpDialog } = useMcpToolDialogStore();

  return (
    <AccordionItem value="mcp" class="border-b last:border-0">
      <AccordionTrigger class="px-4 py-3 hover:no-underline hover:bg-accent transition-all">
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
            <McpSvg class="size-3.5" />
          </div>
          <span class="text-sm font-medium">{t('MCP Servers')}</span>
        </div>
      </AccordionTrigger>

      <AccordionContent class="px-4 py-2">
        <div class="flex flex-wrap gap-2">
          <For each={props.tools}>
            {(tool) => (
              <div
                onClick={() => setShowAddMcpDialog(true, tool)}
                class={`
                group flex items-center gap-2 px-3 py-1 cursor-pointer
                rounded-full border bg-muted/50
                ${props.disabled ? 'opacity-50 pointer-events-none' : ''}
              `}
              >
                <span class="text-xs font-medium max-w-40 truncate">
                  {tool.toolName}
                </span>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      disabled={props.disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        props.removeTool(tool.toolName);
                      }}
                      variant="ghost"
                      size="icon"
                      class="
                      size-5 p-0.5
                      text-muted-foreground
                      hover:text-destructive
                      hover:bg-destructive/10
                      transition
                    "
                    >
                      <X class="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('Remove MCP server')}</TooltipContent>
                </Tooltip>
              </div>
            )}
          </For>
        </div>

        <Button
          variant="link"
          class="mt-4"
          size="xs"
          onClick={() => setShowAddMcpDialog(true)}
        >
          <Plus class="size-3 mr-1" />
          {t('Add MCP Server')}
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
};
