import { createSignal } from 'solid-js';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

const ZAP_PATH =
  'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z';

interface ZapIconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: number;
  fillColor?: string;
  fillPercent?: number;
}

function ZapIcon(props: ZapIconProps & { ref?: ZapIconHandle }) {
  const ref = props.ref;
  const {
    class: className,
    size = 20,
    fillColor,
    fillPercent = 0,
    onMouseEnter,
    onMouseLeave,
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
    if (!isControlledRef) setControls('animate');
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: MouseEvent) => {
    if (!isControlledRef) setControls('normal');
    onMouseLeave?.(e);
  };

  return (
    <div
      className={cn(className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...divProps}
    >
      <motion.svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        animate={controls()}
        variants={{
          normal: { rotate: 0 },
          animate: { rotate: [0, -10, 8, -6, 4, -2, 1, 0] },
        }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{ transformOrigin: 'center' }}
      >
        <path
          d={ZAP_PATH}
          fill="currentColor"
          className="text-muted-foreground/20"
        />
        <path
          d={ZAP_PATH}
          style={{
            fill: fillColor ?? 'transparent',
            clipPath: `inset(${100 - fillPercent}% 0 0 0)`,
            transition: 'clip-path 0.4s ease, fill 0.35s ease',
          }}
        />
      </motion.svg>
    </div>
  );
}
ZapIcon.displayName = 'ZapIcon';

export { ZapIcon };
export interface ZapIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}
