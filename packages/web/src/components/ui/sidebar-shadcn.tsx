import { cva, type VariantProps } from 'class-variance-authority';
import {
  Show,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  splitProps,
  untrack,
  useContext,
  type ComponentProps,
  type JSX,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { PanelLeftCloseIcon } from '@/components/icons/panel-left-close';
import { PanelLeftOpenIcon } from '@/components/icons/panel-left-open';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Slot } from '@/components/ui/slot';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '14.375rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

const SidebarContext = createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

function SidebarProvider(props: SidebarProviderProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'style',
    'children',
    'defaultOpen',
    'open',
    'onOpenChange',
    'hoverMode',
  ]);
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = createSignal(false);
  const [isHovered, setIsHovered] = createSignal(false);
  const [keepElevatedZIndex, setKeepElevatedZIndex] = createSignal(false);
  const defaultOpen = () => local.defaultOpen ?? true;
  const hoverMode = () => local.hoverMode ?? false;

  const [_open, _setOpen] = createSignal(
    untrack(() => {
      if (hoverMode()) {
        return defaultOpen();
      }
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(SIDEBAR_COOKIE_NAME);
        if (stored !== null) {
          return stored === 'true';
        }
      }
      return defaultOpen();
    }),
  );
  const persistedOpen = () => local.open ?? _open();

  const isHoverExpanded = () => hoverMode() && !persistedOpen() && isHovered();
  const open = () => persistedOpen() || isHoverExpanded();
  const shouldElevateZIndex = () => isHoverExpanded() || keepElevatedZIndex();

  const setOpen = (value: boolean | ((value: boolean) => boolean)) => {
    const openState =
      typeof value === 'function' ? value(persistedOpen()) : value;
    if (local.onOpenChange) {
      local.onOpenChange(openState);
    } else {
      _setOpen(openState);
    }

    if (!hoverMode()) {
      localStorage.setItem(SIDEBAR_COOKIE_NAME, String(openState));
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    }
  };

  let hoverTimeoutRef: ReturnType<typeof setTimeout> | undefined;
  let zIndexTimeoutRef: ReturnType<typeof setTimeout> | undefined;

  const setHovered = (hovered: boolean) => {
    if (hoverTimeoutRef) {
      clearTimeout(hoverTimeoutRef);
      hoverTimeoutRef = undefined;
    }
    if (zIndexTimeoutRef) {
      clearTimeout(zIndexTimeoutRef);
      zIndexTimeoutRef = undefined;
    }

    if (hovered) {
      setIsHovered(true);
      setKeepElevatedZIndex(false);
    } else {
      setIsHovered(false);
      setKeepElevatedZIndex(true);
      zIndexTimeoutRef = setTimeout(() => {
        setKeepElevatedZIndex(false);
      }, 200);
    }
  };

  createEffect(() => {
    return () => {
      if (hoverTimeoutRef) {
        clearTimeout(hoverTimeoutRef);
      }
      if (zIndexTimeoutRef) {
        clearTimeout(zIndexTimeoutRef);
      }
    };
  });

  const toggleSidebar = () => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  };

  createEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
  });

  const state = () => (open() ? 'expanded' : 'collapsed');

  const contextValue = createMemo<SidebarContextProps>(() => ({
    state: state(),
    open: open(),
    setOpen,
    isMobile,
    openMobile,
    setOpenMobile,
    toggleSidebar,
    hoverMode: hoverMode(),
    isHoverExpanded: isHoverExpanded(),
    shouldElevateZIndex: shouldElevateZIndex(),
    setHovered,
  }));

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH,
              '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
              ...local.style,
            } as JSX.CSSProperties
          }
          class={cn(
            'group/sidebar-wrapper flex h-svh w-full has-data-[variant=inset]:bg-sidebar',
            local.class,
            local.className,
          )}
          {...rest}
        >
          {local.children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

function Sidebar(props: SidebarProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'children',
    'side',
    'variant',
    'collapsible',
  ]);
  const side = () => local.side ?? 'left';
  const variant = () => local.variant ?? 'sidebar';
  const collapsible = () => local.collapsible ?? 'offcanvas';
  const {
    isMobile,
    state,
    openMobile,
    setOpenMobile,
    setOpen,
    hoverMode,
    isHoverExpanded,
    shouldElevateZIndex,
    setHovered,
  } = useSidebar();

  return (
    <Show
      when={collapsible() === 'none'}
      fallback={
        <Show
          when={isMobile}
          fallback={
            <div
              class="group peer hidden text-sidebar-foreground md:block"
              data-state={state}
              data-collapsible={state === 'collapsed' ? collapsible() : ''}
              data-variant={variant()}
              data-side={side()}
              data-slot="sidebar"
              onMouseEnter={hoverMode ? () => setHovered(true) : undefined}
              onMouseLeave={hoverMode ? () => setHovered(false) : undefined}
            >
              {/* This is what handles the sidebar gap on desktop */}
              <div
                data-slot="sidebar-gap"
                class={cn(
                  'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
                  'group-data-[collapsible=offcanvas]:w-0',
                  'group-data-[side=right]:rotate-180',
                  variant() === 'floating' || variant() === 'inset'
                    ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
                    : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
                  isHoverExpanded &&
                    (variant() === 'floating' || variant() === 'inset'
                      ? 'w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
                      : 'w-(--sidebar-width-icon)'),
                )}
              />
              <div
                data-slot="sidebar-container"
                class={cn(
                  'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex',
                  side() === 'left'
                    ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
                    : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
                  variant() === 'floating' || variant() === 'inset'
                    ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
                    : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
                  !hoverMode && (side() === 'left' ? 'border-r' : 'border-l'),
                  hoverMode &&
                    isHoverExpanded &&
                    (side() === 'left' ? 'border-r' : 'border-l'),
                  !hoverMode &&
                    state === 'collapsed' &&
                    collapsible() === 'icon' &&
                    '[&_*]:!cursor-nesw-resize [&_button]:!cursor-pointer [&_button]:relative [&_button]:z-20 [&_button_*]:!cursor-pointer [&_a]:!cursor-pointer [&_a]:relative [&_a]:z-20 [&_a_*]:!cursor-pointer [&_[role=button]]:!cursor-pointer [&_[role=button]]:relative [&_[role=button]]:z-20 [&_[role=button]_*]:!cursor-pointer [&_[data-sidebar=menu-button]]:!cursor-pointer [&_[data-sidebar=menu-button]]:relative [&_[data-sidebar=menu-button]]:z-20 [&_[data-sidebar=menu-button]_*]:!cursor-pointer cursor-nesw-resize',
                  shouldElevateZIndex && 'z-55',
                  local.class,
                  local.className,
                )}
                {...rest}
              >
                <div
                  data-sidebar="sidebar"
                  data-slot="sidebar-inner"
                  class={cn(
                    'flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow',
                    !hoverMode &&
                      state === 'collapsed' &&
                      collapsible() === 'icon' &&
                      'relative',
                  )}
                >
                  <Show
                    when={
                      !hoverMode &&
                      state === 'collapsed' &&
                      collapsible() === 'icon'
                    }
                  >
                    <div
                      class="absolute inset-0 z-10 !cursor-nesw-resize"
                      onClick={() => setOpen(true)}
                      aria-hidden="true"
                    />
                  </Show>
                  {local.children}
                </div>
              </div>
            </div>
          }
        >
          <Sheet open={openMobile} onOpenChange={setOpenMobile} {...rest}>
            <SheetContent
              data-sidebar="sidebar"
              data-slot="sidebar"
              data-mobile="true"
              class="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
              style={
                {
                  '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
                } as JSX.CSSProperties
              }
              side={side()}
            >
              <SheetHeader class="sr-only">
                <SheetTitle>Sidebar</SheetTitle>
                <SheetDescription>
                  Displays the mobile sidebar.
                </SheetDescription>
              </SheetHeader>
              <div class="flex h-full w-full flex-col">{local.children}</div>
            </SheetContent>
          </Sheet>
        </Show>
      }
    >
      <div
        data-slot="sidebar"
        class={cn(
          'flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground',
          local.class,
          local.className,
        )}
        {...rest}
      >
        {local.children}
      </div>
    </Show>
  );
}

