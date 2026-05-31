import { ApSidebarToggle } from '@/components/custom/ap-sidebar-toggle';
import { useEmbedding } from '@/components/providers/embed-provider';
import { cn } from '@/lib/utils';

export const PageHeader = ({
  title,
  description,
  leftContent,
  rightContent,
  showSidebarToggle = false,
  className = '',
}: PageHeaderProps) => {
  const { embedState } = useEmbedding();

  if (embedState.hidePageHeader) {
    return null;
  }

  return (
    <div
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between py-3 px-4 w-full bg-background',
        className,
      )}
    >
      <div className="flex items-center gap-1 grow">
        <Show when={showSidebarToggle}>
          <ApSidebarToggle />
        </Show>
        <div className="grow">
          <Show when={typeof title === 'string'} fallback={title}>
            <h1 className="text-base font-semibold">{title}</h1>
          </Show>
          <Show when={description}>
            <span className="text-sm text-muted-foreground">{description}</span>
          </Show>
        </div>
        {leftContent}
      </div>
      {rightContent}
    </div>
  );
};

interface PageHeaderProps {
  title: any;
  description?: any;
  leftContent?: any;
  rightContent?: any;
  showSidebarToggle?: boolean;
  className?: string;
}
