import { motion } from 'motion/react';
import { createEffect, createSignal, For } from 'solid-js';
const CHAR_DELAY = 0.03;

export function TypewriterText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [prevText, setPrevText] = createSignal(text);
  const [isAnimating, setIsAnimating] = createSignal(false);

  createEffect(() => {
    if (text !== prevText) {
      setIsAnimating(true);
      setPrevText(text);
    }
  });

  if (!isAnimating) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      <For each={text.split('')}>
        {(char, i) => (
          <motion.span
            key={`${text}-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1, delay: i * CHAR_DELAY }}
            onAnimationComplete={
              i === text.length - 1 ? () => setIsAnimating(false) : undefined
            }
          >
            {char}
          </motion.span>
        )}
      </For>
    </span>
  );
}