function SidebarTrigger(props: SidebarTriggerProps) {
  const [local, rest] = splitProps(props, ['class', 'className', 'onClick']);
  const { toggleSidebar, open } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      class={cn('size-7', local.class, local.className)}
      onClick={(event) => {
        local.onClick?.(event);
        toggleSidebar();
      }}
      {...rest}
    >
      <Show when={open} fallback={<PanelLeftOpenIcon size={16} />}>
        <PanelLeftCloseIcon size={16} />
      </Show>
      <span class="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SidebarRail(props: SidebarButtonProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      class={cn(
        'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex',
        'in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize',
        '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
        'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar',
        '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
        '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SidebarInset(props: SidebarMainProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <main
      data-slot="sidebar-inset"
      class={cn(
        'relative flex w-full flex-1 flex-col bg-background',
        'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SidebarInput(props: SidebarInputProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      class={cn(
        'h-8 w-full bg-background shadow-none',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SidebarHeader(props: SidebarDivProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      class={cn('flex flex-col gap-2 p-2', local.class, local.className)}
      {...rest}
    />
  );
}

function SidebarFooter(props: SidebarDivProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      class={cn('flex flex-col gap-2 p-2', local.class, local.className)}
      {...rest}
    />
  );
}

function SidebarSeparator(props: SidebarSeparatorProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      class={cn('mx-2 w-auto bg-sidebar-border', local.class, local.className)}
      {...rest}
    />
  );
}

