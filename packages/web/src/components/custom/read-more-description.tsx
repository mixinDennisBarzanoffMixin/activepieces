import { createMemo, createSignal, mergeProps, Show } from 'solid-js';

import { cn } from '@/lib/utils';

interface ReadMoreProps {
  text: string;
  amountOfCharacters?: number;
}

export const ReadMoreDescription = (_props: ReadMoreProps) => {
  const props = mergeProps({ amountOfCharacters: 70 }, _props);
  const [isExpanded, setIsExpanded] = createSignal(false);
  const overflow = createMemo(
    () => props.text.length > props.amountOfCharacters,
  );
  const begin = createMemo(() =>
    overflow() ? props.text.slice(0, props.amountOfCharacters) : props.text,
  );
  const end = createMemo(() => props.text.slice(props.amountOfCharacters));

  const handleKeyboard = (e: { code: string }) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      setIsExpanded(!isExpanded());
    }
  };

  return (
    <p class="text-muted-foreground text-xs whitespace-pre-wrap">
      {begin()}
      <Show when={overflow()}>
        <>
          <Show when={!isExpanded()}>
            <span>... </span>
          </Show>
          <span
            class={cn('whitespace-pre-wrap', { hidden: !isExpanded() })}
            aria-hidden={!isExpanded()}
          >
            {end()}
          </span>
          <span
            class="text-primary ml-2 cursor-pointer"
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded()}
            onKeyDown={handleKeyboard}
            onClick={() => setIsExpanded(!isExpanded())}
          >
            {isExpanded() ? 'show less' : 'show more'}
          </span>
        </>
      </Show>
    </p>
  );
};
