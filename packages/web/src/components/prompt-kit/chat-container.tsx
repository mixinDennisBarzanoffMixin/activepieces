import { JSX, splitProps, type Ref } from 'solid-js';

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
  ref?: Ref<HTMLDivElement>;
} & JSX.HTMLAttributes<HTMLDivElement>;

function ChatContainerRoot(_props: ChatContainerRootProps) {
  const [local, props] = splitProps(_props, ['children', 'className']);
  return (
    <div
      class={cn('flex overflow-y-auto [overflow-anchor:none]', local.className)}
      role="log"
      {...props}
    >
      {local.children}
    </div>
  );
}

function ChatContainerContent(_props: ChatContainerContentProps) {
  const [local, props] = splitProps(_props, ['children', 'className']);
  return (
    <div
      class={cn(
        'flex w-full flex-col *:[overflow-anchor:none]',
        local.className,
      )}
      {...props}
    >
      {local.children}
    </div>
  );
}

function ChatContainerScrollAnchor(_props: ChatContainerScrollAnchorProps) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <div
      class={cn('h-px w-full shrink-0 scroll-mt-4', local.className)}
      style={{ 'overflow-anchor': 'auto' }}
      aria-hidden="true"
      {...props}
    />
  );
}

export { ChatContainerRoot, ChatContainerContent, ChatContainerScrollAnchor };