function SidebarContent(props: SidebarDivProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      class={cn(
        'no-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SidebarGroup(props: SidebarDivProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      class={cn(
        'relative flex w-full min-w-0 flex-col p-2',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SidebarGroupLabel(props: SidebarGroupLabelProps) {
  const [local, rest] = splitProps(props, ['class', 'className', 'asChild']);

  return (
    <Dynamic
      component={local.asChild ? Slot.Root : 'div'}
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      class={cn(
        'flex h-7 shrink-0 items-center rounded-md px-2 text-xs font-normal text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        'group-data-[collapsible=icon]:-mt-7 group-data-[collapsible=icon]:opacity-0',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SidebarGroupAction(props: SidebarGroupActionProps) {
  const [local, rest] = splitProps(props, ['class', 'className', 'asChild']);

  return (
    <Dynamic
      component={local.asChild ? Slot.Root : 'button'}
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      class={cn(
        'absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        'after:absolute after:-inset-2 md:after:hidden',
        'group-data-[collapsible=icon]:hidden',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SidebarGroupContent(props: SidebarDivProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      class={cn('w-full text-sm', local.class, local.className)}
      {...rest}
    />
  );
}

function SidebarMenu(props: SidebarUlProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      class={cn(
        'flex w-full min-w-0 flex-col gap-1',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SidebarMenuItem(props: SidebarLiProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      class={cn('group/menu-item relative', local.class, local.className)}
      {...rest}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:font-normal data-active:text-sidebar-accent-foreground data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground group-has-data-[sidebar=menu-action]/menu-item:pr-8   [&>span:last-child]:truncate [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'hover:bg-sidebar-accent active:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        outline:
          'bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]',
      },
      size: {
        default: 'h-7 text-sm',
        sm: 'h-6 text-xs',
        lg: 'h-12 text-sm ',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function SidebarMenuButton(props: SidebarMenuButtonProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'asChild',
    'isActive',
    'variant',
    'size',
    'tooltip',
  ]);
  const { isMobile, state } = useSidebar();
  const size = () => local.size ?? 'default';
  const variant = () => local.variant ?? 'default';
  const active = () => local.isActive ?? false;
  const tooltip = () =>
    typeof local.tooltip === 'string'
      ? { children: local.tooltip }
      : local.tooltip;

  const button = (
    <Dynamic
      component={local.asChild ? Slot.Root : 'button'}
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size()}
      data-active={active()}
      class={cn(
        sidebarMenuButtonVariants({ variant: variant(), size: size() }),
        local.class,
        local.className,
      )}
      {...rest}
    />
  );

  return (
    <Show when={local.tooltip} fallback={button}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== 'collapsed' || isMobile}
          {...tooltip()}
        />
      </Tooltip>
    </Show>
  );
}

function SidebarMenuAction(props: SidebarMenuActionProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'asChild',
    'showOnHover',
  ]);

  return (
    <Dynamic
      component={local.asChild ? Slot.Root : 'button'}
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      class={cn(
        'absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform peer-hover/menu-button:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        'after:absolute after:-inset-2 md:after:hidden',
        'peer-data-[size=sm]/menu-button:top-1',
        'peer-data-[size=default]/menu-button:top-1.5',
        'peer-data-[size=lg]/menu-button:top-2.5',
        'group-data-[collapsible=icon]:hidden',
        local.showOnHover &&
          'peer-data-active/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-open:opacity-100 md:opacity-0',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SidebarMenuBadge(props: SidebarDivProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      class={cn(
        'pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none',
        'peer-hover/menu-button:text-sidebar-accent-foreground peer-data-active/menu-button:text-sidebar-accent-foreground',
        'peer-data-[size=sm]/menu-button:top-1',
        'peer-data-[size=default]/menu-button:top-1.5',
        'peer-data-[size=lg]/menu-button:top-2.5',
        'group-data-[collapsible=icon]:hidden',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SidebarMenuSkeleton(props: SidebarMenuSkeletonProps) {
  const [local, rest] = splitProps(props, ['class', 'className', 'showIcon']);
  const width = createMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  });

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      class={cn(
        'flex h-7 items-center gap-2 rounded-md px-2',
        local.class,
        local.className,
      )}
      {...rest}
    >
      <Show when={local.showIcon}>
        <Skeleton class="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />
      </Show>
      <Skeleton
        class="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            '--skeleton-width': width,
          } as JSX.CSSProperties
        }
      />
    </div>
  );
}

function SidebarMenuSub(props: SidebarUlProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      class={cn(
        'mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5',
        'group-data-[collapsible=icon]:hidden',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SidebarMenuSubItem(props: SidebarLiProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      class={cn('group/menu-sub-item relative', local.class, local.className)}
      {...rest}
    />
  );
}

function SidebarMenuSubButton(props: SidebarMenuSubButtonProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'asChild',
    'size',
    'isActive',
  ]);
  const size = () => local.size ?? 'md';
  const active = () => local.isActive ?? false;

  return (
    <Dynamic
      component={local.asChild ? Slot.Root : 'a'}
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size()}
      data-active={active()}
      class={cn(
        'flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground',
        'data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground',
        size() === 'sm' && 'text-xs',
        size() === 'md' && 'text-sm',
        'group-data-[collapsible=icon]:hidden',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarContext,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};

type SidebarContextProps = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  hoverMode: boolean;
  isHoverExpanded: boolean;
  shouldElevateZIndex: boolean;
  setHovered: (hovered: boolean) => void;
};

type SidebarProviderProps = JSX.IntrinsicElements['div'] & {
  className?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hoverMode?: boolean;
};

type SidebarProps = JSX.IntrinsicElements['div'] & {
  className?: string;
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
};

type SidebarDivProps = JSX.IntrinsicElements['div'] & {
  className?: string;
};

type SidebarButtonProps = JSX.IntrinsicElements['button'] & {
  className?: string;
};

type SidebarMainProps = JSX.IntrinsicElements['main'] & {
  className?: string;
};

type SidebarUlProps = JSX.IntrinsicElements['ul'] & {
  className?: string;
};

type SidebarLiProps = JSX.IntrinsicElements['li'] & {
  className?: string;
};

type SidebarTriggerProps = ComponentProps<typeof Button> & {
  className?: string;
};

type SidebarInputProps = ComponentProps<typeof Input> & {
  className?: string;
};

type SidebarSeparatorProps = ComponentProps<typeof Separator> & {
  className?: string;
};

type SidebarGroupLabelProps = JSX.IntrinsicElements['div'] & {
  className?: string;
  asChild?: boolean;
};

type SidebarGroupActionProps = JSX.IntrinsicElements['button'] & {
  className?: string;
  asChild?: boolean;
};

type SidebarMenuButtonProps = JSX.IntrinsicElements['button'] & {
  className?: string;
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>;

type SidebarMenuActionProps = JSX.IntrinsicElements['button'] & {
  className?: string;
  asChild?: boolean;
  showOnHover?: boolean;
};

type SidebarMenuSkeletonProps = JSX.IntrinsicElements['div'] & {
  className?: string;
  showIcon?: boolean;
};

type SidebarMenuSubButtonProps = JSX.IntrinsicElements['a'] & {
  className?: string;
  asChild?: boolean;
  size?: 'sm' | 'md';
  isActive?: boolean;
};
