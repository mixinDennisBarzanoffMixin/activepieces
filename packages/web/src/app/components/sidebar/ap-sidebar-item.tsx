import { useLocation } from '@solidjs/router';
import { LockKeyhole } from 'lucide-solid';
import { Component, Show } from 'solid-js';

import { Dot } from '@/components/custom/dot';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { cn } from '@/lib/utils';

export type SidebarItemType = {
  to: string;
  label: string;
  type: 'link';
  icon?: Component<any>;
  notification?: boolean;
  locked?: boolean;
  newWindow?: boolean;
  isActive?: (pathname: string) => boolean;
  isSubItem?: boolean;
  show?: boolean;
  hasPermission?: boolean;
  onClick?: () => void;
  badge?: string;
  iconClassName?: string;
  highlight?: boolean;
};

export const ApSidebarItem = (item: SidebarItemType) => {
  const location = useLocation();
  const { state } = useSidebar();
  const iconRef = undefined;
  const [isHovered, setIsHovered] = createSignal(false);
  const isLinkActive =
    location.pathname.startsWith(item.to) || item.isActive?.(location.pathname);
  const isCollapsed = state === 'collapsed';

  createEffect(() => {
    if (isHovered()) {
      iconRef?.startAnimation?.();
    } else {
      iconRef?.stopAnimation?.();
    }
  });

  const button = (
    <SidebarMenuButton
      class={cn(
        { 'bg-sidebar-accent hover:bg-sidebar-accent!': isLinkActive },
        item.highlight && !isLinkActive && 'hover:bg-sidebar-accent/60',
      )}
      onClick={() => {
        item.onClick?.();
        window.location.href = item.to;
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {item.icon && renderIcon(item.icon, iconRef, item.iconClassName)}
      {
        <Show when={!isCollapsed}>
          <span className={cn('text-sm', { 'font-semibold': isLinkActive })}>
            {item.label}
          </span>
        </Show>
      }
      {
        <Show when={!isCollapsed && item.badge}>
          <span className="ml-auto text-[10px] font-medium text-primary">
            {item.badge}
          </span>
        </Show>
      }
      {
        <Show when={!isCollapsed && item.locked && !item.badge}>
          <LockKeyhole class="size-3.5! ml-auto" />
        </Show>
      }
      {
        <Show when={item.notification && !item.locked}>
          <Dot
            variant="destructive"
            class="absolute right-1 top-2 transform -translate-y-1/2 size-2 rounded-full"
          />
        </Show>
      }
    </SidebarMenuButton>
  );

  return <SidebarMenuItem>{button}</SidebarMenuItem>;
};

function renderIcon(Icon: Component<any>, ref: any, iconClassName?: string) {
  return (
    <Icon
      class={cn('size-4 pointer-events-none', iconClassName)}
      ref={(el) => (ref = el)}
    />
  );
}

type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};
