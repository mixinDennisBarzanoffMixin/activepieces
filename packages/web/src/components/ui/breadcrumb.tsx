import { ChevronRight, MoreHorizontal } from 'lucide-solid';
import { splitProps, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

function Breadcrumb(_props: JSX.IntrinsicElements['nav']) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {..._props} />;
}

function BreadcrumbList(_props: ClassName<JSX.IntrinsicElements['ol']>) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <ol
      data-slot="breadcrumb-list"
      class={cn(
        'flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2.5',
        local.className,
      )}
      {...rest}
    />
  );
}

function BreadcrumbItem(_props: ClassName<JSX.IntrinsicElements['li']>) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <li
      data-slot="breadcrumb-item"
      class={cn('inline-flex items-center gap-1.5', local.className)}
      {...rest}
    />
  );
}

function BreadcrumbLink(_props: BreadcrumbLinkProps) {
  const [local, rest] = splitProps(_props, ['className']);

  return (
    <a
      data-slot="breadcrumb-link"
      class={cn('transition-colors hover:text-foreground', local.className)}
      {...rest}
    />
  );
}

function BreadcrumbPage(_props: ClassName<JSX.IntrinsicElements['span']>) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      class={cn('font-normal text-foreground', local.className)}
      {...rest}
    />
  );
}

function BreadcrumbSeparator(_props: ClassName<JSX.IntrinsicElements['li']>) {
  const [local, rest] = splitProps(_props, ['children', 'className']);
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      class={cn('[&>svg]:size-3.5', local.className)}
      {...rest}
    >
      {local.children ?? <ChevronRight />}
    </li>
  );
}

function BreadcrumbEllipsis(_props: ClassName<JSX.IntrinsicElements['span']>) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      class={cn('flex size-9 items-center justify-center', local.className)}
      {...rest}
    >
      <MoreHorizontal class="size-4" />
      <span class="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
};

type BreadcrumbLinkProps = ClassName<JSX.IntrinsicElements['a']> & {
  asChild?: boolean;
};
