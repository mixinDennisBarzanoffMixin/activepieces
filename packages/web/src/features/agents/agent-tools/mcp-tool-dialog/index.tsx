import {
  AgentMcpTool,
  AgentTool,
  AgentToolType,
  McpAuthType,
  McpProtocol,
  ValidateAgentMcpToolResponse,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-solid';
import { createSignal, For, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useMcpToolDialogStore } from '../stores/mcp-tools';

import { AddMcpToolForm } from './add-mcp-tool-form';

export function AgentMcpDialog(props: AgentToolsDialogProps) {
  const { showAddMcpDialog, editingMcpTool, closeMcpDialog } =
    useMcpToolDialogStore();
  const [step, setStep] = createSignal<ValidationStep>('form');
  const [validationResult, setValidationResult] =
    createSignal<ValidateAgentMcpToolResponse | null>(null);
  const [pendingTool, setPendingTool] = createSignal<AgentMcpTool | null>(null);

  const handleAddTool = () => {
    const tool = pendingTool();
    if (!tool) return;

    if (editingMcpTool) {
      const updatedTools = props.tools.map((tool) =>
        tool.type === AgentToolType.MCP &&
        tool.toolName === editingMcpTool.toolName
          ? tool
          : tool,
      );
      props.onToolsUpdate(updatedTools);
      toast(t('MCP server updated successfully'));
    } else {
      props.onToolsUpdate([...props.tools, tool]);
      toast(t('MCP server added successfully'));
    }

    handleClose();
  };

  const handleBackToForm = () => {
    setStep('form');
    setValidationResult(null);
  };

  const handleClose = () => {
    setStep('form');
    setValidationResult(null);
    setPendingTool(null);
    closeMcpDialog();
  };

  return (
    <Dialog open={showAddMcpDialog} onOpenChange={handleClose}>
      <DialogContent class="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <Show when={step() === 'form'}>
          <DialogHeader>
            <DialogTitle>
              {editingMcpTool ? t('Edit MCP Server') : t('Add MCP Server')}
            </DialogTitle>
          </DialogHeader>
        </Show>

        <Show when={step() === 'form'}>
          <AddMcpToolForm
            tools={props.tools}
            initialData={getFormData(editingMcpTool)}
            handleClose={handleClose}
            setPendingTool={setPendingTool}
            setStep={setStep}
            setValidationResult={setValidationResult}
          />
        </Show>

        <Show when={step() === 'validating'}>
          <div class="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 class="w-12 h-12 animate-spin text-primary" />
            <div class="text-center space-y-2">
              <h3 class="text-lg font-semibold">
                {t('Connecting to MCP Server')}
              </h3>
              <p class="text-sm text-muted-foreground">
                {t('Validating server configuration...')}
              </p>
            </div>
          </div>
        </Show>

        <Show when={step() === 'validated' && validationResult()}>
          <div class="space-y-6">
            <Show
              when={validationResult()?.error}
              fallback={
                <div class="flex flex-col items-center justify-center py-8 space-y-4">
                  <div class="rounded-full bg-success-100 p-3">
                    <CheckCircle2 class="w-8 h-8 text-success" />
                  </div>
                  <div class="text-center space-y-2">
                    <h3 class="text-lg font-semibold">
                      {t('Connection Successful')}
                    </h3>
                    <p class="text-sm text-muted-foreground">
                      {t('Available tools from MCP server:')}
                    </p>
                  </div>

                  <Show
                    when={
                      validationResult()?.toolNames &&
                      validationResult()!.toolNames!.length > 0
                    }
                  >
                    <div class="w-full max-w-md border rounded-lg p-4 space-y-2">
                      <For each={validationResult()!.toolNames}>
                        {(tool) => (
                          <div class="flex items-center gap-2 p-2 rounded bg-muted/50">
                            <CheckCircle2 class="w-4 h-4 text-success shrink-0" />
                            <span class="text-sm font-medium">{tool}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              }
            >
              <div class="flex flex-col items-center justify-center py-8 space-y-4">
                <div class="rounded-full bg-destructive/10 p-3">
                  <AlertCircle class="w-8 h-8 text-destructive" />
                </div>
                <div class="text-center space-y-2">
                  <h3 class="text-lg font-semibold">
                    {t('Connection Failed')}
                  </h3>
                  <p class="text-sm text-muted-foreground max-w-md">
                    {validationResult()?.error}
                  </p>
                </div>
              </div>
            </Show>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToForm}
              >
                {t('Back')}
              </Button>
              <Show when={!validationResult()?.error}>
                <Button onClick={handleAddTool}>
                  {editingMcpTool ? t('Update Server') : t('Add Server')}
                </Button>
              </Show>
            </DialogFooter>
          </div>
        </Show>
      </DialogContent>
    </Dialog>
  );
}

function getFormData(tool: AgentMcpTool | null): McpToolFormData {
  if (!tool) {
    return {
      toolName: '',
      serverUrl: '',
      protocol: McpProtocol.STREAMABLE_HTTP,
      authType: McpAuthType.NONE,
      accessToken: '',
      apiKey: '',
      apiKeyHeader: 'X-API-Key',
      headers: [{ key: '', value: '' }],
    };
  }

  return {
    toolName: tool.toolName,
    serverUrl: tool.serverUrl,
    protocol: tool.protocol,
    authType: tool.auth.type,
    accessToken:
      tool.auth.type === McpAuthType.ACCESS_TOKEN ? tool.auth.accessToken : '',
    apiKey: tool.auth.type === McpAuthType.API_KEY ? tool.auth.apiKey : '',
    apiKeyHeader:
      tool.auth.type === McpAuthType.API_KEY
        ? tool.auth.apiKeyHeader
        : 'X-API-Key',
    headers:
      tool.auth.type === McpAuthType.HEADERS
        ? Object.entries(tool.auth.headers).map(([key, value]) => ({
            key,
            value,
          }))
        : [{ key: '', value: '' }],
  };
}

type AgentToolsDialogProps = {
  tools: AgentTool[];
  onToolsUpdate: (tools: AgentTool[]) => void;
};

type HeaderField = {
  key: string;
  value: string;
};

export type McpToolFormData = {
  toolName: string;
  serverUrl: string;
  protocol: McpProtocol;
  authType: McpAuthType;
  accessToken: string;
  apiKeyHeader: string;
  apiKey: string;
  headers: HeaderField[];
};

export type ValidationStep = 'form' | 'validating' | 'validated';
