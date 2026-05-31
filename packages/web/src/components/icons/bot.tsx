import type { Variants } from 'motion/react';
import { createSignal } from 'solid-js';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

export interface BotIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface BotIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const bodyVariants: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -1.5, 0],
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
};

const antennaVariants: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: [0, -15, 15, 0],
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
};

function BotIcon(props: BotIconProps & { ref?: BotIconHandle }) {
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
        <motion.g
          animate={controls()}
          variants={antennaVariants}
          style={{ originX: '12px', originY: '8px' }}
        >
          <path d="M12 8V4H8" />
        </motion.g>
        <motion.g animate={controls()} variants={bodyVariants}>
          <rect height="12" rx="2" width="16" x="4" y="8" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <line x1={9} y1={13} x2={9} y2={15} />
          <line x1={15} y1={13} x2={15} y2={15} />
        </motion.g>
      </svg>
    </div>
  );
}
BotIcon.displayName = 'BotIcon';

export { BotIcon };
