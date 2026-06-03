import { t } from 'i18next';
import { Download, FolderInput, Trash2, X } from 'lucide-solid';
import { AnimatePresence, motion } from 'motion/react';
import { Show } from 'solid-js';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { LoadingSpinner } from '@/components/custom/spinner';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';

type AutomationsSelectionBarProps = {
  selectedCount: number;
  isDeleting: boolean;
  isMoving: boolean;
  isExporting: boolean;
  hasMovableOrExportableItems: boolean;
  onMoveClick: () => void;
  onDeleteClick: () => void;
  onExportClick: () => void;
  onClearSelection: () => void;
};

export const AutomationsSelectionBar = (
  props: AutomationsSelectionBarProps,
) => {
  const { embedState } = useEmbedding();

  return (
    <AnimatePresence>
      <Show when={props.selectedCount > 0}>
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div class="flex items-center gap-3 bg-background border rounded-lg shadow-lg p-2">
            <Show when={!embedState.hideFolders}>
              <Button
                variant="ghost"
                size="sm"
                onClick={props.onMoveClick}
                disabled={props.isMoving || !props.hasMovableOrExportableItems}
              >
                <FolderInput class="h-4 w-4 mr-1" />
                {t('Move to')}
              </Button>
            </Show>
            <Show when={!embedState.hideExportAndImportFlow}>
              <Button
                variant="ghost"
                size="sm"
                onClick={props.onExportClick}
                disabled={
                  props.isExporting || !props.hasMovableOrExportableItems
                }
              >
                <Show
                  when={props.isExporting}
                  fallback={<Download class="size-4 mr-2" />}
                >
                  <LoadingSpinner class="size-4 mr-2" />
                </Show>
                {props.isExporting ? t('Exporting') : t('Export')}
              </Button>
            </Show>
            <ConfirmationDeleteDialog
              title={t('Delete Selected Items')}
              message={t(
                'This will permanently delete {count} selected items. This action cannot be undone.',
                { count: props.selectedCount },
              ).toString()}
              mutationFn={() => Promise.resolve(props.onDeleteClick())}
              entityName={t('items')}
              buttonText={t('Delete')}
            >
              <Button
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive"
                disabled={props.isDeleting}
              >
                <Trash2 class="h-4 w-4 mr-1" />
                {t('Delete')}
              </Button>
            </ConfirmationDeleteDialog>
            <div class="border-l h-6 mx-1" />
            <span class="text-sm text-muted-foreground">
              {t('{count} selected', { count: props.selectedCount })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              onClick={props.onClearSelection}
            >
              <X class="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </Show>
    </AnimatePresence>
  );
};
