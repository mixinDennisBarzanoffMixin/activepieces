import type { Variants } from 'motion/react';
import { motion } from 'motion/react';
import { createSignal, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

export interface UserRoundPlusIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface UserRoundPlusIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const VERTICAL_BAR_VARIANTS: Variants = {
  normal: {
    opacity: 1,
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: {
      delay: 0.3,
      duration: 0.2,
      opacity: { duration: 0.1, delay: 0.3 },
    },
  },
};

const HORIZONTAL_BAR_VARIANTS: Variants = {
  normal: {
    opacity: 1,
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: {
      delay: 0.6,
      duration: 0.2,
      opacity: { duration: 0.1, delay: 0.6 },
    },
  },
};

function UserRoundPlusIcon(
  props: UserRoundPlusIconProps & { ref?: UserRoundPlusIconHandle },
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
      <motion.svg
        fill="none"
        height={size}
        initial="normal"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M2 21a8 8 0 0 1 13.292-6" />
        <circle cx="10" cy="8" r="5" />
        <motion.path
          animate={controls()}
          d="M19 16v6"
          initial="normal"
          variants={VERTICAL_BAR_VARIANTS}
        />
        <motion.path
          animate={controls()}
          d="M22 19h-6"
          initial="normal"
          variants={HORIZONTAL_BAR_VARIANTS}
        />
      </motion.svg>
    </div>
  );
}

export { UserRoundPlusIcon };
