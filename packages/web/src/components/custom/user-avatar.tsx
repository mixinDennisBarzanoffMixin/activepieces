import { isNil } from '@activepieces/shared';
import { Show, mergeProps } from 'solid-js';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type UserAvatarProps = {
  name: string;
  email: string;
  size: number;
  disableTooltip?: boolean;
  imageUrl?: string | null;
  className?: string;
  withoutBorder?: boolean;
};

export function UserAvatar(_props: UserAvatarProps) {
  const props = mergeProps(
    { disableTooltip: false, withoutBorder: false },
    _props,
  );
  const fallback = () =>
    props.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const avatarElement = () => (
    <Avatar
      class={cn('rounded-full', props.className)}
      style={{
        width: `${props.size}px !important`,
        height: `${props.size}px !important`,
      }}
    >
      <Show when={!isNil(props.imageUrl)}>
        <AvatarImage src={props.imageUrl} alt={props.name} />
      </Show>
      <AvatarFallback>{fallback()}</AvatarFallback>
    </Avatar>
  );

  return (
    <Show when={!props.disableTooltip} fallback={avatarElement()}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            class={cn('size-12 border', {
              'border-none': props.withoutBorder,
            })}
          >
            {avatarElement()}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {`${props.name} (${props.email})`}
        </TooltipContent>
      </Tooltip>
    </Show>
  );
}
