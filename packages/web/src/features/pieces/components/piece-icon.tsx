import { VariantProps, cva } from 'class-variance-authority';
import { Show } from 'solid-js';

import { ImageWithColorBackground } from '@/components/custom/image-with-color-background';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const pieceIconVariants = cva(
  'flex rounded-md items-center justify-center bg-background  ',
  {
    variants: {
      size: {
        xxl: 'size-[64px] min-w-[64px] min-h-[64px]',
        xl: 'size-[48px] min-w-[48px] min-h-[48px]',
        lg: 'size-[40px] min-w-[40px] min-h-[40px]',
        md: 'size-[36px] min-w-[36px] min-h-[36px]',
        sm: 'size-[30px] min-w-[30px] min-h-[30px]',
        xs: 'size-[25px] min-w-[25px] min-h-[25px]',
        xxs: 'size-[16px] min-w-[16px] min-h-[16px]',
      },
      border: {
        true: 'border border-solid',
      },
    },
    defaultVariants: {},
  },
);

const pieceIconVariantsWithPadding = cva('', {
  variants: {
    size: {
      xxl: 'p-4',
      xl: 'p-3',
      lg: 'p-2',
      md: 'p-1.75',
      sm: 'p-1.25',
      xs: 'p-1.25',
      xxs: 'p-0.5',
    },
  },
});

interface PieceIconProps extends VariantProps<typeof pieceIconVariants> {
  displayName?: string;
  logoUrl?: string;
  showTooltip: boolean;
  background?: string;
}

const PieceIcon = (props: PieceIconProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          class={cn(
            pieceIconVariants({ border: props.border, size: props.size }),
            'overflow-hidden',
          )}
          style={
            props.background ? { backgroundColor: props.background } : undefined
          }
        >
          <Show
            when={props.logoUrl}
            fallback={<Skeleton class="rounded-md w-full h-full" />}
          >
            <ImageWithColorBackground
              src={props.logoUrl}
              alt={props.displayName}
              class={cn(
                pieceIconVariantsWithPadding({ size: props.size }),
                'object-contain w-full h-full',
              )}
              key={props.logoUrl}
              fallback={<Skeleton class="rounded-md w-full h-full" />}
            />
          </Show>
        </div>
      </TooltipTrigger>
      <Show when={props.showTooltip} fallback={null}>
        <TooltipContent side="bottom">{props.displayName}</TooltipContent>
      </Show>
    </Tooltip>
  );
};
export { PieceIcon };
