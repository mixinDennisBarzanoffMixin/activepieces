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
import { createSignal } from 'solid-js';
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

export function AgentMcpDialog({
  tools,
  onToolsUpdate,
}: AgentToolsDialogProps) {
  const { showAddMcpDialog, editingMcpTool, closeMcpDialog } =
    useMcpToolDialogStore();
  const [step, setStep] = createSignal<ValidationStep>('form');
  const [validationResult, setValidationResult] =
    createSignal<ValidateAgentMcpToolResponse | null>(null);
  const [pendingTool, setPendingTool] = createSignal<AgentMcpTool | null>(null);

  const handleAddTool = () => {
    if (!pendingTool) return;

    if (editingMcpTool) {
      const updatedTools = tools.map((tool) =>
        tool.type === AgentToolType.MCP &&
        tool.toolName === editingMcpTool.toolName
          ? pendingTool
          : tool,
      );
      onToolsUpdate(updatedTools);
      toast(t('MCP server updated successfully'));
    } else {
      onToolsUpdate([...tools, pendingTool]);
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
        {step === 'form' && (
          <DialogHeader>
            <DialogTitle>
              {editingMcpTool ? t('Edit MCP Server') : t('Add MCP Server')}
            </DialogTitle>
          </DialogHeader>
        )}

        {step === 'form' && (
          <AddMcpToolForm
            tools={tools}
            initialData={getFormData(editingMcpTool)}
            handleClose={handleClose}
            setPendingTool={setPendingTool}
            setStep={setStep}
            setValidationResult={setValidationResult}
          />
        )}

        {step === 'validating' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 class="w-12 h-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                {t('Connecting to MCP Server')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('Validating server configuration...')}
              </p>
            </div>
          </div>
        )}

        {step === 'validated' && validationResult && (
          <div className="space-y-6">
            {validationResult.error ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle class="w-8 h-8 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">
                    {t('Connection Failed')}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {validationResult.error}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="rounded-full bg-success-100 p-3">
                  <CheckCircle2 class="w-8 h-8 text-success" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">
                    {t('Connection Successful')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('Available tools from MCP server:')}
                  </p>
                </div>

                {validationResult.toolNames &&
                  validationResult.toolNames.length > 0 && (
                    <div className="w-full max-w-md border rounded-lg p-4 space-y-2">
                      {validationResult.toolNames.map((tool, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 rounded bg-muted/50"
                        >
                          <CheckCircle2 class="w-4 h-4 text-success shrink-0" />
                          <span className="text-sm font-medium">{tool}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToForm}
              >
                {t('Back')}
              </Button>
              {!validationResult.error && (
                <Button onClick={handleAddTool}>
                  {editingMcpTool ? t('Update Server') : t('Add Server')}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
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
        ? Object.entries(tool.auth.headers).map(([key, value]) => ({ key, value }))
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
