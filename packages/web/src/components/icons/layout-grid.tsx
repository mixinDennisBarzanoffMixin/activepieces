import type { Variants } from 'motion/react';
import { motion } from 'motion/react';
import { createSignal, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

export interface LayoutGridIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface LayoutGridIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const rectVariants = (delay: number): Variants => ({
  normal: { scale: 1 },
  animate: {
    scale: [1, 0.8, 1],
    transition: { duration: 0.4, delay, ease: 'easeInOut' },
  },
});

function LayoutGridIcon(
  props: LayoutGridIconProps & { ref?: LayoutGridIconHandle },
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
        <motion.rect
          animate={controls()}
          width="7"
          height="7"
          x="3"
          y="3"
          rx="1"
          variants={rectVariants(0)}
        />
        <motion.rect
          animate={controls()}
          width="7"
          height="7"
          x="14"
          y="3"
          rx="1"
          variants={rectVariants(0.05)}
        />
        <motion.rect
          animate={controls()}
          width="7"
          height="7"
          x="14"
          y="14"
          rx="1"
          variants={rectVariants(0.1)}
        />
        <motion.rect
          animate={controls()}
          width="7"
          height="7"
          x="3"
          y="14"
          rx="1"
          variants={rectVariants(0.15)}
        />
      </svg>
    </div>
  );
}

export { LayoutGridIcon };
