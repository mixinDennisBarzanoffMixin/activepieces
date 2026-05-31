import { cn } from '@/lib/utils';

function Table({ className, ...props }: JSX.IntrinsicElements['table']) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-auto">
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: JSX.IntrinsicElements['thead']) {
  return (
    <thead
      data-slot="table-header"
      className={cn('border-t bg-muted/70 [&_tr]:border-b', className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: JSX.IntrinsicElements['tbody']) {
  return <tbody data-slot="table-body" className={cn(className)} {...props} />;
}

function TableFooter({ className, ...props }: JSX.IntrinsicElements['tfoot']) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: JSX.IntrinsicElements['tr']) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: JSX.IntrinsicElements['th']) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'py-2.5 px-2 text-left align-middle text-xs font-medium text-foreground first:pl-8 last:pr-8 [&:has([role=checkbox])]:pl-4 [&:has([role=checkbox])]:pr-2',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: JSX.IntrinsicElements['td']) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'px-2 py-2 align-middle first:pl-8 last:pr-8 [&:has([role=checkbox])]:pl-4 [&:has([role=checkbox])]:pr-2 [&:has([role=checkbox])]:py-2',
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: JSX.IntrinsicElements['caption']) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
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
