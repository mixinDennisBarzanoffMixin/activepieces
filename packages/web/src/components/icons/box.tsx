import type { Variants } from 'motion/react';
import { motion } from 'motion/react';
import { createSignal, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

export interface BoxIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface BoxIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const LID_VARIANTS: Variants = {
  normal: { y: 0, opacity: 1 },
  animate: {
    y: [-2, 0],
    opacity: [0.5, 1],
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const BODY_VARIANTS: Variants = {
  normal: { scaleY: 1, originY: 'bottom' },
  animate: {
    scaleY: [0.95, 1],
    originY: 'bottom',
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

function BoxIcon(props: BoxIconProps & { ref?: BoxIconHandle }) {
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
        {/* Box body */}
        <motion.path
          animate={controls()}
          variants={BODY_VARIANTS}
          d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
        />
        {/* Horizontal crease (lid line) */}
        <motion.path
          animate={controls()}
          variants={LID_VARIANTS}
          d="m3.3 7 8.7 5 8.7-5"
        />
        {/* Vertical center line */}
        <motion.path
          animate={controls()}
          variants={BODY_VARIANTS}
          d="M12 22V12"
        />
      </svg>
    </div>
  );
}

export { BoxIcon };
