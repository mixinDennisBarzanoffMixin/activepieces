import * as TabsPrimitive from '@kobalte/core/tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { splitProps, type ComponentProps } from 'solid-js';

import { cn } from '@/lib/utils';

function Tabs(props: TabsProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      class={cn(local.class, local.className)}
      {...rest}
    />
  );
}

const tabsListVariants = cva('inline-flex', {
  variants: {
    variant: {
      default:
        'items-center justify-center h-9 rounded-md bg-muted p-1 text-muted-foreground',
      outline: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const tabsTriggerVariants = cva('inline-flex items-center justify-center', {
  variants: {
    variant: {
      default:
        'whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs',
      outline:
        'px-3 py-1 text-sm font-medium ring-offset-background transition-all border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-foreground text-accent-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

function TabsList(props: TabsListProps) {
  const [local, rest] = splitProps(props, ['class', 'className', 'variant']);

  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      class={cn(
        tabsListVariants({
          variant: local.variant,
          className: cn(local.class, local.className),
        }),
      )}
      {...rest}
    />
  );
}

function TabsTrigger(props: TabsTriggerProps) {
  const [local, rest] = splitProps(props, ['class', 'className', 'variant']);

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      class={cn(
        tabsTriggerVariants({
          variant: local.variant,
          className: cn(local.class, local.className),
        }),
      )}
      {...rest}
    />
  );
}

function TabsContent(props: TabsContentProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      class={cn(
        'mt-5 ring-offset-background focus-visible:outline-hidden',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  tabsTriggerVariants,
};

type ClassProp = {
  class?: string;
  className?: string;
};

type TabsProps = Omit<ComponentProps<typeof TabsPrimitive.Root>, 'class'> &
  ClassProp;

type TabsListProps = Omit<ComponentProps<typeof TabsPrimitive.List>, 'class'> &
  VariantProps<typeof tabsListVariants> &
  ClassProp;

type TabsTriggerProps = Omit<
  ComponentProps<typeof TabsPrimitive.Trigger>,
  'class'
> &
  VariantProps<typeof tabsTriggerVariants> &
  ClassProp;

type TabsContentProps = Omit<
  ComponentProps<typeof TabsPrimitive.Content>,
  'class'
> &
  ClassProp;
