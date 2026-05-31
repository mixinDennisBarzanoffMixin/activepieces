import type { Variants } from 'motion/react';
import { createSignal } from 'solid-js';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

export interface WorkflowIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface WorkflowIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const RECT_VARIANTS: Variants = {
  normal: { scale: 1, originX: '50%', originY: '50%' },
  animate: {
    scale: [1, 1.15, 1],
    originX: '50%',
    originY: '50%',
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
};

const PATH_VARIANTS: Variants = {
  normal: { opacity: 1 },
  animate: {
    opacity: [1, 0.4, 1],
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
};

function WorkflowIcon(props: WorkflowIconProps & { ref?: WorkflowIconHandle }) {
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
        <motion.rect
          animate={controls()}
          variants={RECT_VARIANTS}
          height="8"
          rx="2"
          width="8"
          x="3"
          y="3"
        />
        <motion.path
          animate={controls()}
          variants={PATH_VARIANTS}
          d="M7 11v4a2 2 0 0 0 2 2h4"
        />
        <motion.rect
          animate={controls()}
          variants={RECT_VARIANTS}
          height="8"
          rx="2"
          width="8"
          x="13"
          y="13"
        />
      </svg>
    </div>
  );
}
WorkflowIcon.displayName = 'WorkflowIcon';

export { WorkflowIcon };
