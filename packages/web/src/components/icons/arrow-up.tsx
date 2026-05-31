import type { Variants } from 'motion/react';
import { createSignal } from 'solid-js';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

export interface ArrowUpIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ArrowUpIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const PATH_VARIANTS: Variants = {
  normal: { d: 'm5 12 7-7 7 7', translateY: 0 },
  animate: {
    d: 'm5 12 7-7 7 7',
    translateY: [0, 3, 0],
    transition: {
      duration: 0.4,
    },
  },
};

const SECOND_PATH_VARIANTS: Variants = {
  normal: { d: 'M12 19V5' },
  animate: {
    d: ['M12 19V5', 'M12 19V10', 'M12 19V5'],
    transition: {
      duration: 0.4,
    },
  },
};

function ArrowUpIcon(props: ArrowUpIconProps & { ref?: ArrowUpIconHandle }) {
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
        <motion.path
          animate={controls()}
          d="m5 12 7-7 7 7"
          variants={PATH_VARIANTS}
        />
        <motion.path
          animate={controls()}
          d="M12 19V5"
          variants={SECOND_PATH_VARIANTS}
        />
      </svg>
    </div>
  );
}
ArrowUpIcon.displayName = 'ArrowUpIcon';

export { ArrowUpIcon };
