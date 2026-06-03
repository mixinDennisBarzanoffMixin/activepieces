import type { Transition, Variants } from 'motion/react';
import { motion } from 'motion/react';
import { createSignal, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

export interface WebhookIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface WebhookIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const TRANSITION: Transition = {
  duration: 0.3,
  opacity: { delay: 0.15 },
};

const VARIANTS: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
  },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      ...TRANSITION,
      delay: 0.1,
    },
  },
};

function WebhookIcon(props: WebhookIconProps & { ref?: WebhookIconHandle }) {
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
        <motion.path
          animate={controls()}
          d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"
          variants={VARIANTS}
        />
        <motion.path
          animate={controls()}
          d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"
          variants={VARIANTS}
        />
        <motion.path
          animate={controls()}
          d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"
          variants={VARIANTS}
        />
      </svg>
    </div>
  );
}

export { WebhookIcon };
