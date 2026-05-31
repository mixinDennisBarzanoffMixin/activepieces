import {
  RouterAction,
  BranchExecutionType,
  isNil,
  RouterActionSettings,
} from '@activepieces/shared';
import { t } from 'i18next';
import { GripVertical, Trash, CopyPlus, Pencil } from 'lucide-solid';
import { For, Show, createSignal } from 'solid-js';

import { useFormContext } from '@/app/builder/builder-form';
import EditableText from '@/components/custom/editable-text';
import { Button } from '@/components/ui/button';
import {
  Sortable,
  SortableDragHandle,
  SortableItem,
} from '@/components/ui/sortable';

import { InvalidStepIcon } from '../../../../components/custom/alert-icon';
import { Separator } from '../../../../components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { cn } from '../../../../lib/utils';

type BranchListProps = {
  step: RouterAction;
  setSelectedBranchIndex: (index: number) => void;
  deleteBranch: (index: number) => void;
  duplicateBranch: (index: number) => void;
  errors: unknown[];
  readonly: boolean;
  branchNameChanged: (index: number, name: string) => void;
  moveBranch: ({
    sourceIndex,
    targetIndex,
  }: {
    sourceIndex: number;
    targetIndex: number;
  }) => void;
};
export const BranchesList = ({
  step,
  setSelectedBranchIndex,
  errors,
  duplicateBranch,
  deleteBranch,
  readonly,
  branchNameChanged,
  moveBranch,
}: BranchListProps) => {
  const [branchNameEditingIndex, setBranchNameEditingIndex] = createSignal<
    number | null
  >(null);
  const form = useFormContext<RouterAction>();
  return (
    <Sortable
      value={step.settings.branches.map((branch, idx) => ({
        id: idx + 1,
        branch,
      }))}
      onMove={({ activeIndex, overIndex }) => {
        moveBranch({ sourceIndex: activeIndex, targetIndex: overIndex });
      }}
    >
      <For each={step.settings.branches}>
        {(branch, index) =>
          branch.branchType === BranchExecutionType.FALLBACK ? (
            <></>
          ) : (
            <SortableItem key={index} value={index + 1} asChild>
              <div>
                <BranchListItem
                  branch={branch}
                  branchIndex={index}
                  readonly={readonly}
                  onClick={() => {
                    setSelectedBranchIndex(index);
                  }}
                  errors={errors}
                  duplicateBranch={() => {
                    duplicateBranch(index);
                    form.trigger();
                  }}
                  deleteBranch={() => {
                    deleteBranch(index);
                    form.trigger();
                  }}
                  isEditingBranchName={branchNameEditingIndex === index}
                  setIsEditingBranchName={(isEditing) =>
                    isEditing
                      ? setBranchNameEditingIndex(index)
                      : setBranchNameEditingIndex(null)
                  }
                  branchNameChanged={(name) => {
                    branchNameChanged(index, name);
                  }}
                  showDeleteButton={step.settings.branches.length > 2}
                ></BranchListItem>

                <Show
                  when={index === step.settings.branches.length - 2()}
                  fallback={<Separator></Separator>}
                >
                  {null}
                </Show>
              </div>
            </SortableItem>
          )
        }
      </For>
    </Sortable>
  );
};

type BranchListItemProps = {
  branch: RouterActionSettings['branches'][number];
  branchIndex: number;
  readonly: boolean;
  onClick: () => void;
  errors: unknown[];
  duplicateBranch: () => void;
  deleteBranch: () => void;
  isEditingBranchName: boolean;
  setIsEditingBranchName: (isEditing: boolean) => void;
  branchNameChanged: (name: string) => void;
  showDeleteButton: boolean;
};

export const BranchListItem = ({
  branch,
  branchIndex,
  readonly,
  onClick,
  errors,
  duplicateBranch,
  deleteBranch,
  isEditingBranchName,
  setIsEditingBranchName,
  branchNameChanged,
  showDeleteButton,
}: BranchListItemProps) => {
  return (
    <div
      className={
        'flex items-center gap-2 hover:transition-colors   has-[div.button-group:hover]:bg-background  text-sm hover:bg-gray-100 dark:hover:bg-accent px-2 cursor-pointer'
      }
      onClick={() => {
        onClick();
      }}
    >
      <EditableText
        key={branch.branchName + branchIndex}
        readonly={readonly}
        value={branch.branchName}
        onValueChange={(value) => {
          if (value) {
            branchNameChanged(value);
          }
        }}
        isEditing={isEditingBranchName}
        setIsEditing={setIsEditingBranchName}
        disallowEditingOnClick={true}
      ></EditableText>

      <Show when={!isNil(errors[branchIndex])()}>
        <div className="min-w-[16px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <InvalidStepIcon class="h-4 w-4 shrink-0"></InvalidStepIcon>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('Incomplete settings')}
            </TooltipContent>
          </Tooltip>
        </div>
      </Show>
      <div className="grow"></div>
      <div
        className={cn('flex gap-2 py-1 items-center button-group', {
          'pointer-events-none': readonly,
          'opacity-0': readonly,
        })}
      >
        <Show when={showDeleteButton()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={'ghost'}
                size={'icon'}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBranch();
                }}
              >
                <Trash class="w-4 h-4 stroke-destructive"></Trash>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Delete')}</TooltipContent>
          </Tooltip>
        </Show>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={'ghost'}
              size={'icon'}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingBranchName(true);
              }}
            >
              <Pencil class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Rename')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={'ghost'}
              size={'icon'}
              onClick={(e) => {
                e.stopPropagation();
                duplicateBranch();
              }}
            >
              <CopyPlus class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Duplicate')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <SortableDragHandle
              variant="ghost"
              size="icon"
              disabled={readonly}
              class={'shrink-0 size-7'}
            >
              <GripVertical class="size-4" aria-hidden="true" />
            </SortableDragHandle>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Move')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
