import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

type DataTableToolbarProps = {
  children?: any;
};

const DataTableToolbar = (params: DataTableToolbarProps) => {
  return (
    <div
      class={cn(
        'flex items-center justify-between py-3 overflow-auto',
        DASHBOARD_CONTENT_PADDING_X,
      )}
    >
      <div class="flex flex-1 items-center space-x-2">{params.children}</div>
    </div>
  );
};

export { DataTableToolbar };
