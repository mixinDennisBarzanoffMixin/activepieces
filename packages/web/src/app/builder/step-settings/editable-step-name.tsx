import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { Pencil } from 'lucide-solid';
import { Show } from 'solid-js';

import EditableText from '@/components/custom/editable-text';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EditableStepNameProps {
  selectedBranchIndex: number | null;
  displayName: string;
  branchName: string | undefined;
  setDisplayName: (value: string) => void;
  setBranchName: (value: string) => void;
  readonly: boolean;
  isEditingStepOrBranchName: boolean;
  setIsEditingStepOrBranchName: (isEditing: boolean) => void;
  setSelectedBranchIndex: (index: number | null) => void;
  tooltipTitle?: string;
  tooltipDescription?: string;
  pieceVersion?: string;
  stepIndex?: number;
}

const EditableStepName: any = ({
  selectedBranchIndex,
  displayName,
  branchName,
  setDisplayName,
  setBranchName,
  readonly,
  isEditingStepOrBranchName,
  setIsEditingStepOrBranchName,
  setSelectedBranchIndex,
  tooltipTitle,
  tooltipDescription,
  pieceVersion,
  stepIndex,
}) => {
  const inBranchView = !isNil(selectedBranchIndex);
  const showActionTooltip =
    !inBranchView &&
    !isEditingStepOrBranchName &&
    (!!tooltipTitle || !!tooltipDescription || !!pieceVersion);
  const handleStartEditing = () => {
    if (!readonly) {
      setIsEditingStepOrBranchName(true);
    }
  };

  return (
    <>
      <Show
        when={inBranchView()}
        fallback={
          isEditingStepOrBranchName ? (
            <StepNameEditor
              value={displayName}
              onValueChange={setDisplayName}
              onCommit={() => setIsEditingStepOrBranchName(false)}
            />
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    role={readonly ? undefined : 'button'}
                    tabIndex={readonly ? undefined : 0}
                    onClick={readonly ? undefined : handleStartEditing}
                    onKeyDown={
                      readonly
                        ? undefined
                        : (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleStartEditing();
                            }
                          }
                    }
                    aria-label={readonly ? undefined : t('Edit Step Name')}
                    className={cn(
                      'flex items-center gap-1.5 min-w-0',
                      !readonly &&
                        'cursor-text rounded-sm hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    )}
                  >
                    <span className="truncate text-foreground">
                      <Show
                        when={typeof stepIndex === 'number'()}
                      >{`${stepIndex}. `}</Show>
                      {displayName}
                    </span>
                    <Show when={!readonly()}>
                      <Pencil class="size-3.5 shrink-0 text-muted-foreground" />
                    </Show>
                  </div>
                </TooltipTrigger>
                <Show when={showActionTooltip()}>
                  <TooltipContent side="bottom" class="max-w-xs">
                    <div className="flex flex-col gap-1">
                      <Show when={tooltipTitle()}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {tooltipTitle}
                          </span>
                          <Show when={pieceVersion()}>
                            <span className="text-[11px] font-mono text-background/90">
                              (v{pieceVersion})
                            </span>
                          </Show>
                        </div>
                      </Show>
                      <Show when={!tooltipTitle && pieceVersion()}>
                        <span className="text-[11px] font-mono text-background/90">
                          (v{pieceVersion})
                        </span>
                      </Show>
                      <Show when={tooltipDescription()}>
                        <div className="text-xs text-background/90">
                          {tooltipDescription}
                        </div>
                      </Show>
                    </div>
                  </TooltipContent>
                </Show>
              </Tooltip>
            </TooltipProvider>
          )
        }
      >
        <>
          <div
            className="truncate cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBranchIndex(null);
            }}
          >
            {displayName}
          </div>
          /
          <EditableText
            key={branchName}
            onValueChange={(value) => {
              if (value) {
                setBranchName(value);
              }
            }}
            readonly={readonly}
            value={branchName}
            tooltipContent={readonly ? '' : t('Edit Branch Name')}
            isEditing={isEditingStepOrBranchName}
            setIsEditing={setIsEditingStepOrBranchName}
          />
        </>
      </Show>
      <Show when={inBranchView && !isEditingStepOrBranchName && !readonly()}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                class="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={handleStartEditing}
                aria-label={t('Edit Branch Name')}
              >
                <Pencil class="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('Edit Branch Name')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Show>
    </>
  );
};

type StepNameEditorProps = {
  value: string;
  onValueChange: (value: string) => void;
  onCommit: () => void;
};

const StepNameEditor = ({
  value,
  onValueChange,
  onCommit,
}: StepNameEditorProps) => {
  let ref: HTMLDivElement | undefined;

  const focusAndSelect = (el: HTMLDivElement | null) => {
    ref = el;
    if (!el) return;
    requestAnimationFrame(() => {
      el.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  };

  const commit = () => {
    const next = (ref?.textContent ?? '').trim();
    if (next.length > 0 && next !== value) {
      onValueChange(next);
    }
    onCommit();
  };

  return (
    <div
      ref={focusAndSelect}
      contentEditable
      suppressContentEditableWarning
      className="truncate focus:outline-hidden break-all"
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          if (ref) {
            ref.textContent = value;
          }
          onCommit();
        } else if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        }
      }}
    >
      {value}
    </div>
  );
};

export default EditableStepName;
