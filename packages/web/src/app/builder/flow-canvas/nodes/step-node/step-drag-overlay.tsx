import { FlowAction, FlowTrigger } from '@activepieces/shared';
import { t } from 'i18next';
import { createSignal } from 'solid-js';

import { SIDEBAR_ID } from '@/app/components/sidebar/dashboard';
import { stepsHooks } from '@/features/pieces';

import {
  useCursorPosition,
  useCursorPositionEffect,
} from '../../../state/cursor-position-context';
import { flowCanvasConsts } from '../../utils/consts';

const StepDragOverlay = (props: { step: FlowAction | FlowTrigger }) => {
  const { cursorPosition } = useCursorPosition();
  const [overlayPosition, setOverlayPosition] =
    createSignal<typeof cursorPosition>(cursorPosition);
  const sidebar = document.getElementById(SIDEBAR_ID);
  const sidebarWidth = sidebar?.clientWidth ?? 0;
  const left = `${
    overlayPosition.x -
    flowCanvasConsts.STEP_DRAG_OVERLAY_WIDTH / 2 -
    sidebarWidth
  }px`;
  const top = `${
    overlayPosition.y - flowCanvasConsts.STEP_DRAG_OVERLAY_HEIGHT - 20
  }px`;
  const { stepMetadata } = stepsHooks.useStepMetadata({
    step: props.step,
  });
  useCursorPositionEffect((position) => {
    setOverlayPosition(position);
  });
  return (
    <div
      class={
        'p-4 absolute left-0 top-0 cursor-grabbing z-50  opacity-75  flex items-center justify-center rounded-2xl border border-solid border bg-background cursor-grabbing'
      }
      style={{
        left,
        top,
        height: `${flowCanvasConsts.STEP_DRAG_OVERLAY_HEIGHT}px`,
        width: `${flowCanvasConsts.STEP_DRAG_OVERLAY_WIDTH}px`,
        'z-index': 99999,
      }}
      id={'dragged-step-overlay'}
    >
      <img
        id={t('logo')}
        class={'object-contain left-0 right-0 static !cursor-grabbing'}
        src={getLogoUrl(props.step.settings, stepMetadata)}
        alt={t('Step Icon')}
      />
    </div>
  );
};

function getLogoUrl(settings: unknown, metadata: unknown) {
  const custom = getStringProperty(settings, 'customLogoUrl');
  return custom ?? getStringProperty(metadata, 'logoUrl');
}

function getStringProperty(value: unknown, key: string) {
  if (typeof value !== 'object' || value === null || !(key in value)) {
    return undefined;
  }
  const property = value[key as keyof typeof value];
  return typeof property === 'string' ? property : undefined;
}

export default StepDragOverlay;
