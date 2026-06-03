import { cva, type VariantProps } from 'class-variance-authority';
import { createEffect, onCleanup, splitProps, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { Shortcut } from '@/components/custom/shortcut';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Slot } from '@/components/ui/slot';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-normal whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary stroke-background text-primary-foreground enabled:hover:bg-primary/90',
        basic:
          'text-primary font-medium underline-offset-4 enabled:hover:bg-accent',
        secondary:
          'text-secondary-foreground bg-secondary enabled:hover:bg-secondary/80 enabled:hover:text-secondary-foreground',
        destructive:
          'bg-destructive text-white enabled:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
        outline:
          'border-input bg-background enabled:hover:bg-accent enabled:hover:text-accent-foreground border',
        accent: 'bg-accent text-accent-foreground enabled:hover:bg-accent/80',
        ghost:
          'hover:bg-gray-300/30 hover:text-accent-foreground dark:hover:bg-gray-300/10',
        link: 'text-primary underline-offset-4 hover:underline',
        transparent: 'text-primary enabled:hover:bg-transparent',
      },
      size: {
        default: 'h-9 px-3 py-2 has-[>svg]:px-2.5',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2',
        lg: 'h-10 rounded-md px-5 has-[>svg]:px-4',
        xl: 'h-11 rounded-md px-8 has-[>svg]:px-6',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    compoundVariants: [
      {
        variant: 'link',
        class: 'px-0',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function useKeyboardShortcut(
  keyboardShortcut: () => string | undefined,
  disabled: () => boolean | undefined,
  onKeyboardShortcut: () => (() => void) | undefined,
) {
  createEffect(() => {
    const shortcut = keyboardShortcut();
    if (!shortcut) return;

    const isMac = /(Mac)/i.test(navigator.userAgent);
    const isEscape = shortcut.toLocaleLowerCase() === 'esc';

    const handleKeyDown = (event: KeyboardEvent) => {
      const isEscapePressed = event.key === 'Escape' && isEscape;
      const isCtrlWithShortcut =
        event.key === shortcut.toLocaleLowerCase() &&
        (isMac ? event.metaKey : event.ctrlKey);

      if (isEscapePressed || isCtrlWithShortcut) {
        event.preventDefault();
        event.stopPropagation();
        if (onKeyboardShortcut() && !disabled()) {
          onKeyboardShortcut()?.();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  });
}

function renderButtonContent(
  loading: boolean,
  variant: ButtonProps['variant'],
  keyboardShortcut: string | undefined,
  children: JSX.Element,
) {
  if (loading) {
    return (
      <LoadingSpinner
        class={cn('size-5', {
          'stroke-background': variant === 'default' || variant === 'secondary',
          'stroke-foreground': variant !== 'default' && variant !== 'secondary',
        })}
      />
    );
  }

  if (keyboardShortcut) {
    return (
      <div class="flex justify-center items-center gap-2">
        {children}
        <Shortcut shortcutKey={keyboardShortcut} withCtrl={true} />
      </div>
    );
  }

  return children;
}

function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'variant',
    'size',
    'asChild',
    'loading',
    'keyboardShortcut',
    'onKeyboardShortcut',
    'disabled',
    'children',
    'onClick',
  ]);
  const variant = () => local.variant ?? 'default';
  const size = () => local.size ?? 'default';
  const loading = () => local.loading ?? false;
  const Comp = () => (local.asChild ? Slot.Root : 'button');

  useKeyboardShortcut(
    () => local.keyboardShortcut,
    () => local.disabled,
    () => local.onKeyboardShortcut,
  );

  return (
    <Dynamic
      component={Comp()}
      data-slot="button"
      data-variant={variant()}
      data-size={size()}
      class={cn(
        buttonVariants({
          variant: variant(),
          size: size(),
          className: cn(local.class, local.className),
        }),
      )}
      disabled={local.disabled || loading()}
      {...rest}
      onClick={(e: MouseEvent) => {
        if (loading()) {
          e.stopPropagation();
        } else if (local.onClick) {
          local.onClick(e);
        }
      }}
    >
      {renderButtonContent(
        loading(),
        variant(),
        local.keyboardShortcut,
        local.children,
      )}
    </Dynamic>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };

type ButtonProps = JSX.IntrinsicElements['button'] &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    asChild?: boolean;
    loading?: boolean;
    keyboardShortcut?: string;
    onKeyboardShortcut?: () => void;
  };
