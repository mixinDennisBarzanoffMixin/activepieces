import { useLocation } from '@solidjs/router';
import { ChevronRightIcon } from 'lucide-solid';
import { Component, createEffect, createSignal, Show, For } from 'solid-js';

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
  icon?: Component<IconProps>;
  items: SidebarItemType[];
  type: 'group';
  open: boolean;
  setOpen: (open: boolean) => void;
  isActive?: (pathname: string) => boolean;
};

export function ApSidebareGroup(item: SidebarGroupType) {
  const location = useLocation();
  let iconRef: AnimatedIconHandle | undefined;
  const [isHovered, setIsHovered] = createSignal(false);

  createEffect(() => {
    if (isHovered()) {
      iconRef?.startAnimation();
    } else {
      iconRef?.stopAnimation();
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
            {item.icon &&
              renderIcon(item.icon, (handle) => {
                iconRef = handle;
              })}
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
                {(link) => (
                  <Show when={link.show}>
                    <SidebarMenuSubItem>
                      <ApSidebarItem
                        to={link.to}
                        label={link.label}
                        icon={link.icon}
                        notification={link.notification}
                        locked={link.locked}
                        isActive={link.isActive}
                        type={link.type}
                      />
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

function renderIcon(
  Icon: Component<IconProps>,
  setRef: (handle: AnimatedIconHandle) => void,
) {
  return <Icon class="size-4 pointer-events-none" ref={setRef} />;
}

type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

type IconProps = {
  class?: string;
  ref?: (handle: AnimatedIconHandle) => void;
};
