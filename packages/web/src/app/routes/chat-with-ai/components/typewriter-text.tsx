import { motion } from 'motion/react';
import { createEffect, createSignal, For, Show } from 'solid-js';
const CHAR_DELAY = 0.03;

export function TypewriterText(props: { text: string; className?: string }) {
  const [prevText, setPrevText] = createSignal<string>();
  const [isAnimating, setIsAnimating] = createSignal(false);

  createEffect(() => {
    if (prevText() === undefined) {
      setPrevText(props.text);
      return;
    }
    if (props.text !== prevText()) {
      setIsAnimating(true);
      setPrevText(props.text);
    }
  });

  return (
    <Show
      when={isAnimating()}
      fallback={<span class={props.className}>{props.text}</span>}
    >
      <span class={props.className}>
        <For each={props.text.split('')}>
          {(char, i) => (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1, delay: i() * CHAR_DELAY }}
              onAnimationComplete={
                i() === props.text.length - 1
                  ? () => setIsAnimating(false)
                  : undefined
              }
            >
              {char}
            </motion.span>
          )}
        </For>
      </span>
    </Show>
  );
}
