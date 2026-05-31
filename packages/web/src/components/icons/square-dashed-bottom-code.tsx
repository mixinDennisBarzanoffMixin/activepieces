import type { Variants } from 'motion/react';
import { createSignal } from 'solid-js';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

export interface SquareDashedBottomCodeIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SquareDashedBottomCodeIconProps
  extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const bracketVariants: Variants = {
  normal: { x: 0 },
  animate: {
    x: [0, -1.5, 0],
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
};

const bracketRightVariants: Variants = {
  normal: { x: 0 },
  animate: { x: [0, 1.5, 0], transition: { duration: 0.4, ease: 'easeInOut' } },
};

function SquareDashedBottomCodeIcon(
  props: SquareDashedBottomCodeIconProps & {
    ref?: SquareDashedBottomCodeIconHandle;
  },
) {
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
      className={cn(className)}
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
        <motion.path
          animate={controls()}
          d="M10 9.5 8 12l2 2.5"
          variants={bracketVariants}
        />
        <motion.path
          animate={controls()}
          d="m14 9.5 2 2.5-2 2.5"
          variants={bracketRightVariants}
        />
        <path d="M5 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2" />
        <path d="M9 21h1" />
        <path d="M14 21h1" />
      </svg>
    </div>
  );
}
SquareDashedBottomCodeIcon.displayName = 'SquareDashedBottomCodeIcon';

export { SquareDashedBottomCodeIcon };
