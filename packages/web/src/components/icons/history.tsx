import type { Transition, Variants } from 'motion/react';
import { createSignal } from 'solid-js';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

export interface HistoryIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface HistoryIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const ARROW_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 250,
  damping: 25,
};

const ARROW_VARIANTS: Variants = {
  normal: { rotate: '0deg' },
  animate: { rotate: '-50deg' },
};

const HAND_TRANSITION: Transition = {
  duration: 0.6,
  ease: [0.4, 0, 0.2, 1],
};

const HAND_VARIANTS: Variants = {
  normal: { rotate: 0, originX: '0%', originY: '100%' },
  animate: { rotate: -360, originX: '0%', originY: '100%' },
};

const MINUTE_HAND_TRANSITION: Transition = {
  duration: 0.5,
  ease: 'easeInOut',
};

const MINUTE_HAND_VARIANTS: Variants = {
  normal: { rotate: 0, originX: '0%', originY: '0%' },
  animate: { rotate: -45, originX: '0%', originY: '0%' },
};

function HistoryIcon(props: HistoryIconProps & { ref?: HistoryIconHandle }) {
  const ref = props.ref;
  const {
    onMouseEnter,
    onMouseLeave,
    class: className,
    size = 16,
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
        <motion.g
          animate={controls()}
          transition={ARROW_TRANSITION}
          variants={ARROW_VARIANTS}
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </motion.g>
        <motion.line
          animate={controls()}
          initial="normal"
          transition={HAND_TRANSITION}
          variants={HAND_VARIANTS}
          x1="12"
          x2="12"
          y1="12"
          y2="7"
        />
        <motion.line
          animate={controls()}
          initial="normal"
          transition={MINUTE_HAND_TRANSITION}
          variants={MINUTE_HAND_VARIANTS}
          x1="12"
          x2="16"
          y1="12"
          y2="14"
        />
      </svg>
    </div>
  );
}
HistoryIcon.displayName = 'HistoryIcon';

export { HistoryIcon };
