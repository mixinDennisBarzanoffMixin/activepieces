import { JSX } from 'solid-js';

import { cn } from '@/lib/utils';

export type ChatContainerRootProps = {
  children: JSX.Element;
  className?: string;
} & JSX.HTMLAttributes<HTMLDivElement>;

export type ChatContainerContentProps = {
  children: JSX.Element;
  className?: string;
} & JSX.HTMLAttributes<HTMLDivElement>;

export type ChatContainerScrollAnchorProps = {
  className?: string;
  ref?: RefObject<HTMLDivElement>;
} & JSX.HTMLAttributes<HTMLDivElement>;

function ChatContainerRoot({
  children,
  className,
  ...props
}: ChatContainerRootProps) {
  return (
    <div
      class={cn('flex overflow-y-auto [overflow-anchor:none]', className)}
      role="log"
      {...props}
    >
      {children}
    </div>
  );
}

function ChatContainerContent({
  children,
  className,
  ...props
}: ChatContainerContentProps) {
  return (
    <div
      class={cn('flex w-full flex-col *:[overflow-anchor:none]', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function ChatContainerScrollAnchor({
  className,
  ...props
}: ChatContainerScrollAnchorProps) {
  return (
    <div
      className={cn('h-px w-full shrink-0 scroll-mt-4', className)}
      style={{ 'overflow-anchor': 'auto' }}
      aria-hidden="true"
      {...props}
    />
  );
}

export { ChatContainerRoot, ChatContainerContent, ChatContainerScrollAnchor };
