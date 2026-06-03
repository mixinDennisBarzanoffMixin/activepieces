import type { Variants } from 'motion/react';
import { motion } from 'motion/react';
import { createSignal, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

export interface ShieldIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ShieldIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const shieldVariants: Variants = {
  normal: { rotate: 0, y: 0 },
  animate: {
    rotate: [0, -8, 8, -4, 0],
    y: [0, -1, 0],
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
};

function ShieldIcon(props: ShieldIconProps & { ref?: ShieldIconHandle }) {
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
          variants={shieldVariants}
          style={{ originX: '12px', originY: '12px' }}
          d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
        />
      </svg>
    </div>
  );
}

export { ShieldIcon };
