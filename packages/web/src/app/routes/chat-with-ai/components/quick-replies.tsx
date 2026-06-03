import { motion } from 'motion/react';
import { For, Show } from 'solid-js';

export function QuickReplies(props: {
  replies: string[];
  onSend: (text: string, files?: File[]) => void;
}) {
  return (
    <Show when={props.replies.length > 0}>
      <div class="flex flex-wrap gap-2 py-2">
        <For each={props.replies}>
          {(reply, i) => (
            <motion.button
              type="button"
              onClick={() => props.onSend(reply)}
              class="px-3 py-1.5 text-sm rounded-full border bg-background hover:bg-muted transition-colors cursor-pointer"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i() * 0.06 }}
            >
              {reply}
            </motion.button>
          )}
        </For>
      </div>
    </Show>
  );
}
