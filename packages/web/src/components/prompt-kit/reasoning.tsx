import { ChevronDownIcon } from 'lucide-solid';
import {
  Accessor,
  createSignal,
  createEffect,
  createContext,
  useContext,
  JSX,
  Show,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js';

import { cn } from '@/lib/utils';

import { Markdown } from './markdown';

type ReasoningContextType = {
  open: Accessor<boolean>;
  onOpenChange: (open: boolean) => void;
};

const ReasoningContext = createContext<ReasoningContextType | undefined>(
  undefined,
);

function useReasoningContext() {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error(
      'useReasoningContext must be used within a Reasoning provider',
    );
  }
  return context;
}

export type ReasoningProps = {
  children: JSX.Element;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isStreaming?: boolean;
};
function Reasoning(props: ReasoningProps) {
  const [internalOpen, setInternalOpen] = createSignal(false);
  const [wasAutoOpened, setWasAutoOpened] = createSignal(false);

  const controlled = () => props.open !== undefined;
  const open = () => (controlled() ? props.open! : internalOpen());

  const change = (value: boolean) => {
    if (!controlled()) {
      setInternalOpen(value);
    }
    props.onOpenChange?.(value);
  };

  createEffect(() => {
    if (props.isStreaming && !wasAutoOpened()) {
      if (!controlled()) setInternalOpen(true);
      setWasAutoOpened(true);
      return;
    }

    if (!props.isStreaming && wasAutoOpened()) {
      if (!controlled()) setInternalOpen(false);
      setWasAutoOpened(false);
    }
  });

  return (
    <ReasoningContext.Provider
      value={{
        open,
        onOpenChange: change,
      }}
    >
      <div class={props.className}>{props.children}</div>
    </ReasoningContext.Provider>
  );
}

export type ReasoningTriggerProps = {
  children: JSX.Element;
  className?: string;
} & JSX.HTMLAttributes<HTMLButtonElement>;

function ReasoningTrigger(props: ReasoningTriggerProps) {
  const [local, rest] = splitProps(props, [
    'children',
    'className',
    'onClick',
    'ref',
  ]);
  const context = useReasoningContext();

  return (
    <button
      ref={local.ref}
      class={cn('flex cursor-pointer items-center gap-2', local.className)}
      onClick={(event) => {
        local.onClick?.(event);
        if (!event.defaultPrevented) context.onOpenChange(!context.open());
      }}
      {...rest}
    >
      <span class="text-primary">{local.children}</span>
      <div
        class={cn(
          'transform transition-transform',
          context.open() ? 'rotate-180' : '',
        )}
      >
        <ChevronDownIcon class="size-4" />
      </div>
    </button>
  );
}

export type ReasoningContentProps = {
  children: JSX.Element;
  className?: string;
  markdown?: boolean;
  contentClassName?: string;
} & JSX.HTMLAttributes<HTMLDivElement>;

function ReasoningContent(_props: ReasoningContentProps) {
  const merged = mergeProps({ markdown: false }, _props);
  const [local, props] = splitProps(merged, [
    'children',
    'className',
    'contentClassName',
    'markdown',
  ]);
  let contentRef: HTMLDivElement | undefined;
  let innerRef: HTMLDivElement | undefined;
  const context = useReasoningContext();

  createEffect(() => {
    if (!contentRef || !innerRef) return;

    const observer = new ResizeObserver(() => {
      if (contentRef && innerRef && context.open()) {
        contentRef.style.maxHeight = `${innerRef.scrollHeight}px`;
      }
    });

    observer.observe(innerRef);

    if (context.open()) {
      contentRef.style.maxHeight = `${innerRef.scrollHeight}px`;
    }

    onCleanup(() => observer.disconnect());
  });

  return (
    <div
      ref={(el) => (contentRef = el)}
      class={cn(
        'overflow-hidden transition-[max-height] duration-150 ease-out',
        local.className,
      )}
      style={{
        'max-height':
          context.open() && contentRef ? `${contentRef.scrollHeight}px` : '0px',
      }}
      {...props}
    >
      <div
        ref={(el) => (innerRef = el)}
        class={cn(
          'text-muted-foreground prose prose-sm dark:prose-invert',
          local.contentClassName,
        )}
      >
        <Show when={local.markdown} fallback={local.children}>
          <Markdown>{local.children as string}</Markdown>
        </Show>
      </div>
    </div>
  );
}

export { Reasoning, ReasoningTrigger, ReasoningContent };
