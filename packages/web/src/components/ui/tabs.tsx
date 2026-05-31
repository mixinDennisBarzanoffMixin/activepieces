import * as TabsPrimitive from '@kobalte/core/tabs';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

function Tabs({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root data-slot="tabs" class={cn(className)} {...props} />
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

function TabsList({
  className,
  variant,
  ...props
}: ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      class={cn(tabsListVariants({ variant, className }))}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  variant,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger> &
  VariantProps<typeof tabsTriggerVariants>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      class={cn(tabsTriggerVariants({ variant, className }))}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      class={cn(
        'mt-5 ring-offset-background focus-visible:outline-hidden',
        className,
      )}
      {...props}
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
