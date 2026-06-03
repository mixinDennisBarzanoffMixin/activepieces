import * as AvatarPrimitive from '@kobalte/core/image';
import {
  mergeProps,
  splitProps,
  type ComponentProps,
  type JSX,
} from 'solid-js';

import { cn } from '@/lib/utils';

function Avatar(_props: AvatarProps) {
  const [local, rest] = splitProps(mergeProps({ size: 'default' }, _props), [
    'className',
    'size',
  ]);
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={local.size}
      class={cn(
        'group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none data-[size=lg]:size-10 data-[size=sm]:size-6',
        local.className,
      )}
      {...rest}
    />
  );
}

function AvatarImage(
  _props: ClassName<ComponentProps<typeof AvatarPrimitive.Image>>,
) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      class={cn('aspect-square size-full', local.className)}
      {...rest}
    />
  );
}

function AvatarFallback(
  _props: ClassName<ComponentProps<typeof AvatarPrimitive.Fallback>>,
) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      class={cn(
        'flex size-full items-center justify-center rounded-full border-none bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs',
        local.className,
      )}
      {...rest}
    />
  );
}

function AvatarBadge(_props: ClassName<JSX.IntrinsicElements['span']>) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <span
      data-slot="avatar-badge"
      class={cn(
        'absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background select-none',
        'group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden',
        'group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2',
        'group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2',
        local.className,
      )}
      {...rest}
    />
  );
}

function AvatarGroup(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="avatar-group"
      class={cn(
        'group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background',
        local.className,
      )}
      {...rest}
    />
  );
}

function AvatarGroupCount(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="avatar-group-count"
      class={cn(
        'relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3',
        local.className,
      )}
      {...rest}
    />
  );
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
};

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
};

type AvatarProps = ClassName<ComponentProps<typeof AvatarPrimitive.Root>> & {
  size?: 'default' | 'sm' | 'lg';
};
