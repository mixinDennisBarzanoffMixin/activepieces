'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import {
  createMemo,
  For,
  mergeProps,
  Show,
  splitProps,
  type JSX,
  type JSXElement,
} from 'solid-js';

import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

function FieldSet(_props: ClassName<JSX.IntrinsicElements['fieldset']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <fieldset
      data-slot="field-set"
      class={cn(
        'flex flex-col gap-6',
        'has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3',
        local.className,
      )}
      {...props}
    />
  );
}

function FieldLegend(
  _props: ClassName<JSX.IntrinsicElements['legend']> & {
    variant?: 'legend' | 'label';
  },
) {
  const merged = mergeProps({ variant: 'legend' }, _props);
  const [local, props] = splitProps(merged, ['className', 'variant']);
  return (
    <legend
      data-slot="field-legend"
      data-variant={local.variant}
      class={cn(
        'mb-3 font-medium',
        'data-[variant=legend]:text-base',
        'data-[variant=label]:text-sm',
        local.className,
      )}
      {...props}
    />
  );
}

function FieldGroup(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="field-group"
      class={cn(
        'group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4',
        local.className,
      )}
      {...props}
    />
  );
}

const fieldVariants = cva(
  'group/field flex w-full gap-3 data-[invalid=true]:text-destructive',
  {
    variants: {
      orientation: {
        vertical: ['flex-col *:w-full [&>.sr-only]:w-auto'],
        horizontal: [
          'flex-row items-center',
          '*:data-[slot=field-label]:flex-auto',
          'has-[>[data-slot=field-content]]:items-start [&>[role=checkbox],[role=radio]]:has-[>[data-slot=field-content]]:mt-px',
        ],
        responsive: [
          'flex-col *:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto',
          '@md/field-group:*:data-[slot=field-label]:flex-auto',
          '@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:[&>[role=checkbox],[role=radio]]:has-[>[data-slot=field-content]]:mt-px',
        ],
      },
    },
    defaultVariants: {
      orientation: 'vertical',
    },
  },
);

function Field(
  _props: ClassName<JSX.IntrinsicElements['div']> &
    VariantProps<typeof fieldVariants>,
) {
  const merged = mergeProps({ orientation: 'vertical' }, _props);
  const [local, props] = splitProps(merged, ['className', 'orientation']);
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={local.orientation}
      class={cn(
        fieldVariants({ orientation: local.orientation }),
        local.className,
      )}
      {...props}
    />
  );
}

function FieldContent(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="field-content"
      class={cn(
        'group/field-content flex flex-1 flex-col gap-1.5 leading-snug',
        local.className,
      )}
      {...props}
    />
  );
}

function FieldLabel(_props: ClassName<JSX.ComponentProps<typeof Label>>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <Label
      data-slot="field-label"
      class={cn(
        'group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50',
        'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border data-[slot=field]:*:p-4',
        'has-data-[state=checked]:bg-primary/5 has-data-[state=checked]:border-primary dark:has-data-[state=checked]:bg-primary/10',
        local.className,
      )}
      {...props}
    />
  );
}

function FieldTitle(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="field-label"
      class={cn(
        'flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50',
        local.className,
      )}
      {...props}
    />
  );
}

function FieldDescription(_props: ClassName<JSX.IntrinsicElements['p']>) {
  const [local, props] = splitProps(_props, ['className']);
  return (
    <p
      data-slot="field-description"
      class={cn(
        'text-muted-foreground text-sm leading-normal font-normal group-has-data-[orientation=horizontal]/field:text-balance',
        'last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5',
        '[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4',
        local.className,
      )}
      {...props}
    />
  );
}

function FieldSeparator(
  _props: ClassName<JSX.IntrinsicElements['div']> & {
    children?: JSXElement;
  },
) {
  const [local, props] = splitProps(_props, ['children', 'className']);
  return (
    <div
      data-slot="field-separator"
      data-content={!!local.children}
      class={cn(
        'relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2',
        local.className,
      )}
      {...props}
    >
      <Separator class="absolute inset-0 top-1/2" />
      <Show when={local.children}>
        <span
          class="bg-background text-muted-foreground relative mx-auto block w-fit px-2"
          data-slot="field-separator-content"
        >
          {local.children}
        </span>
      </Show>
    </div>
  );
}

function FieldError(
  _props: ClassName<JSX.IntrinsicElements['div']> & {
    children?: JSXElement;
    errors?: Array<{ message?: string } | undefined>;
  },
) {
  const [local, props] = splitProps(_props, [
    'className',
    'children',
    'errors',
  ]);
  const content = createMemo(() => {
    if (local.children) {
      return local.children;
    }

    if (!local.errors?.length) {
      return null;
    }

    const uniqueErrors = [
      ...new Map(local.errors.map((error) => [error?.message, error])).values(),
    ];

    if (uniqueErrors.length == 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul class="ml-4 flex list-disc flex-col gap-1">
        <For each={uniqueErrors}>
          {(error) => (
            <Show when={error?.message}>
              <li>{error.message}</li>
            </Show>
          )}
        </For>
      </ul>
    );
  });

  return (
    <Show when={content()}>
      <div
        role="alert"
        data-slot="field-error"
        class={cn('text-destructive text-sm font-normal', local.className)}
        {...props}
      >
        {content()}
      </div>
    </Show>
  );
}

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
};

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
};
