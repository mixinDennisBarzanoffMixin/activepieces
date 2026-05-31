import { type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-solid';
import { JSX } from 'solid-js';

import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ScrollButtonProps = {
  className?: string;
  variant?: VariantProps<typeof buttonVariants>['variant'];
  size?: VariantProps<typeof buttonVariants>['size'];
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

function ScrollButton({
  className,
  variant = 'outline',
  size = 'sm',
  ...props
}: ScrollButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      class={cn(
        'h-10 w-10 rounded-full transition-all duration-150 ease-out',
        className,
      )}
      onClick={() => document.querySelector('[role="log"]')?.scrollTo({ top: 999999, behavior: 'smooth' })}
      {...props}
    >
      <ChevronDown class="h-5 w-5" />
    </Button>
  );
}

export { ScrollButton };
