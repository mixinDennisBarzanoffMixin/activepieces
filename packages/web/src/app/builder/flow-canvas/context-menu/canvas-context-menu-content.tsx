import {
  FlowAction,
  FlowActionType,
  FlowOperationType,
  FlowTriggerType,
  flowStructureUtil,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowLeftRight,
  ClipboardPaste,
  ClipboardPlus,
  Copy,
  CopyPlus,
  Route,
  RouteOff,
  Trash,
} from 'lucide-solid';
import { For, JSX, Show } from 'solid-js';

import { Shortcut, ShortcutProps } from '@/components/custom/shortcut';
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';

import { useBuilderStateContext } from '../../builder-hooks';
import { CanvasShortcuts } from '../../shortcuts';
import {
  copySelectedNodes,
  deleteSelectedNodes,
  getLastLocationAsPasteLocation,
  pasteNodes,
  toggleSkipSelectedNodes,
} from '../utils/bulk-actions';

import { CanvasContextMenuProps, ContextMenuType } from './canvas-context-menu';

const ShortcutWrapper = (props: {
  children: JSX.Element;
  shortcut: ShortcutProps;
}) => {
  return (
    <div class="flex items-center justify-between gap-4 grow">
      <div class="flex gap-2 items-center">{props.children}</div>
      <Shortcut {...props.shortcut} class="text-end" />
    </div>
  );
};

