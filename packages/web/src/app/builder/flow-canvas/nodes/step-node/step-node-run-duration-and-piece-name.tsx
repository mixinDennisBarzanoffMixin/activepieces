import { Timer } from 'lucide-solid';
import { Show, createMemo } from 'solid-js';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { flowRunUtils } from '@/features/flow-runs';
import { formatUtils } from '@/lib/format-utils';

const StepNodeRunDuration = ({ duration }: { duration: number }) => {
  return (
    <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
      <Timer class="size-3" />
      <span>{formatUtils.formatDuration(duration, true)}</span>
    </div>
  );
};

const StepNodeRunDurationAndPieceName = ({
  stepName,
  pieceDisplayName,
}: {
  stepName: string;
  pieceDisplayName: string;
}) => {
  const [run, loopIndexes, flowVersion] = useBuilderStateContext((state) => [
    state.run,
    state.loopsIndexes,
    state.flowVersion,
  ]);
  const selectedStepOutput = createMemo(() => {
    return run && run.steps
      ? flowRunUtils.extractStepOutput(stepName, loopIndexes, run.steps)
      : null;
  });

  return (
    <div className="flex justify-between mt-0.5 w-full items-center">
      <TextWithTooltip
        tooltipMessage={pieceDisplayName}
        key={pieceDisplayName + selectedStepOutput?.duration}
      >
        <div className="text-xs text-muted-foreground truncate  grow shrink w-full">
          {pieceDisplayName}
        </div>
      </TextWithTooltip>
      <Show when={selectedStepOutput()}>
        <StepNodeRunDuration duration={selectedStepOutput?.duration ?? 0} />
      </Show>
    </div>
  );
};
StepNodeRunDurationAndPieceName.displayName = 'StepNodeRunDurationAndPieceName';
export { StepNodeRunDurationAndPieceName };
