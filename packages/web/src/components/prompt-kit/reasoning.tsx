import { ChevronDownIcon } from 'lucide-solid';
import {
  createSignal,
  createEffect,
  createContext,
  useContext,
  JSX,
  onCleanup,
} from 'solid-js';

import { cn } from '@/lib/utils';

import { Markdown } from './markdown';

type ReasoningContextType = {
  isOpen: boolean;
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
function Reasoning({
  children,
  className,
  open,
  onOpenChange,
  isStreaming,
}: ReasoningProps) {
  const [internalOpen, setInternalOpen] = createSignal(false);
  const [wasAutoOpened, setWasAutoOpened] = createSignal(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  createEffect(() => {
    if (isStreaming && !wasAutoOpened) {
      if (!isControlled) setInternalOpen(true);
      setWasAutoOpened(true);
    }

    if (!isStreaming && wasAutoOpened) {
      if (!isControlled) setInternalOpen(false);
      setWasAutoOpened(false);
    }
  }, [isStreaming, wasAutoOpened, isControlled]);

  return (
    <ReasoningContext.Provider
      value={{
        isOpen,
        onOpenChange: handleOpenChange,
      }}
    >
      <div className={className}>{children}</div>
    </ReasoningContext.Provider>
  );
}

export type ReasoningTriggerProps = {
  children: JSX.Element;
  className?: string;
} & JSX.HTMLAttributes<HTMLButtonElement>;

function ReasoningTrigger(props: ReasoningTriggerProps) {
  const { children, className, onClick, ref, ...rest } = props;
  const { isOpen, onOpenChange } = useReasoningContext();

  return (
    <button
      ref={ref}
      className={cn('flex cursor-pointer items-center gap-2', className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onOpenChange(!isOpen);
      }}
      {...rest}
    >
      <span className="text-primary">{children}</span>
      <div
        className={cn('transform transition-transform', isOpen ? 'rotate-180' : '')}
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

function ReasoningContent({
  children,
  className,
  contentClassName,
  markdown = false,
  ...props
}: ReasoningContentProps) {
  let contentRef: HTMLDivElement | undefined;
  let innerRef: HTMLDivElement | undefined;
  const { isOpen } = useReasoningContext();

  createEffect(() => {
    if (!contentRef || !innerRef) return;

    const observer = new ResizeObserver(() => {
      if (contentRef && innerRef && isOpen) {
        contentRef.style.maxHeight = `${innerRef.scrollHeight}px`;
      }
    });

    observer.observe(innerRef);

    if (isOpen) {
      contentRef.style.maxHeight = `${innerRef.scrollHeight}px`;
    }

    onCleanup(() => observer.disconnect());
  }, [isOpen]);

  const content = markdown ? (
    <Markdown>{children as string}</Markdown>
  ) : (
    children
  );

  return (
    <div
      ref={(el) => (contentRef = el)}
      className={cn(
        'overflow-hidden transition-[max-height] duration-150 ease-out',
        className,
      )}
      style={{
        maxHeight: isOpen && contentRef ? `${contentRef.scrollHeight}px` : '0px',
      }}
      {...props}
    >
      <div
        ref={(el) => (innerRef = el)}
        className={cn(
          'text-muted-foreground prose prose-sm dark:prose-invert',
          contentClassName,
        )}
      >
        {content}
      </div>
    </div>
  );
}

export { Reasoning, ReasoningTrigger, ReasoningContent };
