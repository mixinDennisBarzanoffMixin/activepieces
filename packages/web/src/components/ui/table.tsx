import { splitProps, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

function Table(props: TableProps<'table'>) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <div data-slot="table-container" class="relative w-full overflow-auto">
      <table
        data-slot="table"
        class={cn(
          'w-full caption-bottom text-sm',
          local.class,
          local.className,
        )}
        {...rest}
      />
    </div>
  );
}

function TableHeader(props: TableProps<'thead'>) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <thead
      data-slot="table-header"
      class={cn(
        'border-t bg-muted/70 [&_tr]:border-b',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function TableBody(props: TableProps<'tbody'>) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <tbody
      data-slot="table-body"
      class={cn(local.class, local.className)}
      {...rest}
    />
  );
}

function TableFooter(props: TableProps<'tfoot'>) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <tfoot
      data-slot="table-footer"
      class={cn(
        'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function TableRow(props: TableProps<'tr'>) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <tr
      data-slot="table-row"
      class={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function TableHead(props: TableProps<'th'>) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <th
      data-slot="table-head"
      class={cn(
        'py-2.5 px-2 text-left align-middle text-xs font-medium text-foreground first:pl-8 last:pr-8 [&:has([role=checkbox])]:pl-4 [&:has([role=checkbox])]:pr-2',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function TableCell(props: TableProps<'td'>) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <td
      data-slot="table-cell"
      class={cn(
        'px-2 py-2 align-middle first:pl-8 last:pr-8 [&:has([role=checkbox])]:pl-4 [&:has([role=checkbox])]:pr-2 [&:has([role=checkbox])]:py-2',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function TableCaption(props: TableProps<'caption'>) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <caption
      data-slot="table-caption"
      class={cn(
        'mt-4 text-sm text-muted-foreground',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};

type TableProps<T extends keyof JSX.IntrinsicElements> =
  JSX.IntrinsicElements[T] & {
    className?: string;
  };
