import { createSignal } from 'solid-js';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

export interface SearchIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SearchIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

function SearchIcon(props: SearchIconProps & { ref?: SearchIconHandle }) {
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
      <motion.svg
        animate={controls()}
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        transition={{
          duration: 1,
          bounce: 0.3,
        }}
        variants={{
          normal: { x: 0, y: 0 },
          animate: {
            x: [0, 0, -3, 0],
            y: [0, -4, 0, 0],
          },
        }}
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </motion.svg>
    </div>
  );
}
SearchIcon.displayName = 'SearchIcon';

export { SearchIcon };
