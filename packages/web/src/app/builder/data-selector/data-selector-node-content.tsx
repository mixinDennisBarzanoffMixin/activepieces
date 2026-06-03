import {
  FlowAction,
  FlowTrigger,
  flowStructureUtil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronRight } from 'lucide-solid';
import { Show, createMemo, untrack } from 'solid-js';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { useApRipple } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { PieceIcon, stepsHooks } from '@/features/pieces';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../builder-hooks';

import { DataSelectorTreeNode } from './type';

const INDENT_PER_DEPTH = 14;
const VALUE_PREVIEW_MAX_LENGTH = 60;

type DataSelectorNodeContentProps = {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  depth: number;
  node: DataSelectorTreeNode;
};

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (event.target instanceof HTMLElement) {
      event.target.click();
    }
  }
};

const DataSelectorNodeContent = (props: DataSelectorNodeContentProps) => {
  const [flowVersion, insertMention] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.insertMention,
  ]);

  const [ripple, rippleEvent] = useApRipple();

  const stepForRoot = createMemo(() =>
    props.depth === 0 && props.node.data.type === 'value'
      ? flowStructureUtil.getStep(
          props.node.data.propertyPath,
          flowVersion.trigger,
        )
      : props.depth === 0 && props.node.data.type === 'test'
      ? flowStructureUtil.getStep(props.node.data.stepName, flowVersion.trigger)
      : undefined,
  );

  const isExpandable = createMemo(
    () => !!props.node.children && props.node.children.length > 0,
  );
  const isStepRoot = createMemo(() => props.depth === 0);
  const isPrimitiveStepRoot = createMemo(() => isStepRoot() && !isExpandable());
  const isLeafValue = createMemo(
    () => !isExpandable() && props.node.data.type === 'value' && !isStepRoot(),
  );
  const isInsertable = createMemo(
    () =>
      props.node.data.type === 'value' &&
      props.node.data.insertable &&
      !props.node.isLoopStepNode,
  );

  const arrayValue = createMemo(() =>
    props.node.data.type === 'value' && Array.isArray(props.node.data.value)
      ? props.node.data.value
      : null,
  );
  const showArrayCount = createMemo(
    () => isExpandable() && arrayValue() !== null,
  );

  const handleClick = (e: MouseEvent) => {
    if (isExpandable()) {
      rippleEvent(e);
      props.setExpanded(!props.expanded);
      return;
    }
    if (isInsertable() && insertMention && props.node.data.type === 'value') {
      rippleEvent(e);
      insertMention(props.node.data.propertyPath);
    }
  };

  const showValuePreview = createMemo(
    () => (isLeafValue() || isPrimitiveStepRoot()) && isInsertable(),
  );
  const valuePreview = createMemo(() =>
    showValuePreview() && props.node.data.type === 'value'
      ? formatValuePreview(props.node.data.value)
      : '',
  );

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyPress}
      ref={ripple}
      onClick={handleClick}
      class={cn(
        'w-full max-w-full select-none focus:outline-hidden cursor-pointer group transition-colors',
        'hover:bg-accent/60 focus:bg-accent dark:hover:bg-accent/20',
      )}
      data-depth={props.depth}
    >
      <div
        class={cn(
          'flex items-center gap-1.5 pr-2 min-w-0',
          isStepRoot() ? 'min-h-[40px] py-1.5' : 'min-h-[32px]',
        )}
        style={{ 'padding-left': props.depth * INDENT_PER_DEPTH + 12 }}
      >
        <Show when={!isStepRoot() && isExpandable()}>
          <ChevronRight
            class={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform',
              props.expanded && 'rotate-90',
            )}
          />
        </Show>
        <Show when={!isStepRoot() && !isExpandable()}>
          <div class="size-3.5 shrink-0" aria-hidden />
        </Show>

        <Show when={isStepRoot() && stepForRoot()}>
          <StepRootIcon step={stepForRoot()} />
        </Show>

        <div class="flex items-center gap-1.5 min-w-0 flex-1">
          <Show when={props.node.data.type !== 'test'}>
            <span
              class={cn(
                'truncate min-w-0 shrink-0 max-w-[40%]',
                isStepRoot()
                  ? 'font-medium text-foreground text-sm'
                  : 'text-foreground text-sm',
              )}
            >
              {props.node.data.displayName}
            </span>
          </Show>

          <Show when={showArrayCount()}>
            <span class="shrink-0 text-xs text-muted-foreground">
              {t('{count, plural, =1 {1 item} other {# items}}', {
                count: arrayValue()?.length ?? 0,
              })}
            </span>
          </Show>

          <Show when={showValuePreview() && valuePreview() !== ''}>
            <>
              <span class="shrink-0 text-muted-foreground">:</span>
              <TextWithTooltip tooltipMessage={String(valuePreview())}>
                <span class="min-w-0 truncate text-primary text-sm flex-1">
                  {valuePreview()}
                </span>
              </TextWithTooltip>
            </>
          </Show>
        </div>

        <Show when={isInsertable()}>
          <Button
            variant="basic"
            size="sm"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              if (insertMention && props.node.data.type === 'value') {
                insertMention(props.node.data.propertyPath);
              }
            }}
            class={cn(
              'h-6 px-2 text-xs text-primary shrink-0 opacity-0 transition-opacity',
              'group-hover:opacity-100 focus-visible:opacity-100',
            )}
          >
            {t('Insert')}
          </Button>
        </Show>

        <Show when={isStepRoot() && isExpandable()}>
          <ChevronDown
            class={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              !props.expanded && '-rotate-90',
            )}
          />
        </Show>
      </div>
    </div>
  );
};

const StepRootIcon = (props: { step: FlowAction | FlowTrigger }) => {
  const step = untrack(() => props.step);
  const { stepMetadata } = stepsHooks.useStepMetadata({ step });
  return (
    <Show when={stepMetadata}>
      <div class="shrink-0">
        <PieceIcon
          displayName={String(stepMetadata?.displayName ?? '')}
          logoUrl={String(stepMetadata?.logoUrl ?? '')}
          showTooltip={false}
          border={false}
          size="xs"
        />
      </div>
    </Show>
  );
};

const formatValuePreview = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') {
    const trimmed = value.replace(/\s+/g, ' ').trim();
    return trimmed.length > VALUE_PREVIEW_MAX_LENGTH
      ? `${trimmed.slice(0, VALUE_PREVIEW_MAX_LENGTH)}…`
      : trimmed;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  const json = JSON.stringify(value);
  return json.length > VALUE_PREVIEW_MAX_LENGTH
    ? `${json.slice(0, VALUE_PREVIEW_MAX_LENGTH)}…`
    : json;
};

export { DataSelectorNodeContent };
