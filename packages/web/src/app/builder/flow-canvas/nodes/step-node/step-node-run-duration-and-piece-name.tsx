import { Timer } from 'lucide-solid';
import { Show, createMemo } from 'solid-js';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { flowRunUtils } from '@/features/flow-runs';
import { formatUtils } from '@/lib/format-utils';

const StepNodeRunDuration = (props: { duration: number }) => {
  return (
    <div class="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
      <Timer class="size-3" />
      <span>{formatUtils.formatDuration(props.duration, true)}</span>
    </div>
  );
};

const StepNodeRunDurationAndPieceName = (props: {
  stepName: string;
  pieceDisplayName: string;
}) => {
  const [run, loopIndexes] = useBuilderStateContext((state) => [
    state.run,
    state.loopsIndexes,
  ]);
  const selectedStepOutput = createMemo(() => {
    return run && run.steps
      ? flowRunUtils.extractStepOutput(props.stepName, loopIndexes, run.steps)
      : null;
  });

  return (
    <div class="flex justify-between mt-0.5 w-full items-center">
      <TextWithTooltip
        tooltipMessage={props.pieceDisplayName}
        key={props.pieceDisplayName + selectedStepOutput()?.duration}
      >
        <div class="text-xs text-muted-foreground truncate  grow shrink w-full">
          {props.pieceDisplayName}
        </div>
      </TextWithTooltip>
      <Show when={selectedStepOutput()}>
        <StepNodeRunDuration duration={selectedStepOutput()?.duration ?? 0} />
      </Show>
    </div>
  );
};

export { StepNodeRunDurationAndPieceName };
