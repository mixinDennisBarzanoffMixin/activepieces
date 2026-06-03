import { cva } from 'class-variance-authority';
import { splitProps, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

const cardVariants = cva('rounded-lg border bg-background text-foreground', {
  variants: {
    variant: {
      default: 'shadow-xs',
      interactive:
        'cursor-pointer hover:border-gray-400 transition-colors duration-200 flex flex-col justify-between',
    },
    isSelected: {
      true: 'border-gray-400',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    isSelected: false,
  },
});

function Card(props: CardProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'variant',
    'isSelected',
  ]);

  return (
    <div
      data-slot="card"
      class={cn(
        cardVariants({ variant: local.variant, isSelected: local.isSelected }),
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function CardHeader(props: CardBaseProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <div
      data-slot="card-header"
      class={cn('flex flex-col space-y-1.5 p-6', local.class, local.className)}
      {...rest}
    />
  );
}

function CardTitle(props: CardBaseProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <div
      data-slot="card-title"
      class={cn('leading-none font-semibold', local.class, local.className)}
      {...rest}
    />
  );
}

function CardDescription(props: CardBaseProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <div
      data-slot="card-description"
      class={cn('text-sm text-muted-foreground', local.class, local.className)}
      {...rest}
    />
  );
}

function CardAction(props: CardBaseProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <div
      data-slot="card-action"
      class={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function CardContent(props: CardBaseProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <div
      data-slot="card-content"
      class={cn('p-6 pt-0', local.class, local.className)}
      {...rest}
    />
  );
}

function CardFooter(props: CardBaseProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <div
      data-slot="card-footer"
      class={cn('flex items-center p-6 pt-0', local.class, local.className)}
      {...rest}
    />
  );
}

// Type definitions

type CardBaseProps = JSX.IntrinsicElements['div'] & {
  className?: string;
};

type CardProps = CardBaseProps & {
  variant?: 'default' | 'interactive';
  isSelected?: boolean;
};

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
