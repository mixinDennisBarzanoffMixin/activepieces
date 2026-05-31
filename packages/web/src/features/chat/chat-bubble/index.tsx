import { cva, type VariantProps } from 'class-variance-authority';
import { JSX } from 'solid-js';

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
    VariantProps<typeof chatBubbleVariant> {}

function ChatBubble(props: ChatBubbleProps) {
  const { className, variant, layout, children, ref, ...rest } = props;
  return (
    <div
      className={cn(
        chatBubbleVariant({ variant, layout, className }),
        'relative group',
      )}
      ref={ref}
      {...rest}
    >
      {children}
    </div>
  );
}
ChatBubble.displayName = 'ChatBubble';

// ChatBubbleAvatar
interface ChatBubbleAvatarProps {
  src?: string;
  fallback?: any;
  className?: string;
}

const ChatBubbleAvatar = ({ src, fallback, className }) => (
  <Avatar>
    <AvatarImage
      src={src}
      alt="Avatar"
      class={cn('aspect-square p-2', className)}
    />
    <AvatarFallback class="bg-background border">{fallback}</AvatarFallback>
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
}

function ChatBubbleMessage(props: ChatBubbleMessageProps) {
  const { className, variant, layout, isLoading = false, children, ref, ...rest } = props;
  return (
    <div
      className={cn(
        chatBubbleMessageVariants({ variant, layout, className }),
        'wrap-break-word max-w-full whitespace-pre-wrap overflow-x-auto',
      )}
      ref={ref}
      {...rest}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <MessageLoading />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
ChatBubbleMessage.displayName = 'ChatBubbleMessage';

// ChatBubbleAction
type ChatBubbleActionProps = ButtonProps & {
  icon: any;
};

const ChatBubbleAction = ({
  icon,
  onClick,
  className,
  variant = 'ghost',
  size = 'icon',
  ...props
}) => (
  <Button
    variant={variant}
    size={size}
    class={className}
    onClick={onClick}
    {...props}
  >
    {icon}
  </Button>
);

export {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  chatBubbleVariant,
  chatBubbleMessageVariants,
  ChatBubbleAction,
};
