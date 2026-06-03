import type { Variants } from 'motion/react';
import { motion } from 'motion/react';
import { createSignal, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

export interface ServerIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ServerIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const dotVariants: Variants = {
  normal: { opacity: 1 },
  animate: {
    opacity: [1, 0.3, 1],
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
};

function ServerIcon(props: ServerIconProps & { ref?: ServerIconHandle }) {
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
        <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
        <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
        <motion.line
          animate={controls()}
          x1="6"
          x2="6.01"
          y1="6"
          y2="6"
          variants={dotVariants}
        />
        <motion.line
          animate={controls()}
          x1="6"
          x2="6.01"
          y1="18"
          y2="18"
          variants={dotVariants}
        />
      </svg>
    </div>
  );
}

export { ServerIcon };
