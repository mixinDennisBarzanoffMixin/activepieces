import type { Variants } from 'motion/react';
import { motion } from 'motion/react';
import { createSignal, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

export interface MousePointerClickIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface MousePointerClickIconProps
  extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const pointerVariants: Variants = {
  normal: { y: 0 },
  animate: { y: [0, 1.5, 0], transition: { duration: 0.3, ease: 'easeInOut' } },
};

const raysVariants: Variants = {
  normal: { opacity: 1, scale: 1 },
  animate: {
    opacity: [1, 0.4, 1],
    scale: [1, 0.9, 1],
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
};

function MousePointerClickIcon(
  props: MousePointerClickIconProps & { ref?: MousePointerClickIconHandle },
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
        <motion.g animate={controls()} variants={raysVariants}>
          <path d="M14 4.1 12 6" />
          <path d="m5.1 8-2.9-.8" />
          <path d="m6 12-1.9 2" />
          <path d="M7.2 2.2 8 5.1" />
        </motion.g>
        <motion.path
          animate={controls()}
          d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"
          variants={pointerVariants}
        />
      </svg>
    </div>
  );
}

export { MousePointerClickIcon };
