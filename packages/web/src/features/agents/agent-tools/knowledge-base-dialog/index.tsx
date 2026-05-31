import {
  AgentKnowledgeBaseTool,
  AgentTool,
  AgentToolType,
  KnowledgeBaseSourceType,
} from '@activepieces/shared';
import { createQuery } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Upload } from 'lucide-solid';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { tablesApi } from '@/features/tables/api/tables-api';
import { authenticationSession } from '@/lib/authentication-session';

import { useKnowledgeBaseToolDialogStore } from '../stores/knowledge-base-tools';

import {
  useDeleteKnowledgeBaseFile,
  useKnowledgeBaseFiles,
  useUploadKnowledgeBaseFile,
} from './knowledge-base-hooks';

function AgentKnowledgeBaseDialog({
  tools,
  onToolsUpdate,
}: AgentKnowledgeBaseDialogProps) {
  const { showAddKbDialog, editingKbTool, initialSourceType, closeKbDialog } =
    useKnowledgeBaseToolDialogStore();

  return (
    <Dialog open={showAddKbDialog} onOpenChange={closeKbDialog}>
      <KnowledgeBaseDialogContent
        key={`kb-dialog-${showAddKbDialog}-${editingKbTool?.toolName ?? 'new'}`}
        tools={tools}
        onToolsUpdate={onToolsUpdate}
        editingKbTool={editingKbTool}
        initialSourceType={initialSourceType}
        closeKbDialog={closeKbDialog}
      />
    </Dialog>
  );
}

