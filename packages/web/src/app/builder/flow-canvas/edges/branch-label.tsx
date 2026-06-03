import {
  FlowActionType,
  BranchExecutionType,
  FlowOperationType,
  flowStructureUtil,
  isNil,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import { t } from 'i18next';
import { CopyPlus, EllipsisVertical, Trash2 } from 'lucide-solid';
import { Show, createMemo, createSignal } from 'solid-js';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { cn } from '../../../../lib/utils';
import { useBuilderStateContext } from '../../builder-hooks';
import { useReactFlow } from '../solid-flow-adapter';
import { flowCanvasConsts } from '../utils/consts';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';

type BaseBranchLabel = {
  label: string;
  targetNodeName: string;
  sourceNodeName: string;
  stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH;
  branchIndex: number;
};

const BranchLabel = (props: BaseBranchLabel) => {
  const [
    selectedStep,
    selectedBranchIndex,
    selectStepByName,
    setSelectedBranchIndex,
    flowVersion,
    applyOperation,
    readonly,
  ] = useBuilderStateContext((state) => [
    state.selectedStep,
    state.selectedBranchIndex,
    state.selectStepByName,
    state.setSelectedBranchIndex,
    state.flowVersion,
    state.applyOperation,
    state.readonly,
  ]);

  const step = createMemo(() =>
    flowStructureUtil.getStep(props.sourceNodeName, flowVersion.trigger),
  );
  const router = createMemo(() => {
    const value = step();
    return value?.type === FlowActionType.ROUTER ? value : undefined;
  });
  const isFallbackBranch = () =>
    router()?.settings.branches[props.branchIndex]?.branchType ===
    BranchExecutionType.FALLBACK;
  const isOtherwiseBranch = () => isFallbackBranch();
  const isBranchSelected = () =>
    selectedStep === props.sourceNodeName &&
    props.branchIndex === selectedBranchIndex;
  const { fitView } = useReactFlow();
  const [isDropdownMenuOpen, setIsDropdownMenuOpen] = createSignal(false);

  return (
    <Show when={!isNil(router())}>
      <div
        class="h-full flex items-center justify-center "
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDropdownMenuOpen(true);
        }}
      >
        <div
          class="bg-builder-background"
          style={{
            'padding-top': flowCanvasConsts.LABEL_VERTICAL_PADDING / 2 + 'px',
            'padding-bottom':
              flowCanvasConsts.LABEL_VERTICAL_PADDING / 2 + 'px',
          }}
        >
          <div
            class={cn(
              'flex items-center justify-center gap-0.5 select-none transition-all rounded-md  text-sm border  border-solid bg-primary-100/30 dark:bg-primary-100/15  border-primary/50   px-2 text-primary/80 dark:text-primary/90   hover:text-primary hover:border-primary',
              {
                'border-primary text-primary': isBranchSelected(),
                'bg-border/60 text-foreground/70 dark:text-foreground/70  border-border hover:text-foreground/70 hover:bg-border/60 hover:border-border cursor-default':
                  isOtherwiseBranch(),
              },
            )}
            style={{
              height: flowCanvasConsts.LABEL_HEIGHT + 'px',
              'max-width': flowCanvasConsts.AP_NODE_SIZE.STEP.width - 10 + 'px',
            }}
            onClick={() => {
              if (isOtherwiseBranch()) return;
              selectStepByName(props.sourceNodeName);
              setSelectedBranchIndex(props.branchIndex);
              void fitView(
                flowCanvasUtils.createFocusStepInGraphParams(
                  props.targetNodeName,
                ),
              );
            }}
          >
            <div class="truncate">
              <Show when={props.label === 'Otherwise'} fallback={props.label}>
                {t('Otherwise')}
              </Show>
            </div>

            <Show when={!isOtherwiseBranch() && !readonly && !isNil(router())}>
              <DropdownMenu
                modal={true}
                open={isDropdownMenuOpen}
                onOpenChange={setIsDropdownMenuOpen}
              >
                <DropdownMenuTrigger asChild>
                  <div
                    class="h-5 shrink-0 border border-transparent hover:border-solid hover:border-primary-300/50 transition-all rounded-full w-5 flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EllipsisVertical class="h-4 w-4" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  onClick={(e: MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <DropdownMenuItem
                    onSelect={(e: Event) => {
                      e.preventDefault();
                      e.stopPropagation();
                      applyOperation({
                        type: FlowOperationType.DUPLICATE_BRANCH,
                        request: {
                          stepName: props.sourceNodeName,
                          branchIndex: props.branchIndex,
                        },
                      });
                      setSelectedBranchIndex(props.branchIndex + 1);
                    }}
                  >
                    <div class="flex cursor-pointer  flex-row gap-2 items-center">
                      <CopyPlus class="h-4 w-4" />
                      <span>{t('Duplicate Branch')}</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={(router()?.settings.branches.length ?? 0) <= 2}
                    onSelect={(e: Event) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedBranchIndex(null);
                      applyOperation({
                        type: FlowOperationType.DELETE_BRANCH,
                        request: {
                          stepName: props.sourceNodeName,
                          branchIndex: props.branchIndex,
                        },
                      });
                      selectStepByName(props.sourceNodeName);
                    }}
                  >
                    <div class="flex cursor-pointer  flex-row gap-2 items-center">
                      <Trash2 class="h-4 w-4 text-destructive" />
                      <span class="text-destructive">{t('Delete Branch')}</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

export { BranchLabel };
