import { JSX } from 'solid-js';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { Markdown } from './markdown';

export type MessageProps = {
  children: JSX.Element;
  className?: string;
} & JSX.HTMLAttributes<HTMLDivElement>;

const Message = ({ children, className, ...props }: MessageProps) => (
  <div className={cn('flex gap-3', className)} {...props}>
    {children}
  </div>
);

export type MessageAvatarProps = {
  src: string;
  alt: string;
  fallback?: string;
  delayMs?: number;
  className?: string;
};

const MessageAvatar = ({
  src,
  alt,
  fallback,
  delayMs,
  className,
}: MessageAvatarProps) => {
  return (
    <Avatar class={cn('h-8 w-8 shrink-0', className)}>
      <AvatarImage src={src} alt={alt} />
      {fallback && (
        <AvatarFallback delayMs={delayMs}>{fallback}</AvatarFallback>
      )}
    </Avatar>
  );
};

export type MessageContentProps = {
  children: JSX.Element;
  markdown?: boolean;
  className?: string;
} & ComponentProps<typeof Markdown> &
  JSX.HTMLAttributes<HTMLDivElement>;

const MessageContent = ({
  children,
  markdown = false,
  className,
  ...props
}: MessageContentProps) => {
  const classNames = cn(
    'rounded-lg p-2 text-foreground prose break-words whitespace-normal',
    className,
  );

  return markdown ? (
    <Markdown class={classNames} {...props}>
      {children as string}
    </Markdown>
  ) : (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};

export type MessageActionsProps = {
  children: JSX.Element;
  className?: string;
} & JSX.HTMLAttributes<HTMLDivElement>;

const MessageActions = ({
  children,
  className,
  ...props
}: MessageActionsProps) => (
  <div
    className={cn('text-muted-foreground flex items-center gap-2', className)}
    {...props}
  >
    {children}
  </div>
);

export type MessageActionProps = {
  className?: string;
  tooltip: JSX.Element;
  children: JSX.Element;
  side?: 'top' | 'bottom' | 'left' | 'right';
} & ComponentProps<typeof Tooltip>;

const MessageAction = ({
  tooltip,
  children,
  className,
  side = 'top',
  ...props
}: MessageActionProps) => {
  return (
    <TooltipProvider>
      <Tooltip {...props}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} class={className}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export {
  Message,
  MessageAvatar,
  MessageContent,
  MessageActions,
  MessageAction,
};
