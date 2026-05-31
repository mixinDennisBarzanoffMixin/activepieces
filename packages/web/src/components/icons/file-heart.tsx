import type { Variants } from 'motion/react';
import { createSignal } from 'solid-js';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

export interface FileHeartIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FileHeartIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const heartVariants: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.2, 1],
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
};

function FileHeartIcon(
  props: FileHeartIconProps & { ref?: FileHeartIconHandle },
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
        <path d="M13 22h5a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v7" />
        <path d="M14 2v5a1 1 0 0 0 1 1h5" />
        <motion.path
          animate={controls()}
          d="M3.62 18.8A2.25 2.25 0 1 1 7 15.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a1 1 0 0 1-1.507 0z"
          variants={heartVariants}
        />
      </svg>
    </div>
  );
}
FileHeartIcon.displayName = 'FileHeartIcon';

export { FileHeartIcon };
