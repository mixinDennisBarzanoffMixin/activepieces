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

const EditableStepName = (props: EditableStepNameProps) => {
  const inBranchView = !isNil(props.selectedBranchIndex);
  const showActionTooltip =
    !inBranchView &&
    !props.isEditingStepOrBranchName &&
    (!!props.tooltipTitle ||
      !!props.tooltipDescription ||
      !!props.pieceVersion);
  const handleStartEditing = () => {
    if (!props.readonly) {
      props.setIsEditingStepOrBranchName(true);
    }
  };

  return (
    <>
      <Show
        when={inBranchView}
        fallback={
          props.isEditingStepOrBranchName ? (
            <StepNameEditor
              value={props.displayName}
              onValueChange={props.setDisplayName}
              onCommit={() => props.setIsEditingStepOrBranchName(false)}
            />
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    role={props.readonly ? undefined : 'button'}
                    tabIndex={props.readonly ? undefined : 0}
                    onClick={props.readonly ? undefined : handleStartEditing}
                    onKeyDown={
                      props.readonly
                        ? undefined
                        : (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleStartEditing();
                            }
                          }
                    }
                    aria-label={
                      props.readonly ? undefined : t('Edit Step Name')
                    }
                    class={cn(
                      'flex items-center gap-1.5 min-w-0',
                      !props.readonly &&
                        'cursor-text rounded-sm hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    )}
                  >
                    <span class="truncate text-foreground">
                      <Show
                        when={typeof props.stepIndex === 'number'}
                      >{`${props.stepIndex}. `}</Show>
                      {props.displayName}
                    </span>
                    <Show when={!props.readonly}>
                      <Pencil class="size-3.5 shrink-0 text-muted-foreground" />
                    </Show>
                  </div>
                </TooltipTrigger>
                <Show when={showActionTooltip}>
                  <TooltipContent side="bottom" class="max-w-xs">
                    <div class="flex flex-col gap-1">
                      <Show when={props.tooltipTitle}>
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-sm">
                            {props.tooltipTitle}
                          </span>
                          <Show when={props.pieceVersion}>
                            <span class="text-[11px] font-mono text-background/90">
                              (v{props.pieceVersion})
                            </span>
                          </Show>
                        </div>
                      </Show>
                      <Show when={!props.tooltipTitle && props.pieceVersion}>
                        <span class="text-[11px] font-mono text-background/90">
                          (v{props.pieceVersion})
                        </span>
                      </Show>
                      <Show when={props.tooltipDescription}>
                        <div class="text-xs text-background/90">
                          {props.tooltipDescription}
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
            class="truncate cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              props.setSelectedBranchIndex(null);
            }}
          >
            {props.displayName}
          </div>
          /
          <EditableText
            key={props.branchName}
            onValueChange={(value) => {
              if (value) {
                props.setBranchName(value);
              }
            }}
            readonly={props.readonly}
            value={props.branchName}
            tooltipContent={props.readonly ? '' : t('Edit Branch Name')}
            isEditing={props.isEditingStepOrBranchName}
            setIsEditing={props.setIsEditingStepOrBranchName}
          />
        </>
      </Show>
      <Show
        when={
          inBranchView && !props.isEditingStepOrBranchName && !props.readonly
        }
      >
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

const StepNameEditor = (props: StepNameEditorProps) => {
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
    if (next.length > 0 && next !== props.value) {
      props.onValueChange(next);
    }
    props.onCommit();
  };

  return (
    <div
      ref={focusAndSelect}
      contentEditable
      suppressContentEditableWarning
      class="truncate focus:outline-hidden break-all"
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          if (ref) {
            ref.textContent = props.value;
          }
          props.onCommit();
        } else if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        }
      }}
    >
      {props.value}
    </div>
  );
};

export default EditableStepName;
