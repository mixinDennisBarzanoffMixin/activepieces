import {
  FlowActionType,
  FlowOperationRequest,
  FlowOperationType,
  flowStructureUtil,
  FlowVersion,
  isNil,
  RouterAction,
  RouterExecutionType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Split } from 'lucide-solid';
import { Show, createEffect } from 'solid-js';

import {
  BuilderField,
  createBuilderFieldArray,
  useFormContext,
} from '@/app/builder/builder-form';

import { FormField, FormItem } from '../../../../components/ui/form';
import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '../../../../components/ui/select';
import { useBuilderStateContext } from '../../builder-hooks';
import { useReactFlow } from '../../flow-canvas/solid-flow-adapter';
import { flowCanvasUtils } from '../../flow-canvas/utils/flow-canvas-utils';
import { BranchSettings } from '../branch-settings';

import { BranchesList } from './branches-list';
import BranchesToolbar from './branches-toolbar';

export const RouterSettings = (props: { readonly: boolean }) => {
  const [
    step,
    applyOperation,
    setSelectedBranchIndex,
    selectedBranchIndex,
    addOperationListener,
    removeOperationListener,
  ] = useBuilderStateContext((state) => [
    flowStructureUtil.getActionOrThrow(
      state.selectedStep!,
      state.flowVersion.trigger,
    ) as RouterAction,
    state.applyOperation,
    state.setSelectedBranchIndex,
    state.selectedBranchIndex,
    state.addOperationListener,
    state.removeOperationListener,
  ]);
  const { fitView } = useReactFlow();

  const form = useFormContext<Omit<RouterAction, 'children' | 'nextAction'>>();
  const { control, setValue, formState } = form;

  //To validate array items we need to use form.trigger()
  const { insert, remove, move } = createBuilderFieldArray({
    form,
    name: 'settings.branches',
  });
  const deleteBranch = (index: number) => {
    applyOperation({
      type: FlowOperationType.DELETE_BRANCH,
      request: {
        stepName: step.name,
        branchIndex: index,
      },
    });

    setSelectedBranchIndex(null);
    void fitView(flowCanvasUtils.createFocusStepInGraphParams(step.name));
  };

  createEffect(() => {
    const operationListener = (
      flowVersion: FlowVersion,
      operation: FlowOperationRequest,
    ) => {
      switch (operation.type) {
        case FlowOperationType.DELETE_BRANCH: {
          if (operation.request.stepName !== step.name) {
            return;
          }
          remove(operation.request.branchIndex);
          break;
        }
        case FlowOperationType.DUPLICATE_BRANCH:
        case FlowOperationType.ADD_BRANCH: {
          if (operation.request.stepName !== step.name) return;
          const updatedStep = flowStructureUtil.getActionOrThrow(
            operation.request.stepName,
            flowVersion.trigger,
          );
          if (updatedStep.type !== FlowActionType.ROUTER) {
            console.error(
              `Trying to duplicate a branch on a none router step! ${operation.request.stepName}`,
            );
            return;
          }
          const branch =
            updatedStep.settings.branches[operation.request.branchIndex];
          if (operation.type === FlowOperationType.DUPLICATE_BRANCH) {
            insert(operation.request.branchIndex + 1, {
              ...branch,
              branchName: `${branch.branchName} Copy`,
            });
          } else {
            insert(
              updatedStep.settings.branches.length - 1,
              flowStructureUtil.createBranch(
                `Branch ${updatedStep.settings.branches.length}`,
                undefined,
              ),
            );
          }
          void form.trigger();
          break;
        }
        case FlowOperationType.MOVE_BRANCH: {
          if (operation.request.stepName !== step.name) return;
          move(
            operation.request.sourceBranchIndex,
            operation.request.targetBranchIndex,
          );
          break;
        }
      }
    };

    addOperationListener(operationListener);
    return () => removeOperationListener(operationListener);
  });

  return (
    <>
      <Show when={isNil(selectedBranchIndex)}>
        <FormField
          control={control}
          name="settings.executionType"
          render={({ field }: { field: BuilderField<RouterExecutionType> }) => (
            <FormItem>
              <Label>{t('Execute')}</Label>
              <Select
                disabled={field.disabled}
                onValueChange={field.onChange}
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder={String(t('Execute'))} />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem
                    value={`${RouterExecutionType.EXECUTE_FIRST_MATCH}`}
                  >
                    {t('Only the first (left) matching branch')}
                  </SelectItem>
                  <SelectItem
                    value={`${RouterExecutionType.EXECUTE_ALL_MATCH}`}
                  >
                    {t('All matching paths from left to right')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </Show>

      <Show when={isNil(selectedBranchIndex)}>
        <div>
          <div class="flex gap-2 mb-2 items-center">
            <Split class="w-4 h-4 rotate-180" />
            <Label>{t('Branches')}</Label>
          </div>

          <BranchesList
            errors={(formState.errors.settings?.branches as unknown[]) ?? []}
            readonly={props.readonly}
            step={step}
            branchNameChanged={(index, name) => {
              setValue(`settings.branches.${index}.branchName` as const, name, {
                shouldValidate: true,
              });
            }}
            deleteBranch={deleteBranch}
            moveBranch={({ sourceIndex, targetIndex }) => {
              applyOperation({
                type: FlowOperationType.MOVE_BRANCH,
                request: {
                  stepName: step.name,
                  sourceBranchIndex: sourceIndex,
                  targetBranchIndex: targetIndex,
                },
              });
            }}
            duplicateBranch={(index) => {
              applyOperation({
                type: FlowOperationType.DUPLICATE_BRANCH,
                request: {
                  stepName: step.name,
                  branchIndex: index,
                },
              });
              setSelectedBranchIndex(index + 1);
            }}
            setSelectedBranchIndex={(index) => {
              setSelectedBranchIndex(index);
              if (step.children[index]) {
                void fitView(
                  flowCanvasUtils.createFocusStepInGraphParams(
                    step.children[index].name,
                  ),
                );
              } else {
                void fitView(
                  flowCanvasUtils.createFocusStepInGraphParams(
                    `${step.name}-big-add-button-${step.name}-branch-${index}-start-edge`,
                  ),
                );
              }
            }}
          />
          <Show when={!props.readonly}>
            <div class="mt-2">
              <BranchesToolbar
                addButtonClicked={() => {
                  applyOperation({
                    type: FlowOperationType.ADD_BRANCH,
                    request: {
                      stepName: step.name,
                      branchIndex: step.settings.branches.length - 1,
                      branchName: `Branch ${step.settings.branches.length}`,
                    },
                  });

                  setSelectedBranchIndex(step.settings.branches.length - 1);
                }}
              />
            </div>
          </Show>
        </div>
      </Show>

      <Show when={!isNil(selectedBranchIndex)}>
        <BranchSettings
          readonly={props.readonly}
          key={`settings.branches[${selectedBranchIndex}].conditions`}
          branchIndex={selectedBranchIndex}
        />
      </Show>
    </>
  );
};
