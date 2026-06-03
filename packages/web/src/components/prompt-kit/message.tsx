import {
  JSX,
  mergeProps,
  splitProps,
  type ComponentProps,
  Show,
} from 'solid-js';

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

const Message = (_props: MessageProps) => {
  const [local, props] = splitProps(_props, ['children', 'className']);
  return (
    <div class={cn('flex gap-3', local.className)} {...props}>
      {local.children}
    </div>
  );
};
export type MessageAvatarProps = {
  src: string;
  alt: string;
  fallback?: string;
  delayMs?: number;
  className?: string;
};

const MessageAvatar = (props: MessageAvatarProps) => {
  return (
    <Avatar class={cn('h-8 w-8 shrink-0', props.className)}>
      <AvatarImage src={props.src} alt={props.alt} />
      <Show when={props.fallback}>
        <AvatarFallback delayMs={props.delayMs}>
          {props.fallback}
        </AvatarFallback>
      </Show>
    </Avatar>
  );
};

export type MessageContentProps = {
  children: JSX.Element;
  markdown?: boolean;
  className?: string;
} & ComponentProps<typeof Markdown> &
  Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children'>;

const MessageContent = (_props: MessageContentProps) => {
  const [local, props] = splitProps(mergeProps({ markdown: false }, _props), [
    'children',
    'markdown',
    'className',
  ]);
  const classNames = cn(
    'rounded-lg p-2 text-foreground prose break-words whitespace-normal',
    local.className,
  );

  return (
    <>
      <Show
        when={local.markdown}
        fallback={
          <div class={classNames} {...props}>
            {local.children}
          </div>
        }
      >
        <Markdown class={classNames} {...props}>
          {local.children as string}
        </Markdown>
      </Show>
    </>
  );
};

export type MessageActionsProps = {
  children: JSX.Element;
  className?: string;
} & JSX.HTMLAttributes<HTMLDivElement>;

const MessageActions = (_props: MessageActionsProps) => {
  const [local, props] = splitProps(_props, ['children', 'className']);
  return (
    <div
      class={cn(
        'text-muted-foreground flex items-center gap-2',
        local.className,
      )}
      {...props}
    >
      {local.children}
    </div>
  );
};
export type MessageActionProps = {
  className?: string;
  tooltip: JSX.Element;
  children: JSX.Element;
  side?: 'top' | 'bottom' | 'left' | 'right';
} & ComponentProps<typeof Tooltip>;

const MessageAction = (_props: MessageActionProps) => {
  const [local, props] = splitProps(mergeProps({ side: 'top' }, _props), [
    'tooltip',
    'children',
    'className',
    'side',
  ]);
  return (
    <TooltipProvider>
      <Tooltip {...props}>
        <TooltipTrigger asChild>{local.children}</TooltipTrigger>
        <TooltipContent side={local.side} class={local.className}>
          {local.tooltip}
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
