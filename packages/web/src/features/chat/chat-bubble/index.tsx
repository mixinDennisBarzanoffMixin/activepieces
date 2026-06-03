import { cva, type VariantProps } from 'class-variance-authority';
import { JSX, mergeProps, splitProps, Show } from 'solid-js';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import MessageLoading from './message-loading';

// ChatBubble
const chatBubbleVariant = cva('flex gap-2 w-full items-start relative group', {
  variants: {
    variant: {
      received: 'self-start',
      sent: 'self-end flex-row-reverse',
    },
    layout: {
      default: '',
      ai: 'max-w-full w-full items-center',
    },
  },
  defaultVariants: {
    variant: 'received',
    layout: 'default',
  },
});

interface ChatBubbleProps
  extends JSX.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleVariant> {
  class?: string;
}

function ChatBubble(props: ChatBubbleProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'variant',
    'layout',
    'children',
    'ref',
  ]);
  return (
    <div
      class={cn(
        chatBubbleVariant({ variant: local.variant, layout: local.layout }),
        'relative group',
        local.class,
      )}
      ref={local.ref}
      {...rest}
    >
      {local.children}
    </div>
  );
}

// ChatBubbleAvatar
interface ChatBubbleAvatarProps {
  src?: string;
  fallback?: JSX.Element;
  className?: string;
}

const ChatBubbleAvatar = (props: ChatBubbleAvatarProps) => (
  <Avatar>
    <AvatarImage
      src={props.src}
      alt="Avatar"
      class={cn('aspect-square p-2', props.className)}
    />
    <AvatarFallback class="bg-background border">
      {props.fallback}
    </AvatarFallback>
  </Avatar>
);

// ChatBubbleMessage
const chatBubbleMessageVariants = cva('px-1', {
  variants: {
    variant: {
      received: 'bg-background text-foreground rounded-3xl py-2',
      sent: 'bg-accent text-accent-foreground rounded-3xl py-3 px-5',
    },
    layout: {
      default: '',
      ai: 'border-t w-full rounded-none bg-transparent',
    },
  },
  defaultVariants: {
    variant: 'received',
    layout: 'default',
  },
});

interface ChatBubbleMessageProps
  extends JSX.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleMessageVariants> {
  isLoading?: boolean;
  class?: string;
}

function ChatBubbleMessage(props: ChatBubbleMessageProps) {
  const merged = mergeProps({ isLoading: false }, props);
  const [local, rest] = splitProps(merged, [
    'class',
    'variant',
    'layout',
    'isLoading',
    'children',
    'ref',
  ]);
  return (
    <div
      class={cn(
        chatBubbleMessageVariants({
          variant: local.variant,
          layout: local.layout,
        }),
        'wrap-break-word max-w-full whitespace-pre-wrap overflow-x-auto',
        local.class,
      )}
      ref={local.ref}
      {...rest}
    >
      <Show when={local.isLoading} fallback={local.children}>
        <div class="flex items-center space-x-2">
          <MessageLoading />
        </div>
      </Show>
    </div>
  );
}

// ChatBubbleAction
type ChatBubbleActionProps = ButtonProps & {
  icon: JSX.Element;
};

const ChatBubbleAction = (_props: ChatBubbleActionProps) => {
  const merged = mergeProps({ variant: 'ghost', size: 'icon' }, _props);
  const [local, rest] = splitProps(merged, [
    'icon',
    'onClick',
    'className',
    'variant',
    'size',
  ]);
  return (
    <Button
      variant={local.variant}
      size={local.size}
      class={local.className}
      onClick={local.onClick}
      {...rest}
    >
      {local.icon}
    </Button>
  );
};
export {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  chatBubbleVariant,
  chatBubbleMessageVariants,
  ChatBubbleAction,
};
