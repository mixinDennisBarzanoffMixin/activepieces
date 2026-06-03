import { FlowActionType, flowStructureUtil, isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronUp } from 'lucide-solid';
import { Show, createEffect, createMemo, createSignal } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowRunUtils } from '@/features/flow-runs';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../builder-hooks';

const LoopIterationInput = (props: { stepName: string }) => {
  const [setLoopIndex, currentIndex, run, loopsIndexes, stepType] =
    useBuilderStateContext((state) => [
      state.setLoopIndex,
      state.loopsIndexes[props.stepName] ?? 0,
      state.run,
      state.loopsIndexes,
      flowStructureUtil.getStep(props.stepName, state.flowVersion.trigger)
        ?.type,
    ]);
  const stepOutput = createMemo(() => {
    return run && run.steps
      ? flowRunUtils.extractStepOutput(props.stepName, loopsIndexes, run.steps)
      : null;
  });

  const [isAnimating, setIsAnimating] = createSignal(false);
  let prevIndexRef: number | undefined;

  createEffect(() => {
    if (prevIndexRef !== currentIndex) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600); // Animation duration
      prevIndexRef = currentIndex;
      return () => clearTimeout(timer);
    }
  });

  const totalIterations = createMemo(() => {
    const output = stepOutput();
    return output?.type === FlowActionType.LOOP_ON_ITEMS && output.output
      ? output.output.iterations.length
      : 0;
  });

  function onChange(value: string) {
    const parsedValue = Math.max(
      1,
      Math.min(parseInt(value) || 1, totalIterations()),
    );
    setLoopIndex(props.stepName, parsedValue - 1);
  }

  return (
    <Show when={!isNil(run) && stepType === FlowActionType.LOOP_ON_ITEMS}>
      <div class="absolute -top-4 -left-[45px]">
        <div class="flex items-center justify-center flex-col gap-0.5">
          <LoopIterationInputButton
            onChange={onChange}
            isIncreasing={true}
            currentIndex={currentIndex}
          />
          <Tooltip>
            <TooltipTrigger>
              <Input
                class={cn(
                  'py-2 w-[35px] px-0 h-[35px] animate-in fade-in bg-background border-solid rounded-md text-center !text-xs transition-all duration-300 ease-in-out',
                  isAnimating()
                    ? 'border-2 border-primary'
                    : 'border border-border',
                )}
                type="number"
                value={currentIndex + 1}
                min={1}
                max={totalIterations()}
                onClick={(e) => {
                  if (e.button === 0) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                onChange={(e) => {
                  const input = e.currentTarget.value;
                  const value =
                    isNil(input) || input.length === 0 || input === 'e'
                      ? '1'
                      : input;
                  onChange(value);
                }}
              />
            </TooltipTrigger>
            <TooltipContent side="left">
              {t(
                'Show child steps output on round ({iteration}/{totalIterations})',
                {
                  iteration: currentIndex + 1,
                  totalIterations: totalIterations(),
                },
              )}
            </TooltipContent>
          </Tooltip>
          <LoopIterationInputButton
            onChange={onChange}
            isIncreasing={false}
            currentIndex={currentIndex}
          />
        </div>
      </div>
    </Show>
  );
};

export { LoopIterationInput };

const LoopIterationInputButton = (props: {
  onChange: (val: string) => void;
  isIncreasing: boolean;
  currentIndex: number;
}) => {
  return (
    <Button
      variant="ghost"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        props.onChange(
          (props.currentIndex + (props.isIncreasing ? 2 : 0)).toString(),
        );
      }}
      class="hover:bg-builder-background size-6"
      size="icon"
    >
      <Show
        when={props.isIncreasing}
        fallback={<ChevronDown class="w-2 h-2" />}
      >
        <ChevronUp class="w-2 h-2" />
      </Show>
    </Button>
  );
};
