import { useLocation } from '@solidjs/router';
import { ChevronRightIcon } from 'lucide-solid';
import { Component, Show, For } from 'solid-js';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar-shadcn';

import { ApSidebarItem, SidebarItemType } from './ap-sidebar-item';

export type SidebarGeneralItemType = SidebarItemType | SidebarGroupType;

export type SidebarGroupType = {
  name?: string;
  label: string;
  icon?: Component<any>;
  items: SidebarItemType[];
  type: 'group';
  open: boolean;
  setOpen: (open: boolean) => void;
  isActive?: (pathname: string) => boolean;
};

export function ApSidebareGroup(item: SidebarGroupType) {
  const location = useLocation();
  const iconRef = undefined;
  const [isHovered, setIsHovered] = createSignal(false);

  createEffect(() => {
    if (isHovered()) {
      iconRef?.startAnimation?.();
    } else {
      iconRef?.stopAnimation?.();
    }
  });

  return (
    <Collapsible
      defaultOpen={item.isActive?.(location.pathname)}
      class="group/collapsible"
      onOpenChange={(open) => item.setOpen(open)}
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            class="px-2 mb-1 py-5"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {item.icon && renderIcon(item.icon, iconRef)}
            <span>{item.label}</span>
            <ChevronRightIcon
              class={`${item.open && 'rotate-90'} ml-auto duration-150`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {
              <For each={item.items}>
                {(link, index) => (
                  <Show when={link.show}>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton asChild>
                        <ApSidebarItem
                          href={link.to}
                          label={link.label}
                          icon={link.icon}
                          notification={link.notification}
                          locked={link.locked}
                          isActive={link.isActive}
                          type={link.type}
                        />
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                  </Show>
                )}
              </For>
            }
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function renderIcon(Icon: Component<any>, ref: any) {
  return <Icon class={'size-4 pointer-events-none'} ref={(el) => (ref = el)} />;
}

type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};
