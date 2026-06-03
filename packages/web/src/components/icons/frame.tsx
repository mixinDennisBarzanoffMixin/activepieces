import type { Transition } from 'motion/react';
import { motion } from 'motion/react';
import { createSignal, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

export interface FrameIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FrameIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 160,
  damping: 17,
  mass: 1,
};

function FrameIcon(props: FrameIconProps & { ref?: FrameIconHandle }) {
  const ref = props.ref;
  const {
    onMouseEnter,
    onMouseLeave,
    class: className,
    size = 28,
    ...divProps
  } = props;
  const [controls, setControls] = createSignal('normal');
  let isControlledRef = false;

  if (ref) {
    isControlledRef = true;
    const handle = {
      startAnimation: () => setControls('animate'),
      stopAnimation: () => setControls('normal'),
    };
    if (typeof ref === 'function') {
      ref(handle);
    } else {
      Object.assign(ref, handle);
    }
  }

  const handleMouseEnter = (e: MouseEvent) => {
    if (isControlledRef) {
      onMouseEnter?.(e);
    } else {
      setControls('animate');
    }
  };

  const handleMouseLeave = (e: MouseEvent) => {
    if (isControlledRef) {
      onMouseLeave?.(e);
    } else {
      setControls('normal');
    }
  };

  return (
    <div
      class={cn(className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...divProps}
    >
      <svg
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.line
          animate={controls()}
          transition={DEFAULT_TRANSITION}
          variants={{
            animate: { translateY: -4 },
            normal: { translateX: 0, rotate: 0, translateY: 0 },
          }}
          x1={22}
          x2={2}
          y1={6}
          y2={6}
        />
        <motion.line
          animate={controls()}
          transition={DEFAULT_TRANSITION}
          variants={{
            animate: { translateY: 4 },
            normal: { translateX: 0, rotate: 0, translateY: 0 },
          }}
          x1={22}
          x2={2}
          y1={18}
          y2={18}
        />
        <motion.line
          animate={controls()}
          transition={DEFAULT_TRANSITION}
          variants={{
            animate: { translateX: -4 },
            normal: { translateX: 0, rotate: 0, translateY: 0 },
          }}
          x1={6}
          x2={6}
          y1={2}
          y2={22}
        />
        <motion.line
          animate={controls()}
          transition={DEFAULT_TRANSITION}
          variants={{
            animate: { translateX: 4 },
            normal: { translateX: 0, rotate: 0, translateY: 0 },
          }}
          x1={18}
          x2={18}
          y1={2}
          y2={22}
        />
      </svg>
    </div>
  );
}

export { FrameIcon };
