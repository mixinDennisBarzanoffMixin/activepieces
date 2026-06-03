import { Info } from 'lucide-solid';
import { Show } from 'solid-js';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type MetricCardProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  value: JSX.Element;
  description: string;
  subtitle?: string;
  iconColor: string;
  iconBgColor: string;
};

export const MetricCard = (props: MetricCardProps) => {
  return (
    <Card class="p-5">
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-muted-foreground">
            {props.title}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info class="h-3.5 w-3.5 text-muted-foreground/70 cursor-help" />
            </TooltipTrigger>
            <TooltipContent class="max-w-xs">
              {props.description}
            </TooltipContent>
          </Tooltip>
          <div
            class={cn(
              'size-8 rounded-full flex items-center justify-center shrink-0 ml-auto',
              props.iconBgColor,
            )}
          >
            <props.icon class={cn('size-4', props.iconColor)} />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <div class="text-2xl font-semibold text-foreground">
            {props.value}
          </div>
          <Show when={props.subtitle}>
            <div class="text-sm text-muted-foreground">{props.subtitle}</div>
          </Show>
        </div>
      </div>
    </Card>
  );
};

export const MetricCardSkeleton = () => {
  return (
    <Card class="p-5">
      <div class="flex items-start justify-between">
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-1.5">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-3.5 w-3.5 rounded-full" />
          </div>
          <div class="flex flex-col gap-1">
            <Skeleton class="h-8 w-28" />
            <Skeleton class="h-4 w-36" />
          </div>
        </div>
        <Skeleton class="size-9 rounded-full shrink-0" />
      </div>
    </Card>
  );
};
