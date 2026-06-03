import { cva, type VariantProps } from 'class-variance-authority';
import { mergeProps, splitProps, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

function Empty(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="empty"
      class={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-4 text-center text-balance md:p-8',
        local.className,
      )}
      {...props}
    />
  );
}

function EmptyHeader(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="empty-header"
      class={cn(
        'flex max-w-sm flex-col items-center gap-2 text-center',
        local.className,
      )}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  'flex shrink-0 items-center justify-center mb-2 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function EmptyMedia(
  _props: ClassName<JSX.IntrinsicElements['div']> &
    VariantProps<typeof emptyMediaVariants>,
) {
  const merged = mergeProps({ variant: 'default' }, _props);
  const [local, props] = splitProps(merged, ['className', 'variant']);
  return (
    <div
      data-slot="empty-icon"
      data-variant={local.variant}
      class={cn(
        emptyMediaVariants({ variant: local.variant }),
        local.className,
      )}
      {...props}
    />
  );
}

function EmptyTitle(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="empty-title"
      class={cn('text-lg font-medium tracking-tight', local.className)}
      {...props}
    />
  );
}

function EmptyDescription(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="empty-description"
      class={cn(
        'text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4',
        local.className,
      )}
      {...props}
    />
  );
}

function EmptyContent(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="empty-content"
      class={cn(
        'flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance',
        local.className,
      )}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
};

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
};
