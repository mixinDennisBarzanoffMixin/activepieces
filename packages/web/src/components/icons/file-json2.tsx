import type { Variants } from 'motion/react';
import { createSignal } from 'solid-js';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

export interface FileJson2IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FileJson2IconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const bracesVariants: Variants = {
  normal: { opacity: 1 },
  animate: {
    opacity: [1, 0.5, 1],
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
};

function FileJson2Icon(
  props: FileJson2IconProps & { ref?: FileJson2IconHandle },
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
        <path d="M14 22h4a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v6" />
        <path d="M14 2v5a1 1 0 0 0 1 1h5" />
        <motion.path
          animate={controls()}
          d="M5 14a1 1 0 0 0-1 1v2a1 1 0 0 1-1 1 1 1 0 0 1 1 1v2a1 1 0 0 0 1 1"
          variants={bracesVariants}
        />
        <motion.path
          animate={controls()}
          d="M9 22a1 1 0 0 0 1-1v-2a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-2a1 1 0 0 0-1-1"
          variants={bracesVariants}
        />
      </svg>
    </div>
  );
}
FileJson2Icon.displayName = 'FileJson2Icon';

export { FileJson2Icon };
