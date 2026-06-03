import {
  ApFlagId,
  SharedTemplate,
  TableTemplate,
  TemplateStatus,
  TemplateType,
} from '@activepieces/shared';
import { useNavigate } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Import } from 'lucide-solid';
import { parse } from 'papaparse';
import { createSignal, mergeProps, Show } from 'solid-js';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { recordsApi } from '../api/records-api';
import { tableHooks } from '../hooks/table-hooks';
import { FieldsMapping, fileUtils, SupportedFileType } from '../utils/utils';

import { useOptionalTableStore } from './ap-table-state-provider';
import { FieldsMappingControl } from './fields-mapping';

type ImportTableDialogProps = {
  open?: boolean;
  setIsOpen?: (open: boolean) => void;
  showTrigger?: boolean;
  tableId?: string;
  folderId?: string;
  onImportSuccess?: () => void;
  allowedFileTypes?: SupportedFileType[];
};

const ImportTableDialog = (_props: ImportTableDialogProps) => {
  const defaults: Pick<
    ImportTableDialogProps,
    'showTrigger' | 'allowedFileTypes'
  > = { showTrigger: true, allowedFileTypes: ['json'] };
  const props = mergeProps(defaults, _props);
  const navigate = useNavigate();
  const projectId = authenticationSession.getProjectId() ?? '';
  const [serverError, setServerError] = createSignal<string | null>(null);
  const [csvColumns, setCsvColumns] = createSignal<string[]>([]);
  const [csvRecords, setCsvRecords] = createSignal<string[][]>([]);
  const [fileType, setFileType] = createSignal<SupportedFileType | null>(null);
  const [file, setFile] = createSignal<File | null>(null);
  const [mapping, setMapping] = createSignal<FieldsMapping>([]);
  const [fileError, setFileError] = createSignal('');
  const [fileKey, setFileKey] = createSignal(0);
  const { data: maxFileSize } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_FILE_SIZE_MB,
  );
  const { data: maxRecords } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_RECORDS_PER_TABLE,
  );

  const tableStore = useOptionalTableStore();

  const getTableState = () => {
    if (!tableStore) return null;
    const state = tableStore.getState();
    return {
      serverFields: state.serverFields,
      serverRecords: state.serverRecords,
      recordsCount: state.records.length,
      setRecords: state.setRecords,
    };
  };

  const resetState = () => {
    setCsvColumns([]);
    setCsvRecords([]);
    setFileType(null);
    setFile(null);
    setMapping([]);
    setFileError('');
    setFileKey((key) => key + 1);
    setServerError(null);
  };

  const validate = () => {
    const selected = file();
    if (!selected) {
      setFileError(t('Please select a JSON or CSV file'));
      return false;
    }

    const validation = fileUtils.validateFile(
      selected,
      maxFileSize ?? undefined,
    );
    if (!validation.valid) {
      setFileError(t(validation.error!));
      return false;
    }

    setFileError('');
    return true;
  };

  const handleCsvImport = async (data: { fieldsMapping: FieldsMapping }) => {
    const tableState = getTableState();
    if (!props.tableId || !tableState) {
      throw new Error(t('CSV import is only available for existing tables'));
    }

    const records = await recordsApi.importCsv({
      csvRecords: csvRecords(),
      tableId: props.tableId,
      fieldsMapping: data.fieldsMapping,
      maxRecordsLimit: (maxRecords ?? 1000) - tableState.recordsCount,
    });

    tableState.setRecords([...tableState.serverRecords, ...records]);
    return null;
  };

  const handleJsonImport = async (data: { file: File }) => {
    const fileContent = await data.file.text();
    const parsedContent: unknown = JSON.parse(fileContent);
    const parsedTemplate = SharedTemplate.safeParse(parsedContent);

    const template = parsedTemplate.success
      ? parsedTemplate.data
      : (() => {
          const parsedTable = TableTemplate.parse(parsedContent);
          const status =
            parsedTable.status === TemplateStatus.ARCHIVED
              ? TemplateStatus.ARCHIVED
              : TemplateStatus.PUBLISHED;

          return {
            name: parsedTable.name,
            type: TemplateType.CUSTOM,
            summary: '',
            description: '',
            tags: [],
            blogUrl: null,
            metadata: null,
            author: '',
            categories: [],
            pieces: [],
            tables: [parsedTable],
            status,
          };
        })();

    if (!template.tables || template.tables.length === 0) {
      throw new Error(t('No tables found in template'));
    }

    if (props.tableId) {
      return await tableHooks.importTableIntoExisting({
        template,
        existingTableId: props.tableId,
        maxRecords: maxRecords ?? 1000,
      });
    }

    const tables = await tableHooks.importTablesFromTemplates({
      templates: [template],
      projectId,
      maxRecords: maxRecords ?? 1000,
      folderId: props.folderId,
    });
    return tables[0];
  };

  const { mutate: importFile, isPending: isLoading } = createMutation(() => ({
    mutationFn: async (data: { file: File; fieldsMapping: FieldsMapping }) => {
      setServerError(null);

      if (fileType() === 'csv') {
        return await handleCsvImport(data);
      }
      return await handleJsonImport(data);
    },
    onSuccess: (table: { id: string } | null | undefined) => {
      props.setIsOpen?.(false);
      props.onImportSuccess?.();
      if (!props.tableId && table) {
        void navigate(`/projects/${projectId}/tables/${table.id}`);
      }
    },
    onError: (error) => {
      const errorMessage =
        api.isError(error) && error.response?.data
          ? JSON.stringify(error.response.data)
          : error instanceof Error
          ? error.message
          : t('Unknown error');
      setServerError(errorMessage);
    },
  }));

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const selected = file();
    if (!validate() || !selected) return;

    importFile({
      file: selected,
      fieldsMapping: mapping(),
    });
  };

  return (
    <Dialog
      open={props.open}
      onOpenChange={(value: boolean) => {
        props.setIsOpen?.(value);
        if (!value) resetState();
      }}
    >
      <Show when={props.showTrigger}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" class="flex gap-2 items-center">
            <Import class="w-4 h-4 shrink-0" />
            {t('Import')}
          </Button>
        </DialogTrigger>
      </Show>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Import Table')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} class="space-y-4">
          <ApMarkdown
            class="text-left"
            markdown={(() => {
              if (fileType() === 'csv') {
                return [
                  t('Import records from a CSV file'),
                  t('Records will be added to the bottom of the table'),
                  t(
                    'Any records after the limit ({maxRecords} records) will be ignored',
                    {
                      maxRecords: maxRecords ?? 0,
                    },
                  ),
                ].join('\n\n');
              }

              if (fileType() === 'json' && props.tableId) {
                return [
                  t(
                    '⚠️ **Warning:** This will completely replace the current table',
                  ),
                  t('All existing fields and records will be deleted'),
                  t(
                    'Any records after the limit ({maxRecords} records) will be ignored',
                    {
                      maxRecords: maxRecords ?? 0,
                    },
                  ),
                ].join('\n\n');
              }

              if (!props.allowedFileTypes.includes('csv')) {
                return [
                  t('Import a table from JSON template'),
                  props.tableId
                    ? t(
                        '⚠️ This will completely replace the current table with the template structure and data',
                      )
                    : t(
                        'The table will be created with all its fields and data',
                      ),
                  t(
                    'Any records after the limit ({maxRecords} records) will be ignored',
                    {
                      maxRecords: maxRecords ?? 0,
                    },
                  ),
                ].join('\n\n');
              }

              return [
                t('Import a table from JSON or add records from CSV'),
                t('**JSON:** Creates a new table with fields and data'),
                t('**CSV:** Adds records to an existing table'),
                t(
                  'Any records after the limit ({maxRecords} records) will be ignored',
                  {
                    maxRecords: maxRecords ?? 0,
                  },
                ),
              ].join('\n\n');
            })()}
          />
          <div class="space-y-1">
            <Label>
              {t(
                props.allowedFileTypes
                  .map((item) => item.toUpperCase())
                  .join(' or ') + ' file',
              )}
            </Label>
            <Input
              key={fileKey()}
              type="file"
              accept={props.allowedFileTypes
                .map((item) => `.${item}`)
                .join(',')}
              onInput={(event) => {
                void (async () => {
                  const selected = event.currentTarget.files?.[0];
                  if (!selected) return;

                  setFile(selected);
                  setFileError('');
                  setServerError(null);

                  const validation = fileUtils.validateFile(
                    selected,
                    maxFileSize ?? undefined,
                  );
                  if (!validation.valid) {
                    setServerError(t(validation.error!));
                    return;
                  }

                  const extension = fileUtils.getExtension(selected.name);
                  if (!fileUtils.isValidType(extension)) {
                    setServerError(t('Invalid file type'));
                    return;
                  }

                  if (!props.allowedFileTypes.includes(extension)) {
                    setServerError(
                      t('Only {types} files are allowed', {
                        types: props.allowedFileTypes
                          .map((item) => item.toUpperCase())
                          .join(', '),
                      }),
                    );
                    return;
                  }

                  setFileType(extension);

                  if (extension === 'csv') {
                    if (!props.tableId) {
                      setServerError(
                        t('CSV import is only available for existing tables'),
                      );
                      return;
                    }

                    if (!tableStore) {
                      setServerError(
                        t(
                          'CSV import is only available from the table editor.',
                        ),
                      );
                      return;
                    }

                    try {
                      const rows = await new Promise<string[][]>(
                        (resolve, reject) => {
                          parse<string[]>(selected, {
                            header: false,
                            skipEmptyLines: 'greedy',
                            worker: true,
                            complete: (results) => resolve(results.data),
                            error: (error) => reject(error),
                          });
                        },
                      );
                      setCsvColumns(rows[0] ?? []);
                      setCsvRecords(rows.slice(1));
                      setMapping([]);
                    } catch (error) {
                      setServerError(t('Failed to parse CSV file'));
                    }
                    return;
                  }

                  setCsvColumns([]);
                  setCsvRecords([]);
                  setMapping([]);
                })();
              }}
            />
            <Show when={fileError()}>
              <p class="text-sm font-medium text-destructive wrap-break-word">
                {fileError()}
              </p>
            </Show>
          </div>

          <Show
            when={fileType() === 'csv' && csvColumns().length > 0 && tableStore}
          >
            <ScrollArea class="max-h-[calc(100vh-500px)] overflow-y-auto flex-1">
              <FieldsMappingControl
                fields={tableStore.getState().serverFields}
                csvColumns={csvColumns()}
                onInput={setMapping}
              />
            </ScrollArea>
          </Show>

          <Show when={serverError()}>
            <div class=" flex items-center justify-between">
              <div class="text-destructive">
                {t(
                  'An unexpected error occurred while importing the file, please hit the copy error and send it to support',
                )}
              </div>
              <div class="min-w-4">
                <CopyButton
                  variant="ghost"
                  withoutTooltip={true}
                  textToCopy={serverError() ?? ''}
                />
              </div>
            </div>
          </Show>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                {t('Cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" loading={isLoading}>
              {t('Import')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { ImportTableDialog };
