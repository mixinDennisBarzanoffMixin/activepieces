import type { Variants } from 'motion/react';
import { createSignal } from 'solid-js';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

export interface TableIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface TableIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const ROW_VARIANTS: Variants = {
  normal: { y: 0, opacity: 1 },
  animate: (delay: number) => ({
    y: [0, -2, 0],
    opacity: [1, 0.6, 1],
    transition: { duration: 0.4, delay: delay * 0.08, ease: 'easeInOut' },
  }),
};

function TableIcon(props: TableIconProps & { ref?: TableIconHandle }) {
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
        {/* Outer shell */}
        <motion.path
          animate={controls()}
          custom={0}
          variants={ROW_VARIANTS}
          d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"
        />
      </svg>
    </div>
  );
}
TableIcon.displayName = 'TableIcon';

export { TableIcon };
