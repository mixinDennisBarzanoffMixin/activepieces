import { flowCanvasConsts } from '../../utils/consts';

const StepNodeName = (props: { stepName: string }) => {
  return (
    <div
      class="absolute left-full bg-builder-background ml-3 text-accent-foreground text-xs opacity-0 transition-all duration-300 group-hover:opacity-100 "
      style={{
        top: `${flowCanvasConsts.AP_NODE_SIZE.STEP.height / 2 - 12}px`,
      }}
    >
      {props.stepName}
    </div>
  );
};

export { StepNodeName };
