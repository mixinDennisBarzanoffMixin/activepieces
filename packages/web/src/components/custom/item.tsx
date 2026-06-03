import { cva, type VariantProps } from 'class-variance-authority';
import { mergeProps, splitProps, type JSX } from 'solid-js';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

function ItemGroup(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <div
      role="list"
      data-slot="item-group"
      class={cn('group/item-group flex flex-col', local.className)}
      {...props}
    />
  );
}

function ItemSeparator(
  _props: ClassName<JSX.ComponentProps<typeof Separator>>,
) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      class={cn('my-0', local.className)}
      {...props}
    />
  );
}

const itemVariants = cva(
  'group/item flex items-center border border-transparent text-sm rounded-md transition-colors [a]:hover:bg-accent/50 [a]:transition-colors duration-100 flex-wrap outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border-border',
        muted: 'bg-muted/50',
      },
      size: {
        default: 'p-4 gap-4 ',
        sm: 'py-3 px-4 gap-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Item(
  _props: ClassName<JSX.IntrinsicElements['div']> &
    VariantProps<typeof itemVariants> & { asChild?: boolean },
) {
  const merged = mergeProps(
    { variant: 'default', size: 'default', asChild: false },
    _props,
  );
  const [local, props] = splitProps(merged, [
    'className',
    'variant',
    'size',
    'asChild',
  ]);
  return (
    <div
      data-slot="item"
      data-variant={local.variant}
      data-size={local.size}
      class={cn(
        itemVariants({ variant: local.variant, size: local.size }),
        local.className,
      )}
      {...props}
    />
  );
}

const itemMediaVariants = cva(
  'flex shrink-0 items-center justify-center gap-2  ',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "size-10 border rounded-sm bg-muted [&_svg:not([class*='size-'])]:size-5",
        image:
          'size-10 rounded-sm overflow-hidden [&_img]:size-full [&_img]:object-cover',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function ItemMedia(
  _props: ClassName<JSX.IntrinsicElements['div']> &
    VariantProps<typeof itemMediaVariants>,
) {
  const merged = mergeProps({ variant: 'default' }, _props);
  const [local, props] = splitProps(merged, ['className', 'variant']);
  return (
    <div
      data-slot="item-media"
      data-variant={local.variant}
      class={cn(itemMediaVariants({ variant: local.variant }), local.className)}
      {...props}
    />
  );
}

function ItemContent(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="item-content"
      class={cn(
        'flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none',
        local.className,
      )}
      {...props}
    />
  );
}

function ItemTitle(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="item-title"
      class={cn(
        'flex w-fit items-center gap-2 text-sm leading-snug font-medium',
        local.className,
      )}
      {...props}
    />
  );
}

function ItemDescription(_props: ClassName<JSX.IntrinsicElements['p']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <p
      data-slot="item-description"
      class={cn(
        'text-muted-foreground line-clamp-2 text-sm leading-normal font-normal text-balance',
        '[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4',
        local.className,
      )}
      {...props}
    />
  );
}

function ItemActions(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="item-actions"
      class={cn('flex items-center gap-2', local.className)}
      {...props}
    />
  );
}

function ItemHeader(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="item-header"
      class={cn(
        'flex basis-full items-center justify-between gap-2',
        local.className,
      )}
      {...props}
    />
  );
}

function ItemFooter(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="item-footer"
      class={cn(
        'flex basis-full items-center justify-between gap-2',
        local.className,
      )}
      {...props}
    />
  );
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
};

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
};