export const CanvasContextMenuContent = (props: CanvasContextMenuProps) => {
  const [
    selectedNodes,
    applyOperation,
    selectedStep,
    flowVersion,
    exitStepSettings,
    readonly,
    setOpenedPieceSelectorStepNameOrAddButtonId,
  ] = useBuilderStateContext((state) => [
    state.selectedNodes,
    state.applyOperation,
    state.selectedStep,
    state.flowVersion,
    state.exitStepSettings,
    state.readonly,
    state.setOpenedPieceSelectorStepNameOrAddButtonId,
  ]);
  const disabled = () => selectedNodes.length === 0;
  const areAllStepsSkipped = () =>
    selectedNodes.every(
      (node) =>
        !!(flowStructureUtil.getStep(node, flowVersion.trigger) as FlowAction)
          .skip,
    );
  const doSelectedNodesIncludeTrigger = () =>
    selectedNodes.some((node) => node === flowVersion.trigger.name);

  const firstSelectedStep = () =>
    flowStructureUtil.getStep(selectedNodes[0], flowVersion.trigger);
  const firstSelectedAction = () => {
    const step = firstSelectedStep();
    if (
      !step ||
      step.type === FlowTriggerType.EMPTY ||
      step.type === FlowTriggerType.PIECE
    ) {
      return undefined;
    }
    return step;
  };
  const firstSelectedRouter = () => {
    const step = firstSelectedAction();
    return step?.type === FlowActionType.ROUTER ? step : undefined;
  };
  const showPasteAfterLastStep = () =>
    !readonly && props.contextMenuType === ContextMenuType.CANVAS;
  const showPasteAsFirstLoopAction = () =>
    selectedNodes.length === 1 &&
    firstSelectedAction()?.type === FlowActionType.LOOP_ON_ITEMS &&
    !readonly &&
    props.contextMenuType === ContextMenuType.STEP;
  const showPasteAsBranchChild = () =>
    selectedNodes.length === 1 &&
    firstSelectedAction()?.type === FlowActionType.ROUTER &&
    !readonly &&
    props.contextMenuType === ContextMenuType.STEP;
  const showPasteAfterCurrentStep = () =>
    selectedNodes.length === 1 &&
    !readonly &&
    props.contextMenuType === ContextMenuType.STEP;
  const showReplace = () =>
    selectedNodes.length === 1 &&
    !readonly &&
    props.contextMenuType === ContextMenuType.STEP;

  const showCopy = () =>
    !doSelectedNodesIncludeTrigger() &&
    props.contextMenuType === ContextMenuType.STEP;
  const showDuplicate = () =>
    selectedNodes.length === 1 &&
    !doSelectedNodesIncludeTrigger() &&
    props.contextMenuType === ContextMenuType.STEP &&
    !readonly;
  const showSkip = () =>
    !doSelectedNodesIncludeTrigger() &&
    props.contextMenuType === ContextMenuType.STEP &&
    !readonly;
  const isTriggerTheOnlySelectedNode = () =>
    selectedNodes.length === 1 && doSelectedNodesIncludeTrigger();
  const showDelete = () =>
    !readonly &&
    props.contextMenuType === ContextMenuType.STEP &&
    !isTriggerTheOnlySelectedNode();
  const duplicateStep = () => {
    applyOperation({
      type: FlowOperationType.DUPLICATE_ACTION,
      request: {
        stepName: selectedNodes[0],
      },
    });
  };
  const showContextMenuContent = () =>
    showReplace() ||
    showCopy() ||
    showDuplicate() ||
    showSkip() ||
    showPasteAsFirstLoopAction() ||
    showPasteAsBranchChild() ||
    showPasteAfterCurrentStep() ||
    showPasteAfterLastStep() ||
    showDelete();

  return (
    <Show when={showContextMenuContent()}>
      <ContextMenuContent>
        <Show when={showReplace()}>
          <ContextMenuItem
            disabled={disabled()}
            onClick={() => {
              setOpenedPieceSelectorStepNameOrAddButtonId(selectedNodes[0]);
            }}
            class="flex items-center gap-2"
          >
            <ArrowLeftRight class="w-4 h-4" /> {t('Replace')}
          </ContextMenuItem>
        </Show>
        <Show when={showCopy()}>
          <ContextMenuItem
            disabled={disabled()}
            onClick={() => {
              copySelectedNodes({ selectedNodes, flowVersion });
            }}
          >
            <ShortcutWrapper shortcut={CanvasShortcuts['Copy']}>
              <Copy class="w-4 h-4" /> {t('Copy')}
            </ShortcutWrapper>
          </ContextMenuItem>
        </Show>

        <>
          <Show when={showDuplicate()}>
            <ContextMenuItem
              disabled={disabled()}
              onClick={duplicateStep}
              class="flex items-center gap-2"
            >
              <CopyPlus class="w-4 h-4" /> {t('Duplicate')}
            </ContextMenuItem>
          </Show>

          <Show when={showSkip()}>
            <ContextMenuItem
              disabled={disabled()}
              onClick={() => {
                toggleSkipSelectedNodes({
                  selectedNodes,
                  flowVersion,
                  applyOperation,
                });
              }}
            >
              <ShortcutWrapper shortcut={CanvasShortcuts['Skip']}>
                <Show
                  when={areAllStepsSkipped()}
                  fallback={<RouteOff class="h-4 w-4" />}
                >
                  <Route class="h-4 w-4" />
                </Show>
                <Show when={areAllStepsSkipped()} fallback={t('Skip')}>
                  {t('Unskip')}
                </Show>
              </ShortcutWrapper>
            </ContextMenuItem>
          </Show>
          <Show
            when={
              showPasteAsFirstLoopAction() ||
              showPasteAsBranchChild() ||
              showPasteAfterCurrentStep()
            }
          >
            <ContextMenuSeparator />
          </Show>

          <Show when={showPasteAfterLastStep()}>
            <ContextMenuItem
              onClick={() => {
                const pasteLocation =
                  getLastLocationAsPasteLocation(flowVersion);
                void pasteNodes(flowVersion, pasteLocation, applyOperation);
              }}
              class="flex items-center gap-2"
            >
              <ClipboardPlus class="w-4 h-4" /> {t('Paste After Last Step')}
            </ContextMenuItem>
          </Show>

          <Show when={showPasteAsFirstLoopAction()}>
            <ContextMenuItem
              onClick={() => {
                void pasteNodes(
                  flowVersion,
                  {
                    parentStepName: selectedNodes[0],
                    stepLocationRelativeToParent:
                      StepLocationRelativeToParent.INSIDE_LOOP,
                  },
                  applyOperation,
                );
              }}
              class="flex items-center gap-2"
            >
              <ClipboardPaste class="w-4 h-4" /> {t('Paste Inside Loop')}
            </ContextMenuItem>
          </Show>

          <Show when={showPasteAfterCurrentStep()}>
            <ContextMenuItem
              onClick={() => {
                void pasteNodes(
                  flowVersion,
                  {
                    parentStepName: selectedNodes[0],
                    stepLocationRelativeToParent:
                      StepLocationRelativeToParent.AFTER,
                  },
                  applyOperation,
                );
              }}
              class="flex items-center gap-2"
            >
              <ClipboardPlus class="w-4 h-4" /> {t('Paste After')}
            </ContextMenuItem>
          </Show>

          <Show when={showPasteAsBranchChild()}>
            <ContextMenuSub>
              <ContextMenuSubTrigger class="flex items-center gap-2">
                <ClipboardPaste class="w-4 h-4" /> {t('Paste Inside...')}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <Show when={firstSelectedRouter()}>
                  {(step) => (
                    <For each={step().settings.branches}>
                      {(branch, branchIndex) => (
                        <ContextMenuItem
                          key={branch.branchName}
                          onClick={() => {
                            void pasteNodes(
                              flowVersion,
                              {
                                parentStepName: selectedNodes[0],
                                stepLocationRelativeToParent:
                                  StepLocationRelativeToParent.INSIDE_BRANCH,
                                branchIndex,
                              },
                              applyOperation,
                            );
                          }}
                        >
                          {branch.branchName}
                        </ContextMenuItem>
                      )}
                    </For>
                  )}
                </Show>
                <Show when={firstSelectedRouter()}>
                  {(step) => (
                    <ContextMenuItem
                      onClick={() => {
                        applyOperation({
                          type: FlowOperationType.ADD_BRANCH,
                          request: {
                            stepName: step().name,
                            branchIndex: step().settings.branches.length - 1,
                            branchName: `Branch ${
                              step().settings.branches.length
                            }`,
                          },
                        });
                        void pasteNodes(
                          flowVersion,
                          {
                            parentStepName: step().name,
                            stepLocationRelativeToParent:
                              StepLocationRelativeToParent.INSIDE_BRANCH,
                            branchIndex: step().settings.branches.length - 1,
                          },
                          applyOperation,
                        );
                      }}
                    >
                      + {t('New Branch')}
                    </ContextMenuItem>
                  )}
                </Show>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </Show>

          <Show when={showDelete()}>
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                disabled={disabled()}
                onClick={() => {
                  deleteSelectedNodes({
                    selectedNodes,
                    applyOperation,
                    selectedStep,
                    exitStepSettings,
                  });
                }}
              >
                <ShortcutWrapper shortcut={CanvasShortcuts['Delete']}>
                  <Trash class="w-4 stroke-destructive h-4" />{' '}
                  <div class="text-destructive">{t('Delete')}</div>
                </ShortcutWrapper>
              </ContextMenuItem>
            </>
          </Show>
        </>
      </ContextMenuContent>
    </Show>
  );
};
