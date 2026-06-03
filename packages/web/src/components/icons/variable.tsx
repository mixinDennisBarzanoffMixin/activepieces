import { motion } from 'motion/react';
import { createSignal, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

export interface VariableIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface VariableIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

function VariableIcon(props: VariableIconProps & { ref?: VariableIconHandle }) {
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
      <motion.svg
        animate={controls()}
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        variants={{
          normal: { scale: 1 },
          animate: { scale: [1, 1.1, 1] },
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        <path d="M8 21s-4-3-4-9 4-9 4-9" />
        <path d="M16 3s4 3 4 9-4 9-4 9" />
        <line x1="15" x2="9" y1="9" y2="15" />
        <line x1="9" x2="15" y1="9" y2="15" />
      </motion.svg>
    </div>
  );
}

export { VariableIcon };
