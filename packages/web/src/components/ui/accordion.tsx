import * as AccordionPrimitive from '@kobalte/core/accordion';
import { ChevronDownIcon } from 'lucide-solid';
import { splitProps, type ComponentProps } from 'solid-js';

import { cn } from '@/lib/utils';

function Accordion(_props: AccordionProps) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      class={cn('rounded-md border', local.className)}
      {...rest}
    />
  );
}

function AccordionItem(_props: AccordionItemProps) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      class={cn(local.className)}
      {...rest}
    />
  );
}

function AccordionTrigger(_props: AccordionTriggerProps) {
  const [local, rest] = splitProps(_props, ['className', 'children']);
  return (
    <AccordionPrimitive.Header class="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        class={cn(
          'flex flex-1 items-center justify-between gap-4 rounded-md px-4 py-3 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
          local.className,
        )}
        {...rest}
      >
        {local.children}
        <ChevronDownIcon class="pointer-events-none size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent(_props: AccordionContentProps) {
  const [local, rest] = splitProps(_props, ['className', 'children']);
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      class="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...rest}
    >
      <div class={cn('px-3 pb-3', local.className)}>{local.children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
};

type AccordionProps = ClassName<ComponentProps<typeof AccordionPrimitive.Root>>;

type AccordionItemProps = ClassName<
  ComponentProps<typeof AccordionPrimitive.Item>
>;

type AccordionTriggerProps = ClassName<
  ComponentProps<typeof AccordionPrimitive.Trigger>
>;

type AccordionContentProps = ClassName<
  ComponentProps<typeof AccordionPrimitive.Content>
>;