function KnowledgeBaseDialogContent({
  tools,
  onToolsUpdate,
  editingKbTool,
  initialSourceType,
  closeKbDialog,
}: {
  tools: AgentTool[];
  onToolsUpdate: (tools: AgentTool[]) => void;
  editingKbTool: AgentKnowledgeBaseTool | null;
  initialSourceType: KnowledgeBaseSourceType | null;
  closeKbDialog: () => void;
}) {
  const sourceType =
    editingKbTool?.sourceType ??
    initialSourceType ??
    KnowledgeBaseSourceType.FILE;

  const [toolName, setToolName] = createSignal(editingKbTool?.toolName ?? '');
  const [sourceId, setSourceId] = createSignal(editingKbTool?.sourceId ?? '');
  const [sourceName, setSourceName] = createSignal(editingKbTool?.sourceName ?? '');

  let fileInputRef = null;
  const uploadMutation = useUploadKnowledgeBaseFile();
  const deleteMutation = useDeleteKnowledgeBaseFile();
  const { data: kbFiles, isLoading: kbFilesLoading } = useKnowledgeBaseFiles();

  const projectId = authenticationSession.getProjectId()!;
  const { data: tablesData, isLoading: tablesLoading } = createQuery(() => ({
    queryKey: ['tables-for-kb', projectId],
    queryFn: () => tablesApi.list({ projectId, limit: 1000 }),
    enabled: sourceType === KnowledgeBaseSourceType.TABLE,
  }));

  const fileOptions = (kbFiles ?? []).map((f) => ({
    value: f.id,
    label: f.displayName,
  }));

  const tableOptions = (tablesData?.data ?? []).map((table) => ({
    value: table.id,
    label: table.name,
  }));

  const handleSourceSelect = (id: string | null, name: string) => {
    if (!id) return;
    setSourceId(id);
    setSourceName(name);
    if (!editingKbTool) {
      setToolName(slugify(name));
    }
  };

  const handleFileUpload = (e: Event) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('displayName', file.name);

    uploadMutation.mutate(formData, {
      onSuccess: (kbFile) => {
        handleSourceSelect(kbFile.id, kbFile.displayName);
        toast(t('File uploaded successfully'));
      },
      onError: () => {
        toast.error(t('Failed to upload file'));
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAdd = () => {
    if (!toolName.trim() || !sourceId.trim()) {
      toast.error(t('Please select a source and ensure tool name is filled'));
      return;
    }

    const isDuplicate = tools.some(
      (tool) =>
        tool.toolName === toolName.trim() &&
        (!editingKbTool || editingKbTool.toolName !== toolName.trim()),
    );
    if (isDuplicate) {
      toast.error(t('A tool with this name already exists'));
      return;
    }

    const newTool: AgentKnowledgeBaseTool = {
      type: AgentToolType.KNOWLEDGE_BASE,
      toolName: toolName.trim(),
      sourceType,
      sourceId: sourceId.trim(),
      sourceName: sourceName.trim(),
    };

    if (editingKbTool) {
      const updatedTools = tools.map((tool) =>
        tool.type === AgentToolType.KNOWLEDGE_BASE &&
        tool.toolName === editingKbTool.toolName
          ? newTool
          : tool,
      );
      onToolsUpdate(updatedTools);
      toast(t('Knowledge source updated successfully'));
    } else {
      onToolsUpdate([...tools, newTool]);
      toast(t('Knowledge source added successfully'));
    }

    closeKbDialog();
  };

  const dialogTitle = editingKbTool
    ? t('Edit Knowledge Source')
    : sourceType === KnowledgeBaseSourceType.FILE
    ? t('Add File Source')
    : t('Add Table Source');

  return (
    <DialogContent class="sm:max-w-md gap-3">
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-1.5">
          <Label>
            {sourceType === KnowledgeBaseSourceType.FILE
              ? t('Knowledge Base File')
              : t('Table')}
          </Label>
          {sourceType === KnowledgeBaseSourceType.FILE ? (
            <div class="flex flex-col gap-2">
              <SearchableSelect
                options={fileOptions}
                value={sourceId || undefined}
                onChange={(id) => {
                  const file = kbFiles?.find((f) => f.id === id);
                  handleSourceSelect(id, file?.displayName ?? '');
                }}
                placeholder={t('Select a knowledge base file')}
                loading={kbFilesLoading}
                onOptionDelete={(fileId) => {
                  if (deleteMutation.isPending) return;
                  deleteMutation.mutate(fileId, {
                    onSuccess: () => {
                      toast(t('File deleted successfully'));
                      if (sourceId === fileId) {
                        setSourceId('');
                        setSourceName('');
                        if (!editingKbTool) {
                          setToolName('');
                        }
                      }
                    },
                    onError: () => {
                      toast.error(t('Failed to delete file'));
                    },
                  });
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.csv,.docx"
                class="hidden"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                class="self-start"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <Upload class="mr-2 h-4 w-4" />
                {uploadMutation.isPending
                  ? t('Uploading...')
                  : t('Upload new file')}
              </Button>
            </div>
          ) : (
            <SearchableSelect
              options={tableOptions}
              value={sourceId || undefined}
              onChange={(id) => {
                const selected = tablesData?.data?.find(
                  (item) => item.id === id,
                );
                handleSourceSelect(id, selected?.name ?? '');
              }}
              placeholder={t('Select a table')}
              loading={tablesLoading}
            />
          )}
        </div>

        <div class="space-y-1.5">
          <Label>
            {sourceType === KnowledgeBaseSourceType.FILE
              ? t('File Name')
              : t('Table Name')}
          </Label>
          <Input
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            placeholder={
              sourceType === KnowledgeBaseSourceType.FILE
                ? t('e.g., company_docs')
                : t('e.g., products_catalog')
            }
          />
          <p class="text-xs text-muted-foreground">
            {t(
              'A unique name for the agent to reference this knowledge source',
            )}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={closeKbDialog}>
          {t('Cancel')}
        </Button>
        <Button onClick={handleAdd}>
          {editingKbTool ? t('Update') : t('Add')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

type AgentKnowledgeBaseDialogProps = {
  tools: AgentTool[];
  onToolsUpdate: (tools: AgentTool[]) => void;
};

export { AgentKnowledgeBaseDialog };
