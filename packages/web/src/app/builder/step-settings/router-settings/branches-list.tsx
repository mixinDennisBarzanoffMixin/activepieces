import {
  RouterAction,
  BranchExecutionType,
  isNil,
  RouterActionSettings,
} from '@activepieces/shared';
import { t } from 'i18next';
import { GripVertical, Trash, CopyPlus, Pencil } from 'lucide-solid';
import { For, Show, createMemo, createSignal } from 'solid-js';

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
export const BranchesList = (props: BranchListProps) => {
  const [branchNameEditingIndex, setBranchNameEditingIndex] = createSignal<
    number | null
  >(null);
  const form = useFormContext<RouterAction>();
  const items = createMemo(() =>
    props.step.settings.branches.map((branch, idx) => ({
      id: idx + 1,
      branch,
    })),
  );
  return (
    <Sortable
      value={items()}
      onMove={({ activeIndex, overIndex }) => {
        props.moveBranch({ sourceIndex: activeIndex, targetIndex: overIndex });
      }}
    >
      <For each={props.step.settings.branches}>
        {(branch, index) => (
          <Show
            when={branch.branchType === BranchExecutionType.FALLBACK}
            fallback={
              <SortableItem key={index()} value={index() + 1}>
                <div>
                  <BranchListItem
                    branch={branch}
                    branchIndex={index}
                    readonly={props.readonly}
                    onClick={() => {
                      props.setSelectedBranchIndex(index());
                    }}
                    errors={props.errors}
                    duplicateBranch={() => {
                      props.duplicateBranch(index());
                      void form.trigger();
                    }}
                    deleteBranch={() => {
                      props.deleteBranch(index());
                      void form.trigger();
                    }}
                    isEditingBranchName={branchNameEditingIndex() === index()}
                    setIsEditingBranchName={(isEditing) =>
                      isEditing
                        ? setBranchNameEditingIndex(index())
                        : setBranchNameEditingIndex(null)
                    }
                    branchNameChanged={(name) => {
                      props.branchNameChanged(index(), name);
                    }}
                    showDeleteButton={props.step.settings.branches.length > 2}
                  />

                  <Show
                    when={index() === props.step.settings.branches.length - 2}
                    fallback={<Separator />}
                  >
                    {null}
                  </Show>
                </div>
              </SortableItem>
            }
          >
            <></>
          </Show>
        )}
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

export const BranchListItem = (props: BranchListItemProps) => {
  return (
    <div
      class={
        'flex items-center gap-2 hover:transition-colors   has-[div.button-group:hover]:bg-background  text-sm hover:bg-gray-100 dark:hover:bg-accent px-2 cursor-pointer'
      }
      onClick={() => {
        props.onClick();
      }}
    >
      <EditableText
        key={props.branch.branchName + props.branchIndex}
        readonly={props.readonly}
        value={props.branch.branchName}
        onValueChange={(value) => {
          if (value) {
            props.branchNameChanged(value);
          }
        }}
        isEditing={props.isEditingBranchName}
        setIsEditing={props.setIsEditingBranchName}
        disallowEditingOnClick={true}
      />

      <Show when={!isNil(props.errors[props.branchIndex])}>
        <div class="min-w-[16px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <InvalidStepIcon class="h-4 w-4 shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('Incomplete settings')}
            </TooltipContent>
          </Tooltip>
        </div>
      </Show>
      <div class="grow" />
      <div
        class={cn('flex gap-2 py-1 items-center button-group', {
          'pointer-events-none': props.readonly,
          'opacity-0': props.readonly,
        })}
      >
        <Show when={props.showDeleteButton}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={'ghost'}
                size={'icon'}
                onClick={(e) => {
                  e.stopPropagation();
                  props.deleteBranch();
                }}
              >
                <Trash class="w-4 h-4 stroke-destructive" />
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
                props.setIsEditingBranchName(true);
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
                props.duplicateBranch();
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
              disabled={props.readonly}
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
