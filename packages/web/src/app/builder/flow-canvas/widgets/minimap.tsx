import { flowStructureUtil, Step } from '@activepieces/shared';
import { Show } from 'solid-js';

import { useTheme } from '@/components/providers/theme-provider';
import { stepsHooks, StepMetadata } from '@/features/pieces';
import { colorsUtils } from '@/lib/color-utils';

import { useBuilderStateContext } from '../../builder-hooks';
import { MiniMap, MiniMapNodeProps } from '../solid-flow-adapter';

const Minimap = () => {
  const [showMinimap] = useBuilderStateContext((state) => [state.showMinimap]);
  const { theme } = useTheme();
  const maskTransparency = theme === 'dark' ? 0.8 : 0.055;
  return (
    <>
      <Show when={showMinimap}>
        <MiniMap
          position="bottom-left"
          class="!rounded-md border border-border !left-0 !ml-2 overflow-hidden !bottom-[45px] animate-in fade-in duration-300"
          zoomable
          pannable
          zoomStep={0.3}
          bgColor="var(--background)"
          maskColor={`rgba(0, 0, 0, ${maskTransparency})`}
          nodeComponent={(node: MiniMapNodeProps) => (
            <MinimapNode node={node} />
          )}
        />
      </Show>
    </>
  );
};

const MinimapNodeContent = (props: {
  stepMetadata: StepMetadata;
  node: MiniMapNodeProps;
}) => {
  const nodeColor = colorsUtils.useAverageColorInImage({
    imgUrl: props.stepMetadata.logoUrl ?? '',
    transparency: 50,
  });
  const defaultColor = 'oklch(92.8% 0.006 264.531)';

  return (
    <rect
      width={props.node.width}
      height={props.node.height}
      x={props.node.x}
      y={props.node.y}
      fill={nodeColor ?? defaultColor}
    />
  );
};

const MinimapContentGuard = (props: { step: Step; node: MiniMapNodeProps }) => {
  const { stepMetadata } = stepsHooks.useStepMetadata({
    step: props.step,
  });
  return (
    <Show when={stepMetadata} keyed>
      {(metadata) => (
        <MinimapNodeContent stepMetadata={metadata} node={props.node} />
      )}
    </Show>
  );
};

const MinimapNode = (props: { node: MiniMapNodeProps }) => {
  const [trigger] = useBuilderStateContext((state) => [
    state.flowVersion.trigger,
  ]);
  const step = flowStructureUtil.getStep(props.node.id, trigger);

  return (
    <Show when={step} keyed>
      {(value) => <MinimapContentGuard step={value} node={props.node} />}
    </Show>
  );
};
export default Minimap;
