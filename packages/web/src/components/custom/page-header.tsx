import { mergeProps, Show, type JSX } from 'solid-js';

import { ApSidebarToggle } from '@/components/custom/ap-sidebar-toggle';
import { useEmbedding } from '@/components/providers/embed-provider';
import { cn } from '@/lib/utils';

export const PageHeader = (_props: PageHeaderProps) => {
  const props = mergeProps({ showSidebarToggle: false, className: '' }, _props);
  const embed = useEmbedding();

  return (
    <Show when={!embed.embedState.hidePageHeader}>
      <div
        class={cn(
          'sticky top-0 z-30 flex items-center justify-between py-3 px-4 w-full bg-background',
          props.className,
        )}
      >
        <div class="flex items-center gap-1 grow">
          <Show when={props.showSidebarToggle}>
            <ApSidebarToggle />
          </Show>
          <div class="grow">
            <Show when={typeof props.title === 'string'} fallback={props.title}>
              <h1 class="text-base font-semibold">{props.title}</h1>
            </Show>
            <Show when={props.description}>
              <span class="text-sm text-muted-foreground">
                {props.description}
              </span>
            </Show>
          </div>
          {props.leftContent}
        </div>
        {props.rightContent}
      </div>
    </Show>
  );
};

interface PageHeaderProps {
  title: JSX.Element;
  description?: JSX.Element;
  leftContent?: JSX.Element;
  rightContent?: JSX.Element;
  showSidebarToggle?: boolean;
  className?: string;
}
