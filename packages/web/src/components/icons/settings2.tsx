import type { Variants } from 'motion/react';
import { createSignal } from 'solid-js';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

export interface Settings2IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface Settings2IconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const topCircleVariants: Variants = {
  normal: { cx: 7 },
  animate: { cx: [7, 10, 7], transition: { duration: 0.5, ease: 'easeInOut' } },
};

const bottomCircleVariants: Variants = {
  normal: { cx: 17 },
  animate: {
    cx: [17, 14, 17],
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
};

function Settings2Icon(
  props: Settings2IconProps & { ref?: Settings2IconHandle },
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
        <path d="M14 17H5" />
        <path d="M19 7h-9" />
        <motion.circle
          animate={controls()}
          cx="17"
          cy="17"
          r="3"
          variants={bottomCircleVariants}
        />
        <motion.circle
          animate={controls()}
          cx="7"
          cy="7"
          r="3"
          variants={topCircleVariants}
        />
      </svg>
    </div>
  );
}
Settings2Icon.displayName = 'Settings2Icon';

export { Settings2Icon };
