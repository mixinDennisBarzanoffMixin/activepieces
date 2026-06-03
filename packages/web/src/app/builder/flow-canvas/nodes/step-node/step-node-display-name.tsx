import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { cn } from '@/lib/utils';

import { StepNodeRunDurationAndPieceName } from './step-node-run-duration-and-piece-name';

const StepNodeDisplayName = (props: {
  stepDisplayName: string;
  stepIndex: number;
  isSkipped: boolean;
  pieceDisplayName: string;
  stepName: string;
}) => {
  return (
    <div class="grow flex flex-col items-start justify-center min-w-0 w-full">
      <div class=" flex items-center justify-between min-w-0 w-full">
        <TextWithTooltip
          tooltipMessage={props.stepDisplayName}
          key={props.stepDisplayName}
        >
          <div
            class={cn('text-sm truncate grow shrink ', {
              'text-accent-foreground/70': props.isSkipped,
            })}
          >
            {props.stepIndex}. {props.stepDisplayName}
          </div>
        </TextWithTooltip>
      </div>
      <StepNodeRunDurationAndPieceName
        stepName={props.stepName}
        pieceDisplayName={props.pieceDisplayName}
      />
    </div>
  );
};

export { StepNodeDisplayName };
