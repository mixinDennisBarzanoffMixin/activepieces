import {
  AgentMcpTool,
  AgentTool,
  AgentToolType,
  McpAuthConfig,
  McpAuthType,
  McpProtocol,
  ValidateAgentMcpToolResponse,
} from '@activepieces/shared';
import { t } from 'i18next';
import { X } from 'lucide-solid';
import { createEffect, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { authenticationSession } from '@/lib/authentication-session';

import { agentMutations } from '../../hooks/agent-hooks';
import { useMcpToolDialogStore } from '../stores/mcp-tools';

import { McpToolFormData, ValidationStep } from '.';

export const AddMcpToolForm = (props: AddMcpToolFormProps) => {
  const projectId = authenticationSession.getProjectId();
  const { editingMcpTool } = useMcpToolDialogStore();
  const [data, setData] = createStore<McpToolFormData>(props.initialData);
  const [errors, setErrors] = createStore<Partial<Record<Field, string>>>({});

  createEffect(() => {
    setData(props.initialData);
    setErrors({});
  });

  const { mutate: validateTool } = agentMutations.useValidateMcpTool({
    onSuccess: (data) => {
      props.setValidationResult(data);
      props.setStep('validated');
    },
    onError: (error) => {
      props.setValidationResult({ error: error.message, toolNames: undefined });
      props.setStep('validated');
    },
  });

  const validate = () => {
    const next: Partial<Record<Field, string>> = {};

    if (!data.toolName.trim()) {
      next.toolName = t('Tool name is required');
    }

    if (!isToolNameUnique({ value: data.toolName, tools: props.tools, editingMcpTool })) {
      next.toolName = t('An MCP server with this name already exists');
    }

    if (!isUrl(data.serverUrl)) {
      next.serverUrl = t('Must be a valid URL');
    }

    if (data.authType === McpAuthType.ACCESS_TOKEN && !data.accessToken.trim()) {
      next.accessToken = t('Access Token is required');
    }

    if (data.authType === McpAuthType.API_KEY && !data.apiKeyHeader.trim()) {
      next.apiKeyHeader = t('API Key Header is required');
    }

    if (data.authType === McpAuthType.API_KEY && !data.apiKey.trim()) {
      next.apiKey = t('Api Key is required');
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (event: SubmitEvent) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const tool: AgentMcpTool = {
      type: AgentToolType.MCP,
      toolName: data.toolName,
      serverUrl: data.serverUrl,
      protocol: data.protocol,
      auth: getAuth(data),
    };

    props.setPendingTool(tool);
    props.setStep('validating');
    validateTool({ projectId: projectId!, tool });
  };

  const addHeader = () => {
    setData('headers', [...data.headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    const headers = data.headers.filter((_, i) => i !== index);
    setData('headers', headers.length > 0 ? headers : [{ key: '', value: '' }]);
  };

  return (
    <form class="space-y-4" onSubmit={submit}>
      <div class="space-y-2">
        <Label for="tool-name" showRequiredIndicator>
          {t('MCP Name')}
        </Label>
        <Input
          id="tool-name"
          placeholder="e.g., my-mcp-server"
          value={data.toolName}
          onInput={(event) => setData('toolName', event.currentTarget.value)}
        />
        <FieldError error={errors.toolName} />
      </div>

      <div class="space-y-2">
        <Label for="server-url" showRequiredIndicator>
          {t('Server URL')}
        </Label>
        <Input
          id="server-url"
          placeholder="https://example.com/mcp"
          value={data.serverUrl}
          onInput={(event) => setData('serverUrl', event.currentTarget.value)}
        />
        <FieldError error={errors.serverUrl} />
      </div>

      <div class="space-y-2">
        <Label showRequiredIndicator>{t('Protocol')}</Label>
        <Select
          value={data.protocol}
          onValueChange={(value) => setData('protocol', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={McpProtocol.SSE}>{t('SSE')}</SelectItem>
            <SelectItem value={McpProtocol.SIMPLE_HTTP}>
              {t('Simple HTTP')}
            </SelectItem>
            <SelectItem value={McpProtocol.STREAMABLE_HTTP}>
              {t('Streamable HTTP')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="space-y-2">
        <Label showRequiredIndicator>{t('Authentication Type')}</Label>
        <Select
          value={data.authType}
          onValueChange={(value) => setData('authType', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={McpAuthType.NONE}>{t('None')}</SelectItem>
            <SelectItem value={McpAuthType.HEADERS}>{t('Headers')}</SelectItem>
            <SelectItem value={McpAuthType.ACCESS_TOKEN}>
              {t('Access Token')}
            </SelectItem>
            <SelectItem value={McpAuthType.API_KEY}>{t('Api Key')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Show when={data.authType === McpAuthType.ACCESS_TOKEN}>
        <div class="space-y-4 p-4 border rounded-lg">
          <div class="space-y-2">
            <Label for="access-token" showRequiredIndicator>
              {t('Access Token')}
            </Label>
            <Input
              id="access-token"
              placeholder="Enter access token"
              value={data.accessToken}
              onInput={(event) => setData('accessToken', event.currentTarget.value)}
            />
            <FieldError error={errors.accessToken} />
          </div>
        </div>
      </Show>

      <Show when={data.authType === McpAuthType.API_KEY}>
        <div class="space-y-4 p-4 border rounded-lg">
          <div class="space-y-2">
            <Label for="api-key-header" showRequiredIndicator>
              {t('API Key Header')}
            </Label>
            <Input
              id="api-key-header"
              placeholder="X-API-KEY"
              value={data.apiKeyHeader}
              onInput={(event) => setData('apiKeyHeader', event.currentTarget.value)}
            />
            <FieldError error={errors.apiKeyHeader} />
          </div>

          <div class="space-y-2">
            <Label for="api-key" showRequiredIndicator>
              {t('Api Key')}
            </Label>
            <Input
              id="api-key"
              placeholder="Enter API Key"
              value={data.apiKey}
              onInput={(event) => setData('apiKey', event.currentTarget.value)}
            />
            <FieldError error={errors.apiKey} />
          </div>
        </div>
      </Show>

      <Show when={data.authType === McpAuthType.HEADERS}>
        <div class="space-y-4 p-4 border rounded-lg">
          <For each={data.headers}>
            {(header, index) => (
              <div class="flex gap-2 items-end">
                <div class="flex-1 space-y-2">
                  <Input
                    placeholder="Authorization"
                    value={header.key}
                    onInput={(event) =>
                      setData('headers', index(), 'key', event.currentTarget.value)
                    }
                  />
                </div>

                <div class="flex-1 space-y-2">
                  <Input
                    placeholder="Bearer token..."
                    value={header.value}
                    onInput={(event) =>
                      setData('headers', index(), 'value', event.currentTarget.value)
                    }
                  />
                </div>

                <Show when={data.headers.length > 1}>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeHeader(index())}
                  >
                    <X class="size-4" />
                  </Button>
                </Show>
              </div>
            )}
          </For>

          <Button
            type="button"
            size="sm"
            variant="outline"
            class="w-full"
            onClick={addHeader}
          >
            {t('+ Add Header')}
          </Button>
        </div>
      </Show>

      <DialogFooter class="mt-4">
        <Button type="button" variant="outline" onClick={props.handleClose}>
          {t('Cancel')}
        </Button>
        <Button type="submit">{t('Validate Server')}</Button>
      </DialogFooter>
    </form>
  );
};

function FieldError(props: { error?: string }) {
  return (
    <Show when={props.error}>
      <p class="text-sm font-medium text-destructive wrap-break-word">
        {props.error}
      </p>
    </Show>
  );
}

function getAuth(data: McpToolFormData): McpAuthConfig {
  if (data.authType === McpAuthType.ACCESS_TOKEN) {
    return {
      type: McpAuthType.ACCESS_TOKEN,
      accessToken: data.accessToken,
    };
  }

  if (data.authType === McpAuthType.API_KEY) {
    return {
      type: McpAuthType.API_KEY,
      apiKey: data.apiKey,
      apiKeyHeader: data.apiKeyHeader,
    };
  }

  if (data.authType === McpAuthType.HEADERS) {
    return {
      type: McpAuthType.HEADERS,
      headers: Object.fromEntries(
        data.headers
          .filter((header) => header.key && header.value)
          .map((header) => [header.key, header.value]),
      ),
    };
  }

  return { type: McpAuthType.NONE };
}

function isToolNameUnique({
  value,
  tools,
  editingMcpTool,
}: {
  value: string;
  tools: AgentTool[];
  editingMcpTool: AgentMcpTool | null;
}) {
  return !tools.some(
    (tool) => tool.toolName === value && tool.toolName !== editingMcpTool?.toolName,
  );
}

function isUrl(value: string) {
  return /^https?:\/\/.+/.test(value);
}

type AddMcpToolFormProps = {
  tools: AgentTool[];
  initialData: McpToolFormData;
  setValidationResult: (data: ValidateAgentMcpToolResponse | null) => void;
  setStep: (step: ValidationStep) => void;
  setPendingTool: (tool: AgentMcpTool) => void;
  handleClose: () => void;
};

type Field =
  | 'toolName'
  | 'serverUrl'
  | 'accessToken'
  | 'apiKeyHeader'
  | 'apiKey';
